import { ApiError, responseError } from './errors';

export type SessionAdapter = {
  getAccessToken(): string | null;
  getGeneration?(): number;
  refresh(): Promise<string | null>;
  invalidate(): Promise<void>;
};
export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  authenticated?: boolean;
};

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;
export function createApiClient(baseUrl: string, session: SessionAdapter, fetcher: Fetcher = fetch) {
  const origin = new URL(baseUrl);
  async function send(path: string, options: RequestOptions, token: string | null) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) controller.abort();
    const timer = setTimeout(abort, 10_000);
    try {
      const response = await fetcher(new URL(path, origin).toString(), {
        method: options.method ?? 'GET',
        headers: { Accept: 'application/json', ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        credentials: 'omit',
        signal: controller.signal,
      });
      if (controller.signal.aborted) throw new ApiError(0, 'TIMEOUT');
      const text = await response.text();
      let data: unknown;
      if (text) {
        try { data = JSON.parse(text); }
        catch { if (response.ok) throw new ApiError(response.status, 'INVALID_RESPONSE'); }
      }
      if (!response.ok) throw responseError(response.status, data, response.headers);
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
    }
  }
  return {
    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      const pathname = path.split('?')[0];
      if (!path.startsWith('/api/') || /[\\#]/.test(path) || pathname.includes('://') || /(?:^|\/)\.\.?(?:\/|$)/.test(pathname) || /%2e|%2f|%5c/i.test(pathname)) throw new ApiError(0, 'INVALID_REQUEST');
      const token = options.authenticated ? session.getAccessToken() : null;
      const generation = session.getGeneration?.();
      const checkSession = () => {
        if (options.authenticated && generation !== session.getGeneration?.()) throw new ApiError(0, 'SESSION_CHANGED');
      };
      try { const result = await send(path, options, token) as T; checkSession(); return result; }
      catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401 || !options.authenticated || options.signal?.aborted) throw error;
        if (generation !== session.getGeneration?.()) throw new ApiError(0, 'SESSION_CHANGED');
        // A late 401 from the old access token must use the token already rotated by another request.
        let next = session.getAccessToken();
        if (next === token) next = await session.refresh();
        if (!next) throw error;
        if (generation !== session.getGeneration?.()) throw new ApiError(0, 'SESSION_CHANGED');
        try { const result = await send(path, options, next) as T; checkSession(); return result; }
        catch (retryError) {
          if (retryError instanceof ApiError && retryError.status === 401 && generation === session.getGeneration?.()) await session.invalidate();
          throw retryError;
        }
      }
    },
  };
}
