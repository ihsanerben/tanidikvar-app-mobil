import * as SplashScreen from 'expo-splash-screen';
import { createContext, type PropsWithChildren, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

import { tokenManager } from '@/lib/auth/token-manager';
import { queryClient } from '@/lib/query/query-client';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import type { SessionStatus } from './session-engine';

const AuthContext = createContext<{ status: SessionStatus } | null>(null);
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const status = useSyncExternalStore(tokenManager.subscribe, tokenManager.getStatus, () => 'bootstrapping' as const);
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 12_000);
    void tokenManager.refresh().catch(() => undefined).finally(() => clearTimeout(timer));
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (status !== 'bootstrapping' || timedOut) void SplashScreen.hideAsync().catch(() => undefined);
    if (status === 'signedOut') queryClient.clear();
  }, [status, timedOut]);
  async function retry() {
    setRetrying(true);
    try { await tokenManager.refresh(); } catch { /* Recoverable session failure stays on this screen. */ }
    finally { setRetrying(false); }
  }
  const unavailable = status === 'unavailable' || (status === 'bootstrapping' && timedOut);
  return (
    <AuthContext.Provider value={{ status }}>
      {unavailable ? (
        <Screen>
          <View className="flex-1 justify-center gap-5">
            <Text className="text-2xl font-bold text-text">Oturumuna ulaşılamıyor</Text>
            <Text className="text-base text-muted">Bağlantını kontrol edip tekrar dene. Kayıtlı oturumun korunuyor.</Text>
            <Button label="Tekrar dene" disabled={retrying} onPress={() => { void retry(); }} testID="session-retry" />
            <Button label="Giriş ekranına dön" onPress={() => { void tokenManager.clear().catch(() => undefined); }} />
          </View>
        </Screen>
      ) : status === 'bootstrapping' ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  return value;
}
