import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/ui/choice";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Screen } from "@/components/ui/screen";
import { ErrorState } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import { QuestionCard } from "./question-card";

const params = z.object({ status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE") });
const mine = (status: "ACTIVE" | "ARCHIVED", page: number, signal?: AbortSignal) =>
  api.call("get", "/api/me/questions", { query: { status, page, size: 20 }, authenticated: true, signal });

export function MyQuestionsScreen() {
  const parsed = params.safeParse(useLocalSearchParams());
  if (!parsed.success) return <Screen><ErrorState error={null} retry={() => router.replace("/my-questions")} /></Screen>;
  return <MyQuestions status={parsed.data.status} />;
}

function MyQuestions({ status }: { status: "ACTIVE" | "ARCHIVED" }) {
  const active = useQuery({ queryKey: ["my-questions", "count", "ACTIVE"], queryFn: ({ signal }) => mine("ACTIVE", 0, signal) });
  const archived = useQuery({ queryKey: ["my-questions", "count", "ARCHIVED"], queryFn: ({ signal }) => mine("ARCHIVED", 0, signal) });
  const list = useInfiniteQuery({
    queryKey: ["my-questions", status], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => mine(status, pageParam, signal),
    getNextPageParam: nextPage,
  });
  return <Screen><PagedList query={list} renderItem={QuestionCard} header={<View className="gap-4 pb-5">
    <PageHeader title="Sorularım" help="Yayınladığın aktif ve arşivlenmiş soruları burada görebilir, düzenleme ve arşivleme işlemlerini soru detayından yapabilirsin." />
    <Choice label="Soru durumu" value={status} options={[
      { value: "ACTIVE", label: `Aktif sorular (${active.data?.totalElements ?? 0})` },
      { value: "ARCHIVED", label: `Arşivlenmiş sorular (${archived.data?.totalElements ?? 0})` },
    ]} onChange={value => router.setParams({ status: value })} />
    {list.isSuccess && !list.data.pages.some(page => page.items?.length) && <View className="items-start gap-2 py-5">
      <Text variant="heading">{status === "ACTIVE" ? "Henüz soru sormadın" : "Arşivlenmiş sorun yok"}</Text>
      <Button label="Soru sor" onPress={() => router.push("/questions/new")} />
    </View>}
  </View>} /></Screen>;
}
