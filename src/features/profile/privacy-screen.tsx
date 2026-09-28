import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Page } from '@/components/ui/page';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
export function PrivacyScreen() {
  return <Page title="Verilerin ve gizlilik" backHref="/account" backLabel="Hesap ve güvenlik">
    <Card><Text variant="heading">Hesap ve katkıların</Text><Text>E-posta adresin hesabına giriş için kullanılır. Profil ve eğitim bilgilerin ile paylaştığın soru, cevap ve yorumlar topluluk özelliklerini sağlar. Paylaştığın içerik diğer kullanıcılar tarafından görülebilir.</Text></Card>
    <Card><Text variant="heading">Telefon bildirimleri</Text><Text>İzin verdiğinde bu cihazın bildirim adresi hesabındaki oturuma bağlanır. Gönderimler Expo, Apple ve Google bildirim hizmetlerinden geçer. Bildirimleri cihaz ayarlarından veya Bildirimler ekranından kapatabilirsin.</Text><Button label="Bildirim tercihleri" onPress={() => router.push('/profile/preferences')} /></Card>
    <Card><Text variant="heading">Hata ve performans bilgileri</Text><Text>Hata izleme etkinleştirildiğinde uygulama sürümü, cihaz ve işletim sistemi bilgileri ile temizlenmiş hata kayıtları Sentry hizmetine iletilir. Şifre, oturum anahtarı ve form içerikleri hata raporlarına eklenmez.</Text></Card>
    <Card><Text variant="heading">Hesabını yönet</Text><Text>Hesabını kapatmak oturumlarını sonlandırır ve hesabını pasifleştirir. Bu işlem geçmiş kayıtların tamamının fiziksel olarak silindiği anlamına gelmez. Verilerinle ilgili taleplerin için bize ulaşabilirsin.</Text><Button label="Hesap ayarları" onPress={() => router.push('/account')} /><Button label="Destekle iletişim kur" variant="secondary" onPress={() => { void Linking.openURL('mailto:tanidikvar@gmail.com').catch(() => undefined); }} /></Card>
  </Page>;
}
