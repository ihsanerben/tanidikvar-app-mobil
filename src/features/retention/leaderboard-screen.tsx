import { cva } from "class-variance-authority";
import { useQuery } from "@tanstack/react-query";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { Text } from "@/components/ui/text";
import { Tabs } from "@/components/ui/tabs";
import { ErrorState, Skeleton, EmptyState } from "@/components/ui/states";
import { numberText } from "@/lib/navigation/params";
import { Avatar } from "@/components/ui/avatar";
import { leaderboardParams, type LeaderboardFilters } from "./schemas";
import { leaderboardQuery } from "./api";
import type { Schema } from "@/lib/api/types";
import { publicProfile, publicTanidikProfile } from "@/features/profile/api";

const rankingHelp = "Yalnız yayında kalan, özgün katkılar puana dönüşür.\n\nSoru sormak: 10 puan\nYorum yazmak: 5 puan\nDeneyim paylaşmak: 3 puan\nAnket açmak: 3 puan\nAnkete katılmak: 1 puan\nDeğerlendirme yapmak: 1 puan\nÖlçüm paylaşmak: 1 puan\n\nDönemler İstanbul saatine göre hesaplanır.";
const rankSurface = cva("min-h-8 min-w-8 items-center justify-center rounded-full px-1", {
  variants: { place: { first: "bg-rank-first", second: "bg-rank-second", third: "bg-rank-third", other: "bg-rank-default" } },
});
const rankText = cva("text-caption font-semibold", {
  variants: { place: { first: "text-rank-first-text", second: "text-rank-second-text", third: "text-rank-third-text", other: "text-rank-default-text" } },
});
export function LeaderboardScreen() {
  const p = leaderboardParams.safeParse(useLocalSearchParams());
  return (
    <Screen>
      {p.success ? (
        <Leaderboard filters={p.data} />
      ) : (
        <ErrorState error={null} />
      )}
    </Screen>
  );
}
function Leaderboard({ filters }: { filters: LeaderboardFilters }) {
  const query = useQuery(leaderboardQuery(filters));
  return (
    <FlashList showsVerticalScrollIndicator={false}
      data={query.data ?? []}
      keyExtractor={(item) => item.userId!}
      refreshing={query.isRefetching}
      onRefresh={() => {
        void query.refetch();
      }}
      ListHeaderComponent={
        <View className="gap-4 pb-5">
          <PageHeader back={false} title="Katkı sıralaması" help={rankingHelp} />
          <Tabs compact fill
            label="Dönem"
            value={filters.period}
            options={[
              { value: "DAILY", label: "Bugün" },
              { value: "WEEKLY", label: "Bu hafta" },
              { value: "MONTHLY", label: "Bu ay" },
              { value: "YEARLY", label: "Bu yıl" },
              { value: "ALL_TIME", label: "Tüm zamanlar" },
            ]}
            onChange={(period) => router.setParams({ period })}
          />
          {query.isError && !!query.data && (
            <ErrorState
              error={query.error}
              retry={() => {
                void query.refetch();
              }}
            />
          )}
        </View>
      }
      ListEmptyComponent={
        query.isPending ? (
          <Skeleton />
        ) : query.isError ? (
          <ErrorState
            error={query.error}
            retry={() => {
              void query.refetch();
            }}
          />
        ) : (
          <EmptyState
            title="Bu dönemde henüz sıralama oluşmadı"
            description="Doğrulanmış katkılar geldikçe burada görünür."
          />
        )
      }

      renderItem={LeaderboardRow}
    />
  );
}

function LeaderboardRow({ item, index }: ListRenderItemInfo<Schema["LeaderboardEntryResponse"]>) {
  return <RankedPerson item={item} index={index} />;
}

export function RankedPerson({ item, index }: { item: Schema["LeaderboardEntryResponse"]; index: number }) {
  // Read only mounted rows; recycling changes the query key with the person.
  const profile = useQuery({ ...publicProfile(item.userId ?? ""), enabled: !!item.userId });
  const tanidik = useQuery({ ...publicTanidikProfile(item.userId ?? ""), enabled: !!item.userId && profile.data?.role === "TANIDIK" });
  const place = index === 0 ? "first" : index === 1 ? "second" : index === 2 ? "third" : "other";
  return <View className="pb-2">
    <Pressable accessibilityRole="link"
      accessibilityLabel={`${index + 1}. ${item.displayName}, ${item.title}, ${numberText(item.eventCount)} katkı, ${numberText(item.points)} puan${item.badges?.length ? `, ${item.badges.join(", ")}` : ""}`}
      onPress={() => router.push({ pathname: "/profiles/[id]", params: { id: item.userId! } })}
      className="min-h-16 flex-row items-center gap-2 rounded-control border border-border bg-surface p-2.5 active:opacity-80">
      <View className={rankSurface({ place })}><Text className={rankText({ place })}>{index + 1}</Text></View>
      <Avatar name={item.displayName} size="ranking" educationStatus={profile.data?.educationStatus} tanidik={profile.data?.role === "TANIDIK" && tanidik.data?.activeTanidik === true} />
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-semibold text-primary">{item.displayName}</Text>
        <Text variant="muted">{item.title} · {numberText(item.eventCount)} katkı</Text>
      </View>
      <View className="max-w-[120px] items-end gap-1"><Text variant="unstyled" className="text-caption font-bold text-primary">{numberText(item.points)} puan</Text>{!!item.badges?.length && <Text variant="muted" className="text-right">{item.badges.join(" · ")}</Text>}</View>
    </Pressable>
    {profile.isError && <ErrorState error={profile.error} retry={() => { void profile.refetch(); }} />}
    {profile.data?.role === "TANIDIK" && tanidik.isError && <ErrorState error={tanidik.error} retry={() => { void tanidik.refetch(); }} />}
  </View>;
}
