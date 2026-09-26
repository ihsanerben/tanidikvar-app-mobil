import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Switch, View } from 'react-native';
import type { ListRenderItem } from '@shopify/flash-list';
import { Screen } from '@/components/ui/screen';
import { PageHeader } from '@/components/ui/page';
import { PagedList } from '@/components/ui/paged-list';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Choice } from '@/components/ui/choice';
import { ActionButton } from '@/components/ui/action-button';
import { destinationHref } from '@/lib/navigation/destination';
import { api } from '@/lib/api/client';
import { nextPage } from '@/lib/query/pagination';
import { notificationKeys, readNotification, type Notification } from './api';
import { notificationDestination } from './destination';
import { PushPermissionCard } from './push-permission-card';
import { PreferencesForm } from '@/features/profile/preferences-screen';

function NotificationCard({ item }: { item: Notification }) {
  const client = useQueryClient();
  const target = notificationDestination(item);
  return <Card className="gap-1"><View className="flex-row items-start gap-2"><View className={`mt-2 h-2 w-2 rounded-full ${item.readAt ? 'bg-border' : 'bg-primary'}`} /><View className="min-w-0 flex-1"><Text variant="heading">{item.title}</Text><Text>{item.body}</Text>
    <Text variant="muted">{item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : ''}</Text></View></View>
    {target && <Pressable accessibilityRole="link" testID={`notification-open-${item.id}`} onPress={() => router.push(destinationHref(target))} className="min-h-11 justify-center"><Text className="text-primary underline">İçeriği aç →</Text></Pressable>}
    {!item.readAt && item.id && <ActionButton label="Okundu işaretle" testID={`notification-read-${item.id}`} action={() => readNotification(item.id!)} after={() => client.invalidateQueries({ queryKey: notificationKeys.all })} />}
  </Card>;
}
const renderNotification: ListRenderItem<Notification> = ({ item }) => <NotificationCard item={item} />;
export function NotificationsScreen() {
  const [draftType, setDraftType] = useState('');
  const [draftUnread, setDraftUnread] = useState(false);
  const [filter, setFilter] = useState({ type: '', unread: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const query = useInfiniteQuery({ queryKey: [...notificationKeys.list(), filter], staleTime: 30_000, initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => { const page = await api.call('get', '/api/me/notifications', { authenticated: true, query: { page: pageParam, size: 20 }, signal }); return { ...page, items: (page.items ?? []).filter(item => (!filter.type || item.targetType === filter.type) && (!filter.unread || !item.readAt)) }; },
    getNextPageParam: nextPage, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const visibleCount = query.data?.pages.reduce((count, page) => count + (page.items?.length ?? 0), 0) ?? 0;
  useEffect(() => { if (query.data && visibleCount === 0 && query.hasNextPage && !query.isFetching) void query.fetchNextPage(); }, [query, visibleCount]);
  return <Screen><View testID="notifications-screen" className="flex-1">
    <PagedList query={query} renderItem={renderNotification} header={<View className="gap-3 pb-5">
      <PageHeader title="Bildirimler" back={false} help="Hesabın, başvuruların, soruların, yorumların ve takiplerinle ilgili bildirimleri burada yönetebilirsin." />
      <Choice label="Bildirim türü" value={draftType} options={[{ value: '', label: 'Tümü' }, { value: 'QUESTION', label: 'Sorular' }, { value: 'ANSWER', label: 'Yorumlar' }, { value: 'APPLICATION', label: 'Başvurular' }, { value: 'ACCOUNT', label: 'Hesap' }]} onChange={setDraftType} />
      <View className="flex-row items-center justify-between"><Text>Yalnız okunmamışlar</Text><Switch value={draftUnread} onValueChange={setDraftUnread} accessibilityLabel="Yalnız okunmamışlar" /></View>
      <View className="flex-row flex-wrap gap-2"><Button label="Filtrele" onPress={() => setFilter({ type: draftType, unread: draftUnread })} /><Button label="Temizle" variant="secondary" onPress={() => { setDraftType(''); setDraftUnread(false); setFilter({ type: '', unread: false }); }} /></View>
      <Button label="Bildirim ayarları" variant="secondary" onPress={() => setSettingsOpen(true)} />
      <PushPermissionCard />
    </View>} />
    <BottomSheet visible={settingsOpen} title="Bildirim ayarları" close={() => setSettingsOpen(false)}><PreferencesForm onSaved={() => setSettingsOpen(false)} /></BottomSheet>
  </View></Screen>;
}
