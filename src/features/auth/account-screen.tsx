import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { authApi, authKeys } from './api';
import { Page } from '@/components/ui/page';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ErrorState, Skeleton, useOffline } from '@/components/ui/states';

export function AccountScreen() {
  const user = useQuery({ queryKey: authKeys.me(), queryFn: ({ signal }) => authApi.me(signal), staleTime: 30_000 });
  const logout = useMutation({ mutationFn: authApi.logout, retry: 0 });
  const logoutAll = useMutation({ mutationFn: authApi.logoutAll, retry: 0 });
  const offline = useOffline();
  const busy = logout.isPending || logoutAll.isPending;
  return <Page title="Hesabım">
    {user.isPending ? <Skeleton /> : user.isError ? <ErrorState error={user.error} retry={() => { void user.refetch(); }} /> : <Text>{user.data.email}</Text>}
    {user.data?.role === 'MANAGER' && <Text variant="muted">Yönetim işlemleri web uygulamasından yapılır.</Text>}
    <Button label="Verilerin ve gizlilik" testID="privacy-open" variant="secondary" onPress={() => router.push('/profile/privacy')} />
    <Button label="Çıkış yap" testID="logout-submit" disabled={busy} onPress={() => logout.mutate()} />
    <Button label="Tüm cihazlardan çıkış yap" testID="logout-all-submit" disabled={busy || offline} onPress={() => logoutAll.mutate()} />
    {logout.error && <ErrorState error={logout.error} />}
    {logoutAll.error && <ErrorState error={logoutAll.error} />}
    {user.isSuccess && user.data.role !== 'MANAGER' && <Button label="Hesabımı kapat" variant="danger" onPress={() => router.push('/close-account')} />}
  </Page>;
}
