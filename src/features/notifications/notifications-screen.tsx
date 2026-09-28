import { Switch } from "@/components/ui/switch";
import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import type { ListRenderItem } from '@shopify/flash-list';
import { Screen } from '@/components/ui/screen';
import { PageHeader } from '@/components/ui/page';
import { PagedList } from '@/components/ui/paged-list';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/states';
import { api } from '@/lib/api/client';
import { nextPage } from '@/lib/query/pagination';
import { notificationKeys, type Notification } from './api';
import { NotificationRow } from './notification-row';
import { PushPermissionCard } from './push-permission-card';
import { PreferencesForm } from '@/features/profile/preferences-screen';

const renderNotification: ListRenderItem<Notification> = ({ item }) => <NotificationRow item={item} />;
export function NotificationsScreen() {
  const [draftType, setDraftType] = useState('');
  const [draftUnread, setDraftUnread] = useState(false);
  const [filter, setFilter] = useState({ type: '', unread: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const query = useInfiniteQuery({ queryKey: [...notificationKeys.list(), filter], staleTime: 30_000, initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.call('get', '/api/me/notifications', { authenticated: true, query: { page: pageParam, size: 20, targetType:filter.type||undefined,unread:filter.unread }, signal }),
    getNextPageParam: nextPage, refetchInterval: 60_000, refetchIntervalInBackground: false });
  return <Screen><View testID="notifications-screen" className="flex-1">
    <PagedList query={query} renderItem={renderNotification}
      footer={<PushPermissionCard />}
      empty={<EmptyState title="Bildirim bulunamadı" description="Seçtiğin filtrelere uygun bir bildirim yok." />}
      header={<View className="gap-3 pb-5">
      <PageHeader title="Bildirimler" backHref="/profil" backLabel="Hesabıma dön" help="Hesabın, başvuruların, soruların, yorumların ve takiplerinle ilgili bildirimleri burada yönetebilirsin." />
      <Card className="gap-2 p-3">
      <Select label="Bildirim türü" value={draftType} options={[{ value: '', label: 'Tümü' }, { value: 'QUESTION', label: 'Sorular' }, { value: 'ANSWER', label: 'Yorumlar' }, {value:'ANSWER_COMMENT',label:'Yanıtlar'},{value:'POLL',label:'Anketler'},{value:'EVALUATION',label:'Değerlendirmeler'},{value:'EXPERIENCE',label:'Deneyimler'},{value:'METRIC',label:'Ölçümler'},{value:'ACHIEVEMENT',label:'Rozetler'},{ value: 'APPLICATION', label: 'Başvurular' }, { value: 'ACCOUNT', label: 'Hesap' }]} onChange={setDraftType} />
      <View className="flex-row items-center justify-between"><Text>Yalnız okunmamışlar</Text><Switch value={draftUnread} onValueChange={setDraftUnread} accessibilityLabel="Yalnız okunmamışlar" /></View>
      <View className="flex-row flex-wrap gap-2"><Button label="Filtrele" onPress={() => setFilter({ type: draftType, unread: draftUnread })} /><Button label="Temizle" variant="secondary" onPress={() => { setDraftType(''); setDraftUnread(false); setFilter({ type: '', unread: false }); }} /></View>
      <Button label="Bildirim ayarları" variant="secondary" onPress={() => setSettingsOpen(true)} />
      </Card>
    </View>} />
    <BottomSheet visible={settingsOpen} title="Bildirim ayarları" close={() => setSettingsOpen(false)}><PreferencesForm onSaved={() => setSettingsOpen(false)} /></BottomSheet>
  </View></Screen>;
}
