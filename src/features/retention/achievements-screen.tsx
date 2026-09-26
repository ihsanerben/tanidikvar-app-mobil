import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { AppFooter } from "@/components/ui/app-footer";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShowcaseForm } from "./showcase-form";
import { Skeleton, ErrorState, EmptyState } from "@/components/ui/states";
import { useCurrentUser } from "@/features/auth/use-current-user";
import { idParams } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import { achievementsQuery } from "./api";

type Achievement = Schema["AchievementResponse"];
const help = "Rozetler, platformdaki faydalı katkıların ve belirli alanlardaki başarıların sonucunda kazanılır. Kazandığın rozetlerden en fazla üçünü seçerek Tanıdık profilinde öne çıkarabilirsin.";

export function AchievementsScreen() {
  const parsed = idParams.safeParse(useLocalSearchParams());
  return <Screen>{parsed.success ? <Achievements id={parsed.data.id} /> : <ErrorState error={null} />}</Screen>;
}
function Achievements({ id }: { id: string }) {
  const query = useQuery(achievementsQuery(id));
  const me = useCurrentUser();
  const [saved, setSaved] = useState(false);
  const owner = me.data?.id === id;
  const header = <View className="gap-4 pb-4">
    <PageHeader title={owner ? "Rozet vitrini" : "Rozetler"} help={help}
      backHref={owner ? "/profil" : undefined} backLabel={owner ? "Hesabıma dön" : "Geri"} />
    {saved && <Text accessibilityRole="alert" className="text-success">Profil vitrinin güncellendi.</Text>}
    {query.isError && query.data && <ErrorState error={query.error} retry={() => { void query.refetch(); }} />}
  </View>;
  if (owner && query.data?.length) return <ShowcaseForm key={id} id={id} items={query.data}
    header={header} refreshing={query.isRefetching} refresh={() => { void query.refetch(); }}
    onSaved={() => setSaved(true)} onChange={() => setSaved(false)} />;
  return <FlashList data={query.data ?? []} keyExtractor={item => item.id!} renderItem={renderAchievement}
    refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }} ItemSeparatorComponent={Separator}
    ListHeaderComponent={<View>{header}{!owner && <Button label="Yıllık Tanıdık Karnesi" onPress={() => router.push({ pathname: "/annual-report/[id]", params: { id } })} />}</View>}
    ListFooterComponent={<AppFooter />}
    ListEmptyComponent={query.isPending ? <Skeleton /> : query.isError ? <ErrorState error={query.error} retry={() => { void query.refetch(); }} /> : <EmptyState title="Henüz kazanılmış rozet yok" description="Katkılarınla kazandığın rozetler burada görünecek." />} />;
}
const renderAchievement: ListRenderItem<Achievement> = ({ item }) => <Card>
  <Text variant="heading">{item.title}{item.periodYear ? ` · ${item.periodYear}` : ""}</Text>
  {item.featured && <Badge label="Profilde gösteriliyor" />}
  {item.awardedAt && <Text variant="muted">{new Date(item.awardedAt).toLocaleDateString("tr-TR")}</Text>}
</Card>;
function Separator() { return <View className="h-list-gap" />; }
