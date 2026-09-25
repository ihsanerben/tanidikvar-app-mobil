import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { incomingLink } from '@/lib/navigation/incoming-link';
import { destinationHref, isSafeDestination } from '@/lib/navigation/destination';
import { tokenManager } from '@/lib/auth/token-manager';
import { notificationKeys } from './api';

export function NotificationObserver() {
  const lastHandled = useRef<string | null>(null);
  const navigation = useRootNavigationState();
  const client = useQueryClient();
  const { status } = useAuth();
  useEffect(() => {
    if (Platform.OS === 'web' || !navigation?.key) return;
    Notifications.setNotificationHandler({ handleNotification: async () => ({
      shouldShowBanner: false, shouldShowList: tokenManager.getStatus() === 'authenticated', shouldPlaySound: false, shouldSetBadge: false,
    }) });
    function open(response: Notifications.NotificationResponse) {
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const id = response.notification.request.identifier;
      if (lastHandled.current === id) return;
      lastHandled.current = id;
      const target = incomingLink(response.notification.request.content.data?.url);
      Notifications.clearLastNotificationResponse();
      if (!target || !isSafeDestination(target)) return;
      // The protected layout preserves this validated destination through login.
      router.push(destinationHref(target));
    }
    const received = Notifications.addNotificationReceivedListener(() => { void client.invalidateQueries({ queryKey: notificationKeys.all }); });
    const tapped = Notifications.addNotificationResponseReceivedListener(open);
    const initial = Notifications.getLastNotificationResponse();
    if (initial) open(initial);
    return () => { received.remove(); tapped.remove(); Notifications.setNotificationHandler(null); };
  }, [navigation?.key, client]);
  useEffect(() => {
    if (Platform.OS !== 'web' && status === 'signedOut') {
      void Notifications.dismissAllNotificationsAsync().catch(() => undefined);
      void Notifications.setBadgeCountAsync(0).catch(() => undefined);
    }
  }, [status]);
  return null;
}
