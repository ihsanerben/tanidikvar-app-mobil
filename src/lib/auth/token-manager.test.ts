import * as SecureStore from 'expo-secure-store';

import { tokenManager } from '@/lib/auth/token-manager';

jest.mock('@/lib/env', () => ({ env: { EXPO_PUBLIC_API_URL: 'https://api.example.test' } }));

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const mockedSecureStore = jest.mocked(SecureStore);

describe('tokenManager', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await tokenManager.clear();
    jest.clearAllMocks();
  });

  it('access tokenı yalnız bellekte, refresh tokenı SecureStore içinde saklar', async () => {
    await tokenManager.persistSession('access-token', 'refresh-token');

    expect(tokenManager.getAccessToken()).toBe('access-token');
    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth.refresh-token',
      'refresh-token',
      { keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' },
    );
  });

  it('oturum temizliğinde bellek ve SecureStore değerlerini kaldırır', async () => {
    await tokenManager.persistSession('access-token', 'refresh-token');
    await tokenManager.clear();

    expect(tokenManager.getAccessToken()).toBeNull();
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.refresh-token');
  });
});
