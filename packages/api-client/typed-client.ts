import type { paths } from "./schema";
import {
  createApiClient,
  type RequestOptions,
  type SessionAdapter,
} from "./client";

type Method = "get" | "post" | "put" | "delete";
type Routes<M extends Method> = {
  [P in keyof paths]: NonNullable<paths[P][M]> extends never ? never : P;
}[keyof paths];
type JsonContent<T> = T extends { content: { "application/json": infer Body } }
  ? Body
  : T extends { content: { "*/*": infer Body } }
    ? Body
    : void;
type RequestBody<T> = T extends { requestBody: infer Body }
  ? JsonContent<Body>
  : undefined;
type Success<T> = T extends { responses: infer Responses }
  ? JsonContent<Responses[Extract<keyof Responses, 200 | 201 | 202 | 204>]>
  : never;
type Params<T, K extends "path" | "query"> = T extends { parameters: infer P }
  ? K extends keyof P
    ? P[K]
    : never
  : never;
type CallOptions<T> = Pick<RequestOptions, "signal" | "authenticated"> & {
  query?: Params<T, "query">;
} & (T extends { parameters: { path: infer P } }
    ? { params: P }
    : { params?: never }) &
  (T extends { requestBody: unknown }
    ? { body: RequestBody<T> }
    : { body?: undefined });

export function endpointUrl(path: string, params?: object, query?: object) {
  const values = Object.fromEntries(Object.entries(params ?? {}));
  const resolved = path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value: unknown = values[key];
    if (typeof value !== "string" || !value)
      throw new Error("Missing route parameter");
    return encodeURIComponent(value);
  });
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value));
  }
  return resolved + (search.size ? "?" + search.toString() : "");
}
export function createTypedClient(baseUrl: string, session: SessionAdapter) {
  const client = createApiClient(baseUrl, session);
  return {
    call<M extends Method, P extends Routes<M>>(
      method: M,
      path: P,
      options: CallOptions<NonNullable<paths[P][M]>>,
    ) {
      return client.request<Success<NonNullable<paths[P][M]>>>(
        endpointUrl(path, options.params, options.query),
        {
          method: method.toUpperCase() as NonNullable<RequestOptions["method"]>,
          body: options.body,
          authenticated: options.authenticated,
          signal: options.signal,
        },
      );
    },
    get<P extends Routes<"get">>(
      path: P,
      options: Pick<RequestOptions, "authenticated" | "signal"> = {},
    ) {
      return client.request<Success<NonNullable<paths[P]["get"]>>>(path, {
        ...options,
        method: "GET",
      });
    },
    post<P extends Routes<"post">>(
      path: P,
      body: RequestBody<NonNullable<paths[P]["post"]>>,
      authenticated = false,
    ) {
      return client.request<Success<NonNullable<paths[P]["post"]>>>(path, {
        method: "POST",
        body,
        authenticated,
      });
    },
  };
}
