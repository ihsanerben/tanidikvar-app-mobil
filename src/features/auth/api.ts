import type { components } from '../../../packages/api-client/schema';
import { api } from '@/lib/api/client';
import { tokenManager } from '@/lib/auth/token-manager';
import { queryClient } from '@/lib/query/query-client';

type Schema = components['schemas'];
export type CurrentUser = Schema['CurrentUserResponse'];
export const authKeys = { all: ['auth'] as const, me: () => ['auth', 'me'] as const };

export const authApi = {
  async login(body: Schema['LoginRequest']) {
    const generation = tokenManager.beginLogin();
    queryClient.clear();
    const response = await api.post('/api/auth/mobile/login', body);
    try {
      await tokenManager.persistSession(response.accessToken!, response.refreshToken!, generation);
    } catch (error) {
      await api.post('/api/auth/mobile/logout', { refreshToken: response.refreshToken! }).catch(() => undefined);
      throw error;
    }
    queryClient.setQueryData(authKeys.me(), response.user);
    return response.user;
  },
  me: (signal?: AbortSignal) => api.get('/api/me', { authenticated: true, signal }),
  register: (body: Schema['RegisterRequest']) => api.post('/api/auth/mobile/register', body),
  forgot: (body: Schema['EmailRequest']) => api.post('/api/auth/mobile/forgot-password', body),
  resend: (body: Schema['EmailRequest']) => api.post('/api/auth/mobile/resend-verification', body),
  verify: (body: Schema['TokenRequest']) => api.post('/api/auth/mobile/verify-email', body),
  async reset(body: Schema['ResetPasswordRequest']) {
    await api.post('/api/auth/mobile/reset-password', body);
    await tokenManager.clear();
    queryClient.clear();
  },
  async logout() {
    const stored = tokenManager.getRefreshToken().catch(() => null);
    // Clear locally even if revocation cannot reach the server.
    await tokenManager.clear();
    queryClient.clear();
    const refreshToken = await stored;
    if (refreshToken) await api.post('/api/auth/mobile/logout', { refreshToken }).catch(() => undefined);
  },
  async logoutAll() {
    await api.post('/api/me/logout-all', undefined, true);
    await tokenManager.clear();
    queryClient.clear();
  },
  async close(body: Schema['CloseAccountRequest']) {
    await api.post('/api/me/close-account', body, true);
    await tokenManager.clear();
    queryClient.clear();
  },
};
