import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { createApiClient } from "../../../packages/api-client/client";
import { tokenManager } from "@/lib/auth/token-manager";
import { env } from "@/lib/env";
import { authApi, authKeys } from "@/features/auth/api";
import { myProfile } from "./api";
import { ProfileIdentityCard, type ContributionSummary } from './profile-identity-card';

const summaryClient = createApiClient(env.EXPO_PUBLIC_API_URL, tokenManager);
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('tr-TR', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul'}).format(new Date(value)) : null;

function AccountLink({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  return <Pressable accessibilityRole="link" accessibilityLabel={label} testID={testID}
    onPress={onPress} className="min-h-12 w-metric-half flex-row items-center justify-between rounded-control border border-secondary-border bg-surface px-2.5 active:opacity-70">
    <Text className="min-w-0 flex-1 text-caption font-semibold text-primary">{label}</Text>
    <Text className="text-xl text-muted">›</Text>
  </Pressable>;
}

export function ProfileScreen() {
  const profile = useQuery(myProfile());
  const user = useQuery({ queryKey: authKeys.me(), queryFn: ({ signal }) => authApi.me(signal), staleTime: 30_000 });
  const tanidikProfile = useQuery({ queryKey: ['profiles', user.data?.id, 'tanidik-details'], staleTime: 30_000, enabled: user.data?.role === 'TANIDIK' && !!user.data.id, queryFn: ({ signal }) => api.call('get', '/api/tanidiklar/{id}', { params: { id: user.data!.id! }, signal }) });
  const publicProfile = useQuery({ queryKey: ['profiles', user.data?.id, 'account-details'], staleTime: 30_000, enabled: user.data?.role !== 'TANIDIK' && user.data?.role !== 'MANAGER' && !!user.data?.id, queryFn: ({ signal }) => api.call('get', '/api/profiles/{id}', { params: { id: user.data!.id! }, signal }) });
  const summary = useQuery({ queryKey: ['profile-contribution-summary', user.data?.id], staleTime: 30_000, enabled: !!user.data?.id, queryFn: ({ signal }) => summaryClient.request<ContributionSummary>('/api/me/contribution-summary', {method: 'GET', authenticated: true, signal}) });
  const logout = useMutation({ mutationFn: authApi.logout, retry: 0 });
  const name = [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(" ") || user.data?.email || "Üye";
  return <Page title="Hesabım" back={false}
    help="Profilini, sorularını, yorumlarını, takiplerini, kayıtlarını, bildirimlerini ve Tanıdık başvurunu buradan yönetebilirsin."
    refresh={() => { void profile.refetch(); void user.refetch(); void summary.refetch(); }}
    refreshing={profile.isRefetching || user.isRefetching}>
    {(profile.isPending || user.isPending) && <Skeleton />}
    {((profile.isError && !profile.data) || (user.isError && !user.data)) &&
      <ErrorState error={profile.error || user.error} retry={() => { void profile.refetch(); void user.refetch(); }} />}
    {profile.data && user.data && <>
      <ProfileIdentityCard account name={name} profileId={user.data.role === 'MANAGER' ? undefined : user.data.id} educationStatus={profile.data.educationStatus} tanidik={user.data.role === 'TANIDIK'} badgeLabel={user.data.role === 'MANAGER' ? 'Yönetici' : undefined}
        subtitle={[profile.data.education?.universityName, profile.data.education?.departmentName].filter(Boolean).join(' · ')} biography={profile.data.biography}
        facts={[{ label: 'Şirket', value: profile.data.company }, { label: 'Meslek', value: profile.data.occupation }, { label: 'Mezuniyet yılı', value: profile.data.graduationYear }, { label: 'Hesap açılışı', value: formatDate(tanidikProfile.data?.createdAt ?? publicProfile.data?.createdAt) }]}
        contributionSummary={summary.data}
        links={[...(profile.data.linkedinUrl ? [{ label: 'LinkedIn', url: profile.data.linkedinUrl }] : []), ...(profile.data.portfolioUrl ? [{ label: 'Portfolyo', url: profile.data.portfolioUrl }] : [])]} />
      {tanidikProfile.isError && <ErrorState error={tanidikProfile.error} retry={() => void tanidikProfile.refetch()} />}
      <Card className="gap-0 px-gutter py-account-inset">
      <View className="flex-row flex-wrap justify-between gap-y-2">
        <AccountLink label="Profilimi düzenle" testID="edit-profile" onPress={() => router.push("/profile/edit")} />
        <AccountLink label="Bildirimler" onPress={() => router.push("/bildirimler")} />
        <AccountLink label="Sorularım" onPress={() => router.push("/my-questions")} />
        <AccountLink label="Yorumlarım" onPress={() => router.push("/my-comments")} />
        <AccountLink label="Takipler" testID="my-collections" onPress={() => router.push("/collection?kind=follows")} />
        <AccountLink label="Kaydedilenler" onPress={() => router.push("/collection?kind=saved")} />
        <AccountLink label="Rozet vitrinim" onPress={() => router.push({ pathname: "/achievements/[id]", params: { id: user.data.id! } })} />
        <AccountLink label="Tanıdık başvurularım" onPress={() => router.push("/profile/application")} />
      </View>
      {user.data.role === "MANAGER" && <View className="mt-3 flex-row flex-wrap justify-between gap-y-2"><AccountLink label="Yönetim alanı" onPress={() => router.push("/manager")} /></View>}
      <View className="mt-3.5 gap-2">
        <Button label="Geliştirme öner" variant="suggestion" fullWidth size="large" onPress={() => router.push("/profile/suggestion")} />
        <Button label="Çıkış yap" testID="logout-submit" variant="danger"
          fullWidth size="large" pending={logout.isPending} onPress={() => logout.mutate()} />
      </View>
      {logout.error && <ErrorState error={logout.error} />}
    </Card></>}
  </Page>;
}
