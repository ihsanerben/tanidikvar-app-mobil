import * as Linking from 'expo-linking';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ErrorState, useOffline } from '@/components/ui/states';
import { usePush } from './push-provider';
export function PushPermissionCard() {
  const push = usePush();
  const offline = useOffline();
  return <Card>
    <Text variant="heading">Telefonda bildirimler</Text>
    <Text variant="muted">Yeni gelişmelerden uygulama kapalıyken haberdar ol. İzin vermesen de bildirimlerini bu listeden okuyabilirsin.</Text>
    {push.state === 'unavailable' ? <Text variant="muted">Bu ortamda telefon bildirimleri kullanılamıyor.</Text> : <>
      <Text>{push.state === 'enabled' ? 'Bu cihazda açık' : push.state === 'denied' ? 'Telefon ayarlarında bildirim izni kapalı.' : 'Bu cihazda kapalı'}</Text>
      <Button testID="push-toggle" label={push.state === 'enabled' ? 'Bu cihazda kapat' : 'Bildirimleri aç'} disabled={offline} pending={push.busy} onPress={() => push.run(push.state === 'enabled' ? 'disable' : 'enable')} />
      {push.state === 'denied' && <Button label="Telefon ayarlarını aç" variant="secondary" onPress={() => { void Linking.openSettings().catch(() => undefined); }} />}
    </>}
    {!!push.error && <ErrorState error={push.error} retry={() => push.run('sync')} />}
  </Card>;
}
