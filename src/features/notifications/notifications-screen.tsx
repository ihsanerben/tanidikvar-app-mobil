import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';
import type { ListRenderItem } from '@shopify/flash-list';
import { Screen } from '@/components/ui/screen';
import { PageHeader } from '@/components/ui/page';
import { PagedList } from '@/components/ui/paged-list';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/action-button';
import { destinationHref } from '@/lib/navigation/destination';
import { notificationKeys, notificationsQuery, readNotification, type Notification } from './api';
import { notificationDestination } from './destination';
import { PushPermissionCard } from './push-permission-card';

function NotificationCard({ item }: { item: Notification }) {
  const client = useQueryClient();
  const target = notificationDestination(item);
  return <Card>
    <Text variant="muted">{item.readAt ? 'Okundu' : 'Okunmadı'}</Text>
    <Text variant="heading">{item.title}</Text><Text>{item.body}</Text>
    {target && <Button label="İçeriği aç" variant="secondary" testID={`notification-open-${item.id}`} onPress={() => router.push(destinationHref(target))} />}
    {!item.readAt && item.id && <ActionButton label="Okundu işaretle" testID={`notification-read-${item.id}`} action={() => readNotification(item.id!)} after={() => client.invalidateQueries({ queryKey: notificationKeys.all })} />}
  </Card>;
}
const renderNotification: ListRenderItem<Notification> = ({ item }) => <NotificationCard item={item} />;
export function NotificationsScreen() {
  const query = useInfiniteQuery(notificationsQuery());
  return <Screen><View testID="notifications-screen" className="flex-1"><PageHeader title="Bildirimler" back={false} />
    <PagedList query={query} renderItem={renderNotification} header={<PushPermissionCard />} />
  </View></Screen>;
}
