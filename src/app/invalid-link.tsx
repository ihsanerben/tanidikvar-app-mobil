import { router } from 'expo-router';
import { Page } from '@/components/ui/page';
import { EmptyState } from '@/components/ui/states';
export default function InvalidLinkScreen() {
  return <Page title="Bağlantı açılamadı"><EmptyState title="Geçersiz bağlantı" description="Bağlantıyı kontrol edebilir veya ana sayfadan devam edebilirsin." label="Ana sayfaya git" action={() => router.replace('/')} /></Page>;
}
