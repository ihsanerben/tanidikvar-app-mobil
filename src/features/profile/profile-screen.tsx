import { retentionKeys } from "@/features/retention/api";
import { ScoreSummary } from "@/features/retention/score-summary";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Page } from "@/components/ui/page";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton, ErrorState } from "@/components/ui/states";
import { authApi, authKeys } from "@/features/auth/api";
import { myProfile } from "./api";
export function ProfileScreen() {
  const client = useQueryClient();
  const query = useQuery(myProfile());
  const me = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: 30_000,
  });
  return (
    <Page
      title="Profilim"
      back={false}
      refresh={() => {
        void query.refetch();
        if (me.data?.id)
          void client.invalidateQueries({
            queryKey: retentionKeys.score(me.data.id),
          });
      }}
      refreshing={query.isRefetching}
    >
      {query.isPending ? (
        <Skeleton />
      ) : query.isError && !query.data ? (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <Card>
          <Avatar
            name={`${query.data.firstName ?? ""} ${query.data.lastName ?? ""}`}
          />
          <Text variant="heading">
            {query.data.firstName} {query.data.lastName}
          </Text>
          <Badge
            label={
              me.data?.role === "TANIDIK"
                ? "Tanıdık"
                : query.data.completed
                  ? "Profil tamamlandı"
                  : "Profilini tamamla"
            }
          />
          <Text>{query.data.education?.universityName}</Text>
          <Text variant="muted">{query.data.education?.departmentName}</Text>
          <Text>{query.data.biography}</Text>
        </Card>
      )}
      {me.data?.role !== "MANAGER" && (
        <>
          <Button
            testID="edit-profile"
            label="Profil ve eğitim bilgilerini düzenle"
            onPress={() => router.push("/profile/edit")}
          />
          <Button
            label="Tanıdık başvurusu"
            variant="secondary"
            onPress={() => router.push("/profile/application")}
          />
        </>
      )}
      {me.data?.id && <ScoreSummary id={me.data.id} />}
      <Button
        label="Takip ve kayıtlarım"
        testID="my-collections"
        variant="secondary"
        onPress={() => router.push("/collection")}
      />
      <Button
        label="Tanıdık sıralaması"
        testID="leaderboard"
        variant="secondary"
        onPress={() => router.push("/leaderboard")}
      />
      <Button
        label="Bildirim tercihleri"
        variant="secondary"
        onPress={() => router.push("/profile/preferences")}
      />
      <Button
        testID="account-settings"
        label="Hesap ve güvenlik"
        variant="secondary"
        onPress={() => router.push("/account")}
      />
      {me.data?.id && (
        <Button
          label="Herkese açık profilimi gör"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/profiles/[id]",
              params: { id: me.data!.id! },
            })
          }
        />
      )}
    </Page>
  );
}
