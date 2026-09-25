import { View } from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Choice } from "@/components/ui/choice";
import { universityDetail } from "@/features/catalog/api";
import { questionDetail } from "@/features/questions/api";
import type { Schema } from "@/lib/api/types";
import { collectionParams, type CollectionKind } from "./schemas";
import { collectionList } from "./api";
import { RetentionButton } from "./retention-button";
export function CollectionScreen() {
  const p = collectionParams.safeParse(useLocalSearchParams());
  return (
    <Screen>
      {p.success ? (
        <Collection kind={p.data.kind} />
      ) : (
        <ErrorState error={null} />
      )}
    </Screen>
  );
}
function Collection({ kind }: { kind: CollectionKind }) {
  const query = useInfiniteQuery(collectionList(kind));
  return (
    <PagedList
      query={query}
      header={
        <View className="gap-4 pb-5">
          <PageHeader title="Takip ve kayıtlarım" />
          <Choice
            label="Liste"
            value={kind}
            options={[
              { value: "follows", label: "Üniversiteler" },
              { value: "saved", label: "Sorular" },
            ]}
            onChange={(kind) => router.setParams({ kind })}
          />
        </View>
      }
      renderItem={({ item }) => (
        <CollectionItem key={item.id} item={item} kind={kind} />
      )}
    />
  );
}
function CollectionItem({
  item,
  kind,
}: {
  item: Schema["RetentionResponse"];
  kind: CollectionKind;
}) {
  if (!item.targetId) return null;
  if (item.targetType === "UNIVERSITY" && kind === "follows")
    return <Followed id={item.targetId} />;
  if (item.targetType === "QUESTION" && kind === "saved")
    return <Saved id={item.targetId} />;
  return (
    <Card>
      <Text variant="muted">Bu eski kayıt türü mobilde desteklenmiyor.</Text>
    </Card>
  );
}
function Followed({ id }: { id: string }) {
  const query = useQuery(universityDetail(id));
  return (
    <Card>
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
        <>
          <Text variant="heading">{query.data.name}</Text>
          <Text variant="muted">{query.data.city}</Text>
          <Button
            label="Üniversiteyi aç"
            onPress={() =>
              router.push({ pathname: "/universities/[id]", params: { id } })
            }
          />
          <RetentionButton kind="follows" id={id} initialActive={true} />
        </>
      )}
    </Card>
  );
}
function Saved({ id }: { id: string }) {
  const query = useQuery(questionDetail(id));
  return (
    <Card>
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
        <>
          <Text variant="heading">{query.data.title}</Text>
          <Text variant="muted">{query.data.universityName || "Genel"}</Text>
          <Button
            label="Soruyu aç"
            onPress={() =>
              router.push({ pathname: "/questions/[id]", params: { id } })
            }
          />
          <RetentionButton kind="saved" id={id} initialActive={true} />
        </>
      )}
    </Card>
  );
}
