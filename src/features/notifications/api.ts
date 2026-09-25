import { infiniteQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { nextPage } from '@/lib/query/pagination';
import type { components } from '../../../packages/api-client/schema';

export type Notification = components['schemas']['NotificationResponse'];
export const notificationKeys = { all: ['notifications'] as const, list: () => ['notifications', 'list'] as const };
export const notificationsQuery = () => infiniteQueryOptions({
  queryKey: notificationKeys.list(), staleTime: 30_000, initialPageParam: 0,
  refetchInterval: 60_000, refetchIntervalInBackground: false,
  queryFn: ({ pageParam, signal }) => api.call('get', '/api/me/notifications', { authenticated: true, query: { page: pageParam, size: 20 }, signal }),
  getNextPageParam: nextPage,
});
export const readNotification = (id: string) => api.call('put', '/api/me/notifications/{id}/read', { params: { id }, authenticated: true });
export const registerPushDevice = (pushToken: string, platform: 'IOS' | 'ANDROID') => api.call('put', '/api/me/push-device', { authenticated: true, body: { pushToken, platform } });
export const unregisterPushDevice = () => api.call('delete', '/api/me/push-device', { authenticated: true });
