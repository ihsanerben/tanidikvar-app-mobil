import { useState, useSyncExternalStore } from "react";
import { View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FeatureForm } from "@/components/ui/feature-form";
import { Skeleton, ErrorState, EmptyState } from "@/components/ui/states";
import { authApi, authKeys } from "@/features/auth/api";
import { tokenManager } from "@/lib/auth/token-manager";
import { idParams } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import { achievementsQuery, retentionKeys, setShowcase } from "./api";
import { showcaseSchema } from "./schemas";
export function AchievementsScreen() {
  const p = idParams.safeParse(useLocalSearchParams());
  return (
    <Screen>
      {p.success ? (
        <Achievements id={p.data.id} />
      ) : (
        <ErrorState error={null} />
      )}
    </Screen>
  );
}
function Achievements({ id }: { id: string }) {
  const sessionStatus = useSyncExternalStore(tokenManager.subscribe, tokenManager.getStatus, () => "bootstrapping" as const);
  const query = useQuery(achievementsQuery(id));
  const client = useQueryClient();
  const me = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: 30_000,
    enabled: sessionStatus === "authenticated",
  });
  const [editing, setEditing] = useState<
    Schema["AchievementResponse"][] | null
  >(null);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <FlashList
        data={query.data ?? []}
        keyExtractor={(item) => item.id!}
        refreshing={query.isRefetching}
        onRefresh={() => {
          void query.refetch();
        }}
        ListHeaderComponent={
          <View className="gap-4 pb-5">
            <PageHeader title="Rozetler" />
            <Button
              label="Yıllık Tanıdık Karnesi"
              onPress={() =>
                router.push({ pathname: "/annual-report/[id]", params: { id } })
              }
            />
            {me.data?.id === id && query.data && (
              <Button
                testID="edit-showcase"
                label="Profilde gösterilen rozetleri seç"
                variant="secondary"
                onPress={() => {
                  setSaved(false);
                  setEditing(query.data);
                }}
              />
            )}
            {saved && (
              <Text accessibilityRole="alert">Rozet vitrinin kaydedildi.</Text>
            )}
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
              title="Henüz rozet yok"
              description="Katkılarınla kazandığın rozetler burada görünecek."
            />
          )
        }
        renderItem={({ item }) => (
          <View className="pb-3">
            <Card>
              <Text variant="heading">{item.title}</Text>
              {item.featured && <Badge label="Profilde gösteriliyor" />}
              {item.periodYear && <Text>{item.periodYear}</Text>}
              <Text variant="muted">
                {item.awardedAt
                  ? new Date(item.awardedAt).toLocaleDateString("tr-TR")
                  : ""}
              </Text>
            </Card>
          </View>
        )}
      />
      <BottomSheet
        visible={editing !== null}
        scroll={false}
        title="Rozet vitrini"
        close={() => setEditing(null)}
      >
        {editing && (
          <FeatureForm
            schema={showcaseSchema}
            defaults={{
              achievementIds: editing
                .filter((item) => item.featured && item.id)
                .map((item) => item.id!),
            }}
            fields={[]}
            testID="showcase-submit"
            label="Seçimi kaydet"
            submit={(values) => setShowcase(values.achievementIds)}
            onSuccess={() => {
              setEditing(null);
              setSaved(true);
              void client.invalidateQueries({
                queryKey: retentionKeys.achievements(id),
              });
              void client.invalidateQueries({
                queryKey: retentionKeys.score(id),
              });
            }}
          >
            {(form) => (
              <View className="h-80">
                <Text>En fazla üç rozet seçebilirsin.</Text>
                <FlashList
                  data={editing}
                  keyExtractor={(item) => item.id!}
                  renderItem={({ item }) => {
                    const selected = form.watch("achievementIds");
                    const checked = selected.includes(item.id!);
                    return (
                      <View className="py-2">
                        <Button
                          label={`${checked ? "Seçili: " : ""}${item.title}`}
                          variant={checked ? "primary" : "secondary"}
                          disabled={!checked && selected.length >= 3}
                          onPress={() =>
                            form.setValue(
                              "achievementIds",
                              checked
                                ? selected.filter((id) => id !== item.id)
                                : [...selected, item.id!],
                              { shouldValidate: true },
                            )
                          }
                        />
                      </View>
                    );
                  }}
                />
                {form.formState.errors.achievementIds && (
                  <Text>{form.formState.errors.achievementIds.message}</Text>
                )}
              </View>
            )}
          </FeatureForm>
        )}
      </BottomSheet>
    </>
  );
}
