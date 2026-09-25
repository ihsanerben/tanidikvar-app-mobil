import { ApiError } from '../../../packages/api-client/errors';
import { createSessionEngine, type TokenPair } from './session-engine';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function setup(rotate: (refresh: string) => Promise<TokenPair> = jest.fn<Promise<TokenPair>, [string]>()) {
  let stored: string | null = 'original-refresh';
  const storage = {
    read: jest.fn(async () => stored),
    write: jest.fn(async (value: string) => { stored = value; }),
    remove: jest.fn(async () => { stored = null; }),
  };
  return { engine: createSessionEngine(storage, rotate), storage, rotate, stored: () => stored };
}
const pair = { accessToken: 'new-access', refreshToken: 'new-refresh' };

describe('session engine', () => {
  it('coordinates concurrent refresh calls and persists rotation before authentication', async () => {
    const call = deferred<TokenPair>();
    const { engine, rotate, stored } = setup(jest.fn(() => call.promise));
    const a = engine.refresh(), b = engine.refresh();
    expect(a).toBe(b);
    call.resolve(pair);
    await expect(a).resolves.toBe('new-access');
    expect(rotate).toHaveBeenCalledTimes(1);
    expect(stored()).toBe('new-refresh');
    expect(engine.getStatus()).toBe('authenticated');
  });
  it('starts signed out when there is no stored token', async () => {
    const { engine, storage, rotate } = setup();
    storage.read.mockResolvedValue(null);
    await expect(engine.refresh()).resolves.toBeNull();
    expect(rotate).not.toHaveBeenCalled();
    expect(engine.getStatus()).toBe('signedOut');
  });
  it.each([401, 403])('removes invalid credentials on %s', async status => {
    const { engine, stored } = setup(jest.fn(async () => { throw new ApiError(status, 'AUTHENTICATION_REQUIRED'); }));
    await expect(engine.refresh()).resolves.toBeNull();
    expect(stored()).toBeNull();
    expect(engine.getStatus()).toBe('signedOut');
  });
  it.each([0, 429, 503])('retains refresh credentials on recoverable status %s', async status => {
    const { engine, stored } = setup(jest.fn(async () => { throw new ApiError(status, 'NETWORK_ERROR'); }));
    await expect(engine.refresh()).rejects.toBeInstanceOf(ApiError);
    expect(stored()).toBe('original-refresh');
    expect(engine.getAccessToken()).toBeNull();
    expect(engine.getStatus()).toBe('unavailable');
  });
  it('does not resurrect an account after logout during refresh', async () => {
    const call = deferred<TokenPair>();
    const started = deferred<void>();
    const { engine, stored, rotate } = setup(jest.fn(() => { started.resolve(); return call.promise; }));
    const refresh = engine.refresh();
    await started.promise;
    expect(rotate).toHaveBeenCalledTimes(1);
    await engine.invalidate();
    call.resolve(pair);
    await refresh;
    expect(engine.getStatus()).toBe('signedOut');
    expect(engine.getAccessToken()).toBeNull();
    expect(stored()).toBeNull();
  });
  it('does not overwrite a newer login with an old refresh result', async () => {
    const call = deferred<TokenPair>();
    const started = deferred<void>();
    const { engine, stored } = setup(jest.fn(() => { started.resolve(); return call.promise; }));
    const refresh = engine.refresh();
    await started.promise;
    const generation = engine.beginLogin();
    await engine.persist({ accessToken: 'other-access', refreshToken: 'other-refresh' }, generation);
    call.resolve(pair);
    await refresh;
    expect(engine.getAccessToken()).toBe('other-access');
    expect(stored()).toBe('other-refresh');
  });
  it('never authenticates if SecureStore write fails', async () => {
    const { engine, storage } = setup();
    storage.write.mockRejectedValue(new Error('disk'));
    await expect(engine.persist(pair)).rejects.toMatchObject({ code: 'STORAGE_ERROR' });
    expect(engine.getAccessToken()).toBeNull();
    expect(engine.getStatus()).toBe('signedOut');
  });
  it('remains locally signed out if secure deletion fails', async () => {
    const { engine, storage } = setup();
    await engine.persist(pair);
    storage.remove.mockRejectedValue(new Error('disk'));
    await expect(engine.invalidate()).rejects.toThrow();
    expect(engine.getAccessToken()).toBeNull();
    expect(engine.getStatus()).toBe('signedOut');
  });
});
