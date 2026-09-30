import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { z } from "zod";
import { QuestionFilters } from "./question-filters";
import { questionParams } from "@/lib/navigation/params";
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
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Text } from "@/components/ui/text";
import type { Schema } from "@/lib/api/types";
import { questionsApi, refreshQuestions } from "./api";
import { QuestionCard } from "./question-card";

const params = questionParams.extend({ status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE") });
const mine = (status: "ACTIVE" | "ARCHIVED", page: number, signal?: AbortSignal, filters:ReturnType<typeof questionParams.parse> = questionParams.parse({})) =>
  api.call("get", "/api/me/questions", { query: { ...filters, scope:filters.scope||undefined, status, page, size: 20 }, authenticated: true, signal });

export function MyQuestionsScreen() {
  const parsed = params.safeParse(useLocalSearchParams());
  if (!parsed.success) return <Screen><ErrorState error={null} retry={() => router.replace("/my-questions")} /></Screen>;
  return <MyQuestions status={parsed.data.status} filters={parsed.data} />;
}

function MyQuestions({ status, filters }: { status: "ACTIVE" | "ARCHIVED";filters:ReturnType<typeof questionParams.parse> }) {
  const active = useQuery({ queryKey: ["my-questions", "count", "ACTIVE"], queryFn: ({ signal }) => mine("ACTIVE", 0, signal) });
  const archived = useQuery({ queryKey: ["my-questions", "count", "ARCHIVED"], queryFn: ({ signal }) => mine("ARCHIVED", 0, signal) });
  const list = useInfiniteQuery({
    queryKey: ["my-questions", status, filters], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => mine(status, pageParam, signal, filters),
    getNextPageParam: nextPage,
  });
  return <Screen><PagedList query={list} renderItem={OwnQuestion} maintainPosition={false}
    empty={<EmptyState title={status === "ACTIVE" ? "Henüz soru sormadın" : "Arşivlenmiş sorun yok"}
      description={status === "ACTIVE" ? "İlk sorunu topluluğa sorabilirsin." : "Arşivlediğin sorular burada görünecek."}
      label="Soru sor" action={() => router.push("/questions/new")} />}
    header={<View className="gap-4 pb-5">
    <PageHeader title="Sorularım" backHref="/profil" backLabel="Hesabıma dön" help="Yayınladığın aktif ve arşivlenmiş soruları burada görebilir, düzenleme ve arşivleme işlemlerini soru detayından yapabilirsin." />
    <Tabs variant="filled" fill label="Soru durumu" value={status} options={[
      { value: "ACTIVE", label: `Aktif sorular (${active.data?.totalElements ?? "…"})` },
      { value: "ARCHIVED", label: `Arşivlenmiş sorular (${archived.data?.totalElements ?? "…"})` },
    ]} onChange={value => router.setParams({ status: value })} />
    <QuestionFilters filters={filters} onApply={values=>router.setParams(values)}/>
    {(active.isError || archived.isError) && <ErrorState error={active.error || archived.error}
      retry={() => { void active.refetch(); void archived.refetch(); }} />}
  </View>} /></Screen>;
}

function OwnQuestion({item}: {item:Schema["QuestionResponse"]}) {
  return <OwnQuestionActions key={item.id} item={item} />;
}
function OwnQuestionActions({item}: {item:Schema["QuestionResponse"]}) {
  const client=useQueryClient();
  const [confirm,setConfirm]=useState(false);
  const label=item.archivedAt?"Soruyu yeniden aç":"Soruyu arşivle";
  return <><QuestionCard item={item} actions={<ActionsMenu title="Soru işlemleri" kind="question" popover>{close => <><Button label="Düzenle" icon="edit" variant="menu" onPress={()=>{close();if(item.id)router.push({pathname:"/questions/[id]/edit",params:{id:item.id}});}} /><Button label={label} icon="edit" variant="menu" onPress={()=>{close();setConfirm(true);}} /></>}</ActionsMenu>} /><BottomSheet visible={confirm} title={label} close={()=>setConfirm(false)}><Text>Sorunun durumunu değiştirmek istediğine emin misin?</Text><View className="flex-row gap-2"><Button label="Vazgeç" variant="secondary" onPress={()=>setConfirm(false)} /><ActionButton label="Onayla" action={()=>item.archivedAt?questionsApi.restore(item.id!,item.version!):questionsApi.archive(item.id!,item.version!)} after={async()=>{setConfirm(false);await Promise.all([refreshQuestions(item.id),client.invalidateQueries({queryKey:["my-questions"]})]);}} /></View></BottomSheet></>;
}
