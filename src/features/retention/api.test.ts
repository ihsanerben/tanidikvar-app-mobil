import { QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  findRetentionState,
  refreshRetention,
  retentionKeys,
  setRetention,
} from "./api";
jest.mock("@/lib/api/client", () => ({ api: { call: jest.fn() } }));
const call = jest.mocked(api.call);
beforeEach(() => call.mockReset());
describe("retention API and cache", () => {
  it("finds saved questions beyond the first page and propagates cancellation", async () => {
    const signal = new AbortController().signal;
    call
      .mockResolvedValueOnce({
        items: [],
        page: 0,
        size: 100,
        totalElements: 101,
      })
      .mockResolvedValueOnce({
        items: [{ targetType: "QUESTION", targetId: "target", active: true }],
        page: 1,
        size: 100,
        totalElements: 101,
      });
    expect(await findRetentionState("saved", "target", signal)).toBe(true);
    expect(call).toHaveBeenLastCalledWith("get", "/api/me/saved", {
      query: { page: 1, size: 100 },
      authenticated: true,
      signal,
    });
  });
  it("does not mistake another target type for a saved question", async () => {
    call.mockResolvedValueOnce({
      items: [{ targetType: "ANSWER", targetId: "target", active: true }],
      page: 0,
      size: 100,
      totalElements: 1,
    });
    expect(await findRetentionState("saved", "target")).toBe(false);
  });
  it("propagates lookup failures instead of pretending the item is absent", async () => {
    call.mockRejectedValueOnce(new Error("offline"));
    await expect(findRetentionState("follows", "target")).rejects.toThrow(
      "offline",
    );
  });
  it("sends explicit idempotent active state for the permitted target type", async () => {
    call.mockResolvedValueOnce({ active: false });
    await setRetention("follows", "target", false);
    expect(call).toHaveBeenCalledWith("put", "/api/me/follows", {
      body: { targetType: "UNIVERSITY", targetId: "target", active: false },
      authenticated: true,
    });
  });
  it("updates the authoritative toggle and invalidates only the affected collection", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity } },
    });
    client.setQueryData(retentionKeys.list("saved"), { pages: [] });
    client.setQueryData(retentionKeys.list("follows"), { pages: [] });
    client.setQueryData(retentionKeys.state("saved", "other"), true);
    await refreshRetention(client, "saved", "target", false);
    expect(client.getQueryData(retentionKeys.state("saved", "target"))).toBe(
      false,
    );
    expect(client.getQueryData(retentionKeys.state("saved", "other"))).toBe(
      true,
    );
    expect(
      client.getQueryState(retentionKeys.list("saved"))?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(retentionKeys.list("follows"))?.isInvalidated,
    ).toBe(false);
    client.clear();
  });
});
