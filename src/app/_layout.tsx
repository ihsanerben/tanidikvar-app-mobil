import '@/global.css';
import * as Sentry from '@sentry/react-native';

import { NotificationObserver } from '@/features/notifications/notification-observer';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/components/app-providers';
import { initializeMonitoring } from '@/lib/monitoring/initialize-monitoring';

initializeMonitoring();

function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <NotificationObserver />
    </AppProviders>
  );
}

export default Sentry.wrap(RootLayout);
