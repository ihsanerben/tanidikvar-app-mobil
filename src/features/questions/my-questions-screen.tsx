import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { z } from "zod";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Screen } from "@/components/ui/screen";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import { ActionsMenu } from "@/components/ui/actions-menu";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import type { Schema } from "@/lib/api/types";
import { questionsApi, refreshQuestions } from "./api";
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
  return <Screen><PagedList query={list} renderItem={OwnQuestion}
    empty={<EmptyState title={status === "ACTIVE" ? "Henüz soru sormadın" : "Arşivlenmiş sorun yok"}
      description={status === "ACTIVE" ? "İlk sorunu topluluğa sorabilirsin." : "Arşivlediğin sorular burada görünecek."}
      label="Soru sor" action={() => router.push("/questions/new")} />}
    header={<View className="gap-4 pb-5">
    <PageHeader title="Sorularım" backHref="/profil" backLabel="Hesabıma dön" help="Yayınladığın aktif ve arşivlenmiş soruları burada görebilir, düzenleme ve arşivleme işlemlerini soru detayından yapabilirsin." />
    <Tabs label="Soru durumu" value={status} options={[
      { value: "ACTIVE", label: `Aktif sorular (${active.data?.totalElements ?? "…"})` },
      { value: "ARCHIVED", label: `Arşivlenmiş sorular (${archived.data?.totalElements ?? "…"})` },
    ]} onChange={value => router.setParams({ status: value })} />
    {(active.isError || archived.isError) && <ErrorState error={active.error || archived.error}
      retry={() => { void active.refetch(); void archived.refetch(); }} />}
  </View>} /></Screen>;
}

function OwnQuestion({item}: {item:Schema["QuestionResponse"]}) {
  const client=useQueryClient();
  return <QuestionCard item={item} actions={<ActionsMenu title="Soru işlemleri"><Button label="Soruyu düzenle" variant="secondary" onPress={()=>item.id && router.push({pathname:"/questions/[id]/edit",params:{id:item.id}})} /><ActionButton label={item.archivedAt?"Soruyu yeniden aç":"Soruyu arşivle"} confirm="Sorunun durumunu değiştirmek istediğine emin misin?" action={()=>item.archivedAt?questionsApi.restore(item.id!,item.version!):questionsApi.archive(item.id!,item.version!)} after={async()=>{await Promise.all([refreshQuestions(item.id),client.invalidateQueries({queryKey:["my-questions"]})]);}} /></ActionsMenu>} />;
}
