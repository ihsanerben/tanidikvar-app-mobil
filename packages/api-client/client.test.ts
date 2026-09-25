import { createApiClient, type SessionAdapter, type Fetcher } from "./client";
import { responseError } from "./errors";
import { endpointUrl } from "./typed-client";

function response(
  status: number,
  body?: unknown,
  headers?: Record<string, string>,
) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers,
  });
}
function setup() {
  const adapter: SessionAdapter = {
    getAccessToken: jest.fn(() => "access"),
    refresh: jest.fn(async () => "rotated"),
    invalidate: jest.fn(async () => undefined),
    getGeneration: jest.fn(() => 1),
  };
  const fetcher = jest.fn<ReturnType<Fetcher>, Parameters<Fetcher>>();
  return {
    adapter,
    fetcher,
    api: createApiClient("https://api.example.test", adapter, fetcher),
  };
}
describe("API transport", () => {
  it("omits cookies, sends Bearer only on authenticated calls and accepts empty responses", async () => {
    const { api, fetcher } = setup();
    fetcher.mockResolvedValue(response(204));
    await expect(
      api.request("/api/me/logout-all", {
        method: "POST",
        authenticated: true,
      }),
    ).resolves.toBeUndefined();
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      credentials: "omit",
      headers: { Authorization: "Bearer access" },
    });
    await api.request("/api/auth/mobile/login", {
      method: "POST",
      body: { email: "example" },
    });
    expect(fetcher.mock.calls[1][1]?.headers).not.toHaveProperty(
      "Authorization",
    );
  });
  it("retries an authenticated 401 only once", async () => {
    const { api, fetcher, adapter } = setup();
    fetcher.mockImplementation(async () =>
      response(401, { code: "AUTHENTICATION_REQUIRED" }),
    );
    await expect(
      api.request("/api/me", { authenticated: true }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(adapter.refresh).toHaveBeenCalledTimes(1);
    expect(adapter.invalidate).toHaveBeenCalledTimes(1);
  });
  it("does not refresh a failed login or public request", async () => {
    const { api, fetcher, adapter } = setup();
    fetcher.mockResolvedValue(
      response(401, { code: "AUTHENTICATION_REQUIRED" }),
    );
    await expect(
      api.request("/api/auth/mobile/login", { method: "POST" }),
    ).rejects.toMatchObject({ status: 401 });
    expect(adapter.refresh).not.toHaveBeenCalled();
  });
  it("uses a token already rotated for a late old-token 401", async () => {
    const { api, fetcher, adapter } = setup();
    fetcher
      .mockImplementationOnce(async () => {
        adapter.getAccessToken = () => "rotated";
        return response(401);
      })
      .mockResolvedValueOnce(response(200, { id: "user" }));
    await expect(
      api.request("/api/me", { authenticated: true }),
    ).resolves.toEqual({ id: "user" });
    expect(adapter.refresh).not.toHaveBeenCalled();
    expect(fetcher.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: "Bearer rotated",
    });
  });
  it("never refreshes a request belonging to a previous login", async () => {
    const { api, fetcher, adapter } = setup();
    fetcher.mockImplementation(async () => {
      adapter.getGeneration = () => 2;
      return response(401);
    });
    await expect(
      api.request("/api/me", { authenticated: true }),
    ).rejects.toMatchObject({ code: "SESSION_CHANGED" });
    expect(adapter.refresh).not.toHaveBeenCalled();
    expect(adapter.invalidate).not.toHaveBeenCalled();
  });
  it("rejects non-JSON success and handles non-JSON errors safely", async () => {
    const { api, fetcher } = setup();
    fetcher
      .mockResolvedValueOnce(
        new Response("<html>failure</html>", { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response("<html>secret</html>", { status: 503 }),
      );
    await expect(api.request("/api/me")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    await expect(api.request("/api/me")).rejects.not.toHaveProperty(
      "message",
      "<html>secret</html>",
    );
  });
  it("maps field errors and Retry-After without exposing backend text", () => {
    const error = responseError(
      429,
      {
        code: "RATE_LIMITED",
        message: "secret",
        fieldErrors: { email: "raw backend detail" },
        requestId: "request-123",
      },
      new Headers({ "Retry-After": "30" }),
    );
    expect(error.retryAfter).toBe(30);
    expect(error.fieldErrors.email).toBe("Bu alanı kontrol et.");
    expect(error.requestId).toBe("request-123");
    expect(error.message).not.toContain("secret");
  });
  it("does not retry a non-idempotent failed network call", async () => {
    const { api, fetcher } = setup();
    fetcher.mockRejectedValue(new TypeError("offline"));
    await expect(
      api.request("/api/auth/mobile/register", { method: "POST" }),
    ).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("aborts requests at the 10 second boundary", async () => {
    jest.useFakeTimers();
    const { api, fetcher } = setup();
    fetcher.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
    );
    const result = expect(api.request("/api/me")).rejects.toMatchObject({
      code: "TIMEOUT",
    });
    await jest.advanceTimersByTimeAsync(10_000);
    await result;
    jest.useRealTimers();
  });
});

describe("product endpoint contract", () => {
  it("encodes route and filter values while preserving zero and false", () => {
    expect(
      endpointUrl(
        "/api/items/{id}",
        { id: "a/b" },
        {
          q: "İzmir & tıp",
          page: 0,
          active: false,
          skip: undefined,
          empty: "",
        },
      ),
    ).toBe("/api/items/a%2Fb?q=%C4%B0zmir+%26+t%C4%B1p&page=0&active=false");
    expect(() => endpointUrl("/api/items/{id}")).toThrow(
      "Missing route parameter",
    );
  });
  it("maps nested question validation to the visible form field", () => {
    const error = responseError(
      400,
      {
        code: "VALIDATION_ERROR",
        fieldErrors: { "content.title": "backend detail" },
      },
      new Headers(),
    );
    expect(error.fieldErrors.title).toBe("Bu alanı kontrol et.");
  });
});

it('rejects successful private responses arriving after a session change', async () => {
  const { api, fetcher, adapter } = setup();
  fetcher.mockImplementation(async () => {
    jest.mocked(adapter.getGeneration!).mockReturnValue(2);
    return response(200,{private:'old-account'});
  });
  await expect(api.request('/api/me',{authenticated:true})).rejects.toMatchObject({code:'SESSION_CHANGED'});
});
it.each(['/api/../outside','/api/%2e%2e/outside','/api/me#fragment','/api/..\\outside'])('rejects escaping API path %s', async path => {
  const { api, fetcher } = setup(); await expect(api.request(path)).rejects.toMatchObject({code:'INVALID_REQUEST'}); expect(fetcher).not.toHaveBeenCalled();
});
