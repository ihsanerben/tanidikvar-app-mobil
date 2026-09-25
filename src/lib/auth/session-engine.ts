import { ApiError } from '../../../packages/api-client/errors';

export type TokenPair = { accessToken: string; refreshToken: string };
export type SessionStatus = 'bootstrapping' | 'authenticated' | 'signedOut' | 'unavailable';
type Storage = { read(): Promise<string | null>; write(value: string): Promise<void>; remove(): Promise<void> };

/** Serial storage writes plus a generation counter prevent logout/refresh from resurrecting a session. */
export function createSessionEngine(storage: Storage, rotate: (refresh: string) => Promise<TokenPair>) {
  let access: string | null = null;
  let generation = 0;
  let state: SessionStatus = 'bootstrapping';
  let flight: Promise<string | null> | null = null;
  let storageQueue: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();
  const notify = (next: SessionStatus) => { state = next; listeners.forEach(fn => fn()); };
  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = storageQueue.then(operation, operation);
    storageQueue = result.catch(() => undefined);
    return result;
  }
  async function invalidate() {
    generation++; access = null; notify('signedOut');
    await enqueue(() => storage.remove());
  }
  async function persist(pair: TokenPair, expected = generation) {
    if (expected !== generation) throw new ApiError(0, 'SESSION_CHANGED');
    try {
      await enqueue(async () => {
        if (expected !== generation) throw new ApiError(0, 'SESSION_CHANGED');
        await storage.write(pair.refreshToken);
      });
    } catch (error) {
      if (expected === generation) {
        await invalidate().catch(() => undefined);
        throw new ApiError(0, 'STORAGE_ERROR');
      }
      throw error;
    }
    if (expected !== generation) throw new ApiError(0, 'SESSION_CHANGED');
    access = pair.accessToken;
    notify('authenticated');
  }
  function refresh(): Promise<string | null> {
    if (flight) return flight;
    const expected = generation;
    flight = (async () => {
      try {
        const stored = await enqueue(() => storage.read());
        if (expected !== generation) return null;
        if (!stored) { access = null; notify('signedOut'); return null; }
        const pair = await rotate(stored);
        await persist(pair, expected);
        return access;
      } catch (error) {
        if (expected !== generation) return null;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await invalidate();
          return null;
        }
        access = null; notify('unavailable');
        throw error;
      }
    })().finally(() => { flight = null; });
    return flight;
  }
  return {
    getAccessToken: () => access,
    getStatus: () => state,
    getGeneration: () => generation,
    beginLogin() { generation++; access = null; notify('signedOut'); return generation; },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getRefreshToken: () => enqueue(() => storage.read()),
    persist, refresh, invalidate,
  };
}
