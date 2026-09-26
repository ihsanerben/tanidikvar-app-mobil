import { universityDetail } from "@/features/catalog/api";
import { useQuery } from "@tanstack/react-query";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/ui/choice";
import { ErrorState, Skeleton, EmptyState } from "@/components/ui/states";
import { CatalogPicker } from "@/features/catalog/catalog-picker";
import { numberText } from "@/lib/navigation/params";
import { Avatar } from "@/components/ui/avatar";
import { AppFooter } from "@/components/ui/app-footer";
import { leaderboardParams, type LeaderboardFilters } from "./schemas";
import { leaderboardQuery } from "./api";
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
  const university = useQuery({
    ...universityDetail(filters.universityId ?? ""),
    enabled: !!filters.universityId,
  });
  return (
    <FlashList
      data={query.data ?? []}
      keyExtractor={(item) => item.userId!}
      refreshing={query.isRefetching}
      onRefresh={() => {
        void query.refetch();
      }}
      ListHeaderComponent={
        <View className="gap-4 pb-5">
          <PageHeader title="Katkı sıralaması" help="Katkı sıralaması doğrulanmış ve faydalı topluluk katkılarının puanlarına göre oluşur. Dönemler İstanbul saatine göre hesaplanır." />
          <Choice
            label="Dönem"
            value={filters.period}
            options={[
              { value: "ALL_TIME", label: "Tüm zamanlar" },
              { value: "DAILY", label: "Bugün" },
              { value: "WEEKLY", label: "Bu hafta" },
              { value: "MONTHLY", label: "Bu ay" },
              { value: "YEARLY", label: "Bu yıl" },
            ]}
            onChange={(period) => router.setParams({ period })}
          />
          <Text variant="muted">
            {filters.departmentId
              ? "Seçilen üniversite ve bölüm"
              : filters.universityId
                ? "Seçilen üniversite"
                : "Türkiye geneli"}{" "}
            · İlk 100 katkıcı
          </Text>
          <CatalogPicker
            universityId={filters.universityId}
            universityName={university.data?.name}
            onUniversity={(item) =>
              router.setParams({
                universityId: item.id,
                departmentId: undefined,
              })
            }
            onProgram={(item) =>
              router.setParams({ departmentId: item.departmentId })
            }
          />
          <Text variant="muted">
            Program seçtiğinde bağlı olduğu bölümdeki katkıcılar listelenir.
          </Text>
          <Button
            label="Türkiye geneline dön"
            variant="secondary"
            onPress={() =>
              router.setParams({
                universityId: undefined,
                departmentId: undefined,
              })
            }
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
            title="Henüz sıralama yok"
            description="Bu dönem ve kapsamda puan kazanan katkıcı bulunmuyor."
          />
        )
      }
      ListFooterComponent={<AppFooter />}
      renderItem={({ item, index }) => (
        <View className="pb-3">
          <Pressable accessibilityRole="link" accessibilityLabel={`${index + 1}. ${item.displayName}, ${numberText(item.points)} puan`} onPress={() =>
                router.push({
                  pathname: "/profiles/[id]",
                  params: { id: item.userId! },
                })
              } className="min-h-12 flex-row items-center gap-2.5 rounded-card border border-border bg-surface p-3 active:opacity-80">
            <Text className="w-6 text-center text-caption font-bold text-primary">{index + 1}</Text>
            <Avatar name={item.displayName} size="small" />
            <View className="min-w-0 flex-1"><Text className="text-caption font-semibold text-primary">{item.displayName}</Text><Text variant="muted">{item.title} · {numberText(item.eventCount)} katkı</Text></View>
            <View className="max-w-24 items-end"><Text className="text-caption font-bold text-primary">{numberText(item.points)} puan</Text>{!!item.badges?.length && <Text numberOfLines={2} variant="muted">{item.badges.join(" · ")}</Text>}</View>
          </Pressable>
        </View>
      )}
    />
  );
}
