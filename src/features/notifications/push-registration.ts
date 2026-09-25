import { ApiError } from '../../../packages/api-client/errors';
export type PushState = 'disabled' | 'enabled' | 'denied' | 'unavailable';
type Permission = { granted: boolean; canAskAgain: boolean };
type Dependencies = {
  supported(): boolean;
  preference(): Promise<boolean>;
  savePreference(enabled: boolean): Promise<void>;
  permission(ask: boolean): Promise<Permission>;
  token(): Promise<string>;
  register(token: string): Promise<unknown>;
  unregister(): Promise<unknown>;
  generation(): number;
  authenticated(): boolean;
};

/** Serializes permission/token callbacks, with a session fence before each server write. */
export function createPushRegistration(deps: Dependencies, tokenTimeoutMs = 10_000) {
  let queue: Promise<unknown> = Promise.resolve();
  return (action: 'sync' | 'enable' | 'disable'): Promise<PushState> => {
    const generation = deps.generation();
    const current = () => generation === deps.generation() && deps.authenticated();
    const run = async (): Promise<PushState> => {
      if (!deps.supported()) return 'unavailable';
      if (!current()) return 'disabled';
      if (action === 'disable') {
        await deps.savePreference(false);
        if (current()) await deps.unregister();
        return 'disabled';
      }
      const enabled = action === 'enable' || await deps.preference();
      if (!enabled) {
        if (current()) await deps.unregister();
        return 'disabled';
      }
      const permission = await deps.permission(action === 'enable');
      if (!current()) return 'disabled';
      if (!permission.granted) {
        await deps.unregister();
        return 'denied';
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      let token: string;
      try {
        token = await Promise.race([deps.token(), new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new ApiError(0, 'TIMEOUT')), tokenTimeoutMs);
        })]);
      } finally { clearTimeout(timer); }
      if (!current()) return 'disabled';
      await deps.register(token);
      if (!current()) return 'disabled';
      await deps.savePreference(true);
      return 'enabled';
    };
    const result = queue.then(run, run);
    queue = result.catch(() => undefined);
    return result;
  };
}
