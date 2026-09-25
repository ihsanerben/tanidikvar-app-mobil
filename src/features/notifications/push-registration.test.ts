import { createPushRegistration } from './push-registration';
function setup() {
  const deps = {
    supported: () => true, preference: jest.fn(async () => false), savePreference: jest.fn(async (_enabled: boolean) => undefined),
    permission: jest.fn(async (_ask: boolean) => ({ granted: true, canAskAgain: true })), token: jest.fn(async () => 'token'),
    register: jest.fn(async (_token: string) => undefined), unregister: jest.fn(async () => undefined), generation: jest.fn(() => 1), authenticated: jest.fn(() => true),
  };
  return { deps, run: createPushRegistration(deps) };
}
it('does not request permission or a push token before opt-in', async () => {
  const { deps, run } = setup(); expect(await run('sync')).toBe('disabled');
  expect(deps.permission).not.toHaveBeenCalled(); expect(deps.token).not.toHaveBeenCalled();
});
it('registers only after contextual opt-in and granted permission', async () => {
  const { deps, run } = setup(); expect(await run('enable')).toBe('enabled');
  expect(deps.permission).toHaveBeenCalledWith(true); expect(deps.register).toHaveBeenCalledWith('token'); expect(deps.savePreference).toHaveBeenCalledWith(true);
});
it('revoked permission unregisters instead of requesting again during sync', async () => {
  const { deps, run } = setup(); deps.preference.mockResolvedValue(true); deps.permission.mockResolvedValue({ granted: false, canAskAgain: false });
  expect(await run('sync')).toBe('denied'); expect(deps.permission).toHaveBeenCalledWith(false); expect(deps.unregister).toHaveBeenCalled(); expect(deps.register).not.toHaveBeenCalled();
});
it('a native token result arriving after logout cannot register on the next account', async () => {
  const { deps, run } = setup(); deps.token.mockImplementation(async () => { deps.generation.mockReturnValue(2); return 'late'; });
  expect(await run('enable')).toBe('disabled'); expect(deps.register).not.toHaveBeenCalled();
});
it('disable is serialized after enable and leaves the registration removed', async () => {
  const { deps, run } = setup(); await Promise.all([run('enable'),run('disable')]);
  expect(deps.savePreference.mock.calls).toEqual([[true],[false]]); expect(deps.unregister).toHaveBeenCalledTimes(1);
});
it('a failed server registration can be retried without saving a false success', async () => {
  const { deps, run } = setup(); deps.register.mockRejectedValueOnce(new Error('offline'));
  await expect(run('enable')).rejects.toThrow(); expect(deps.savePreference).not.toHaveBeenCalled();
  expect(await run('enable')).toBe('enabled');
});

it('bounds native push token acquisition and lets the next request proceed', async () => {
  jest.useFakeTimers();
  try {
    const { deps } = setup();deps.token.mockImplementationOnce(() => new Promise(() => undefined));
    const run=createPushRegistration(deps,50);
    const pending=run('enable');
    const assertion=expect(pending).rejects.toMatchObject({code:'TIMEOUT'});
    await jest.advanceTimersByTimeAsync(50);await assertion;
    expect(deps.register).not.toHaveBeenCalled();
    expect(await run('enable')).toBe('enabled');
  } finally { jest.useRealTimers(); }
});
