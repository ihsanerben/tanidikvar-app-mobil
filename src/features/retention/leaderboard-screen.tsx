import { universityDetail } from "@/features/catalog/api";
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/ui/choice";
import { ErrorState, Skeleton, EmptyState } from "@/components/ui/states";
import { CatalogPicker } from "@/features/catalog/catalog-picker";
import { numberText } from "@/lib/navigation/params";
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
          <PageHeader title="Tanıdık sıralaması" />
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
      renderItem={({ item, index }) => (
        <View className="pb-3">
          <Card>
            <Text variant="heading">
              {index + 1}. {item.displayName}
            </Text>
            <Text>
              {numberText(item.points)} puan · {item.title}
            </Text>
            <Text variant="muted">{item.badges?.join(" · ")}</Text>
            <Button
              label="Profili gör"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: "/profiles/[id]",
                  params: { id: item.userId! },
                })
              }
            />
          </Card>
        </View>
      )}
    />
  );
}
