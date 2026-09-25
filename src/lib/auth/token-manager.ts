import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import { createApiClient } from '../../../packages/api-client/client';
import { ApiError } from '../../../packages/api-client/errors';
import { env } from '@/lib/env';
import { createSessionEngine } from './session-engine';

const key = 'auth.refresh-token';
const pairSchema = z.object({ accessToken: z.string().min(1).max(4096), refreshToken: z.string().min(1).max(4096) });
const transport = createApiClient(env.EXPO_PUBLIC_API_URL, {
  getAccessToken: () => null,
  refresh: async () => null,
  invalidate: async () => undefined,
});
const engine = createSessionEngine({
  read: () => SecureStore.getItemAsync(key),
  write: value => SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  remove: () => SecureStore.deleteItemAsync(key),
}, async refreshToken => {
  const result = await transport.request<unknown>('/api/auth/mobile/refresh', { method: 'POST', body: { refreshToken } });
  const parsed = pairSchema.safeParse(result);
  if (!parsed.success) throw new ApiError(0, 'INVALID_RESPONSE');
  return parsed.data;
});

export const tokenManager = {
  ...engine,
  clear: engine.invalidate,
  async persistSession(accessToken: string, refreshToken: string, generation?: number) {
    const result = pairSchema.safeParse({ accessToken, refreshToken });
    if (!result.success) throw new ApiError(0, 'INVALID_RESPONSE');
    await engine.persist(result.data, generation);
  },
};
