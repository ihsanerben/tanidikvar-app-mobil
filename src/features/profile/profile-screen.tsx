import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Linking, Pressable, View } from "react-native";
import { cva } from "class-variance-authority";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { authApi, authKeys } from "@/features/auth/api";
import { myProfile } from "./api";
import { profileSchema } from "./schemas";

const educationLabel: Record<string, string> = {
  MEZUN: "Mezun", UNIVERSITE_OGRENCISI: "Üniversite Öğrencisi", YKS_ADAYI: "YKS Adayı",
};

const summary = cva("my-account-inset flex-row flex-wrap justify-between gap-y-2.5 rounded-control border border-border border-l-4 bg-account-summary p-3", {
  variants: { education: {
    MEZUN: "border-l-graduate", UNIVERSITE_OGRENCISI: "border-l-student",
    YKS_ADAYI: "border-l-candidate", USER: "border-l-primary",
  } },
});
function SummaryItem({ label, value, last = false }: { label: string; value?: string | null; last?: boolean }) {
  return <View className={`min-w-0 w-metric-half gap-1 py-1.5 ${last ? "" : "border-b border-border"}`}>
    <Text className="text-metadata text-muted">{label}</Text>
    <Text className="text-excerpt font-semibold text-primary">{value || "—"}</Text>
  </View>;
}

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
  const logout = useMutation({ mutationFn: authApi.logout, retry: 0 });
  const name = [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(" ") || user.data?.email || "Üye";
  return <Page title="Hesabım" back={false}
    help="Profilini, sorularını, yorumlarını, takiplerini, kayıtlarını, bildirimlerini ve Tanıdık başvurunu buradan yönetebilirsin."
    refresh={() => { void profile.refetch(); void user.refetch(); }}
    refreshing={profile.isRefetching || user.isRefetching}>
    {(profile.isPending || user.isPending) && <Skeleton />}
    {((profile.isError && !profile.data) || (user.isError && !user.data)) &&
      <ErrorState error={profile.error || user.error} retry={() => { void profile.refetch(); void user.refetch(); }} />}
    {profile.data && user.data && <Card className="gap-0 px-gutter py-account-inset">
      <View className="items-center">
        <Avatar name={name} educationStatus={profile.data.educationStatus ?? undefined} tanidik={user.data.role === "TANIDIK"} size="account" />
        <Text variant="heading" className="mt-3.5 mb-1 text-center text-account-name">{name}</Text>
        <Text variant="muted" className="text-center" selectable>{user.data.email}</Text>
        {(profile.data.linkedinUrl || profile.data.portfolioUrl) && <View className="mt-4 flex-row flex-wrap justify-center gap-2">
          {profile.data.linkedinUrl && profileSchema.shape.linkedinUrl.safeParse(profile.data.linkedinUrl).success &&
            <ActionButton label="LinkedIn ↗" action={() => Linking.openURL(profile.data!.linkedinUrl!)} />}
          {profile.data.portfolioUrl && profileSchema.shape.portfolioUrl.safeParse(profile.data.portfolioUrl).success &&
            <ActionButton label="Portfolyo ↗" action={() => Linking.openURL(profile.data!.portfolioUrl!)} />}
        </View>}
      </View>
      <View className={summary({ education: profile.data.educationStatus ?? "USER" })}>
        <SummaryItem label="Üniversite" value={profile.data.education?.universityName} />
        <SummaryItem label="Bölüm" value={profile.data.education?.departmentName} />
        <SummaryItem last label="Eğitim durumu" value={educationLabel[profile.data.educationStatus ?? ""] ?? "Üye"} />
        <SummaryItem last label="Yetki" value={user.data.role === "TANIDIK" ? "Tanıdık" : user.data.role === "MANAGER" ? "Manager" : "Üye"} />
      </View>
      <View className="flex-row flex-wrap justify-between gap-y-2">
        <AccountLink label="Profilimi düzenle" testID="edit-profile" onPress={() => router.push("/profile/edit")} />
        <AccountLink label="Sorularım" onPress={() => router.push("/my-questions")} />
        <AccountLink label="Yorumlarım" onPress={() => router.push("/my-comments")} />
        <AccountLink label="Takipler" testID="my-collections" onPress={() => router.push("/collection?kind=follows")} />
        <AccountLink label="Kaydedilenler" onPress={() => router.push("/collection?kind=saved")} />
        <AccountLink label="Bildirimler" onPress={() => router.push("/bildirimler")} />
        <AccountLink label="Rozet vitrini" onPress={() => router.push({ pathname: "/achievements/[id]", params: { id: user.data.id! } })} />
        <AccountLink label="Tanıdık başvurularım" onPress={() => router.push("/profile/application")} />
        <AccountLink label="Hesap ve güvenlik" testID="account-settings" onPress={() => router.push("/account")} />
        <AccountLink label="Bildirim tercihleri" onPress={() => router.push("/profile/preferences")} />
        {user.data.role === "MANAGER" && <AccountLink label="Yönetim alanı" onPress={() => router.push("/manager")} />}
      </View>
      <View className="mt-3.5"><Button label="Çıkış yap" testID="logout-submit" variant="danger"
        fullWidth size="large" pending={logout.isPending} onPress={() => logout.mutate()} /></View>
      {logout.error && <ErrorState error={logout.error} />}
    </Card>}
  </Page>;
}
