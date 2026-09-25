import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PushProvider } from '@/features/notifications/push-provider';
import { AuthProvider } from '@/lib/auth/auth-context';
import { connectQueryToNativeLifecycle, queryClient } from '@/lib/query/query-client';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => connectQueryToNativeLifecycle(), []);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider><PushProvider>{children}</PushProvider></AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
