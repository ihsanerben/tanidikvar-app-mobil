import { ApiError } from "../../../packages/api-client/errors";
import { Pressable, View } from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { universityDetail } from "@/features/catalog/api";
import { questionDetail } from "@/features/questions/api";
import type { Schema } from "@/lib/api/types";
import { collectionParams, type CollectionKind } from "./schemas";
import { collectionList } from "./api";
import { RetentionButton } from "./retention-button";
import { QuestionCard } from "@/features/questions/question-card";
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
      empty={<EmptyState title={kind === "follows" ? "Henüz takip ettiğin bir üniversite yok" : "Henüz kaydettiğin bir soru yok"}
        description={kind === "follows" ? "Üniversite sayfasından takip etmeye başlayabilirsin." : "Soru detayından ilginç bulduğun soruları kaydedebilirsin."}
        label={kind === "follows" ? "Üniversiteleri keşfet" : "Sorulara git"}
        action={() => router.push(kind === "follows" ? "/kesfet" : "/")} />}
      header={
        <View className="gap-4 pb-5">
          <PageHeader title={kind === "follows" ? "Takip edilen üniversiteler" : "Kaydedilen sorular"}
            backHref="/profil" backLabel="Hesabıma dön"
            help={kind === "follows" ? "Takip ettiğin üniversiteleri ve bu üniversitelerden gelen yeni soru bildirimlerini burada görebilirsin." : "Kaydettiğin soruları buradan tekrar açabilir ve kayıtlarından kaldırabilirsin."} />
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
    <View className="gap-2">
      {query.isPending ? (
        <Skeleton />
      ) : query.isError && !query.data ? (
        query.error instanceof ApiError && query.error.status===404 ? <Card><Text variant="heading">Bu içerik artık görüntülenemiyor</Text><Text variant="muted">Kaydı listenden kaldırabilirsin.</Text><RetentionButton kind="follows" id={id} initialActive={true} /></Card> : <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <>
          <Pressable accessibilityRole="link" accessibilityLabel={query.data.name}
            className="min-h-touch-android flex-row items-center justify-between gap-3 rounded-card border border-border bg-surface px-3 py-3 active:opacity-80"
            onPress={() =>
              router.push({ pathname: "/universities/[id]", params: { id } })
            }
          ><View className="min-w-0 flex-1 gap-1"><Text variant="heading">{query.data.name}</Text>
            <Text variant="muted">Üniversite</Text></View><Text accessible={false} className="text-muted">→</Text></Pressable>
          <RetentionButton kind="follows" id={id} initialActive={true} />
        </>
      )}
    </View>
  );
}
function Saved({ id }: { id: string }) {
  const query = useQuery(questionDetail(id));
  return (
    <View className="gap-2">
      {query.isPending ? (
        <Skeleton />
      ) : query.isError && !query.data ? (
        query.error instanceof ApiError && query.error.status===404 ? <Card><Text variant="heading">Bu içerik artık görüntülenemiyor</Text><Text variant="muted">Kaydı listenden kaldırabilirsin.</Text><RetentionButton kind="saved" id={id} initialActive={true} /></Card> : <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <>
          <QuestionCard item={query.data} />
          <RetentionButton kind="saved" id={id} initialActive={true} />
        </>
      )}
    </View>
  );
}
