import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShowcaseForm } from "./showcase-form";
import { Skeleton, ErrorState, EmptyState } from "@/components/ui/states";
import { useCurrentUser } from "@/features/auth/use-current-user";
import { idParams } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import {AchievementMedallion} from "./achievement-medallion";
import {groupAchievementEntries} from "./achievement-groups";
import { achievementsQuery, achievementCatalogQuery } from "./api";

type Achievement = Schema["AchievementResponse"];
type Definition = Schema["AchievementDefinitionResponse"];
type Entry = {achievement: Achievement;definition: Definition};
type Group = {title:string;items:Entry[]};
const help = "Rozetler, platformdaki faydalı katkıların ve belirli alanlardaki başarıların sonucunda kazanılır. Kazandığın rozetlerden en fazla üçünü seçerek Tanıdık profilinde öne çıkarabilirsin.";

export function AchievementsScreen() {
  const parsed = idParams.safeParse(useLocalSearchParams());
  return <Screen>{parsed.success ? <Achievements id={parsed.data.id} /> : <ErrorState error={null} />}</Screen>;
}
function Achievements({ id }: { id: string }) {
  const query = useQuery(achievementsQuery(id));
  const catalog = useQuery(achievementCatalogQuery());
  const me = useCurrentUser();
  const [saved, setSaved] = useState(false);
  const owner = me.data?.id === id;
  const header = <View className="gap-4 pb-4">
    <PageHeader title={owner ? "Rozet vitrini" : "Rozetler"} help={help}
      backHref={owner ? "/profil" : undefined} backLabel={owner ? "Hesabıma dön" : "Geri"} />
    {saved && <Text accessibilityRole="alert" className="text-success">Profil vitrinin güncellendi.</Text>}
    {catalog.isError && <ErrorState error={catalog.error} retry={() => { void catalog.refetch(); }} />}
    {catalog.isPending && <Skeleton />}
    {query.isError && query.data && <ErrorState error={query.error} retry={() => { void query.refetch(); }} />}
  </View>;
  if (owner && query.data && catalog.data) return <ShowcaseForm key={id} id={id} items={query.data} catalog={catalog.data}
    header={header} refreshing={query.isRefetching} refresh={() => { void query.refetch(); }}
    onSaved={() => setSaved(true)} onChange={() => setSaved(false)} />;
  const groups=groupAchievementEntries((query.data??[]).map(achievement=>({achievement,definition:catalog.data?.find(definition=>definition.key===achievement.key)??{key:achievement.key??achievement.id??'OTHER',title:achievement.title??'Rozet',description:'Topluluğa yaptığın katkılar için kazanılan başarı rozeti.',icon:'★'}})));
  return <FlashList showsVerticalScrollIndicator={false} data={groups} keyExtractor={group=>group.title} renderItem={renderGroup}
    refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }} ItemSeparatorComponent={Separator}
    ListHeaderComponent={<View>{header}{!owner && <Button label="Yıllık Tanıdık Karnesi" onPress={() => router.push({ pathname: "/annual-report/[id]", params: { id } })} />}</View>}

    ListEmptyComponent={query.isPending ? <Skeleton /> : query.isError ? <ErrorState error={query.error} retry={() => { void query.refetch(); }} /> : <EmptyState title="Henüz kazanılmış rozet yok" description="Katkılarınla kazandığın rozetler burada görünecek." />} />;
}
const renderGroup: ListRenderItem<Group> = ({item:group}) => <View className="gap-3">
  <Text variant="heading">{group.title}</Text>
  <View className="flex-row flex-wrap">{group.items.map(({achievement,definition})=><View key={achievement.id} className="w-1/3 px-1 pb-2"><View className="flex-1 items-center gap-2 rounded-card border border-border bg-surface p-2"><AchievementMedallion achievement={achievement} definition={definition} compact/><Text className="text-center text-caption font-semibold text-primary" numberOfLines={3}>{achievement.title}{achievement.periodYear?` · ${achievement.periodYear}`:''}</Text>{achievement.featured&&<Badge label="Profilde"/>}</View></View>)}</View>
</View>;
function Separator() { return <View className="h-list-gap" />; }
