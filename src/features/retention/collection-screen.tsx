import { questionParams } from "@/lib/navigation/params";
import { QuestionFilters } from "@/features/questions/question-filters";
import { nextPage } from "@/lib/query/pagination";
import { api } from "@/lib/api/client";
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
import {Tabs} from "@/components/ui/tabs";
import { universityDetail, programDetail } from "@/features/catalog/api";
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
        <Collection kind={p.data.kind} targetType={p.data.targetType} />
      ) : (
        <ErrorState error={null} />
      )}
    </Screen>
  );
}
function Collection({ kind,targetType }: { kind: CollectionKind;targetType:"UNIVERSITY"|"PROGRAM" }) {
  return kind === "saved" ? <SavedQuestions /> : <CollectionList kind={kind} targetType={targetType} />;
}
function SavedQuestions() {
  const parsed=questionParams.safeParse(useLocalSearchParams());
  if(!parsed.success)return <ErrorState error={null} />;
  return <SavedQuestionList key={JSON.stringify(parsed.data)} filters={parsed.data}/>;
}
function SavedQuestionList({filters}:{filters:ReturnType<typeof questionParams.parse>}) {
 const query=useInfiniteQuery({queryKey:["retention","saved","list","questions",filters],initialPageParam:0,staleTime:30_000,queryFn:({pageParam,signal})=>api.call("get","/api/me/saved/questions",{authenticated:true,signal,query:{...filters,scope:filters.scope||undefined,answered:filters.answered?filters.answered==="true":undefined,verifiedAnswer:filters.verifiedAnswer?filters.verifiedAnswer==="true":undefined,page:pageParam,size:20}}),getNextPageParam:nextPage});
 return <PagedList query={query} renderItem={QuestionCard} header={<View className="gap-4 pb-5"><PageHeader title="Kaydedilenler" backHref="/profil" backLabel="Hesabıma dön"/><QuestionFilters filters={filters} onApply={values=>router.setParams(values)}/></View>}/>;
}
function CollectionList({ kind,targetType }: { kind: CollectionKind;targetType:"UNIVERSITY"|"PROGRAM" }) {
  const query = useInfiniteQuery(collectionList(kind,targetType));
  return (
    <PagedList
      query={query}
      empty={<EmptyState title={kind === "follows" ? `Henüz takip ettiğin ${targetType === "PROGRAM" ? "bir bölüm" : "bir üniversite"} yok` : "Henüz kaydettiğin bir soru yok"}
        description={kind === "follows" ? "Üniversite sayfasından takip etmeye başlayabilirsin." : "Soru detayından ilginç bulduğun soruları kaydedebilirsin."}
        label={kind === "follows" ? "Üniversiteleri keşfet" : "Sorulara git"}
        action={() => router.push(kind === "follows" ? "/kesfet" : "/")} />}
      header={
        <View className="gap-4 pb-5">
          <PageHeader title={kind === "follows" ? "Takipler" : "Kaydedilenler"}
            backHref="/profil" backLabel="Hesabıma dön"
            help={kind === "follows" ? "Takip ettiğin üniversiteleri ve bu üniversitelerden gelen yeni soru bildirimlerini burada görebilirsin." : "Kaydettiğin soruları buradan tekrar açabilir ve kayıtlarından kaldırabilirsin."} />
          {kind === "follows" && <Tabs variant="filled" label="Takip türü" value={targetType} options={[{value:"UNIVERSITY",label:"Üniversite"},{value:"PROGRAM",label:"Bölüm"}]} onChange={value=>router.setParams({targetType:value})}/>}
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
  if (item.targetType === "PROGRAM" && kind === "follows") return <FollowedProgram id={item.targetId}/>;
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

function FollowedProgram({id}:{id:string}){
 const query=useQuery(programDetail(id));
 return <Card>{query.isPending?<Skeleton/>:query.isError?<ErrorState error={query.error} retry={()=>void query.refetch()}/>:<Pressable accessibilityRole="link" onPress={()=>router.push({pathname:"/programs/[id]",params:{id}})} className="min-h-touch-ios justify-center"><Text variant="heading">{query.data?.summary?.name}</Text><Text variant="muted">{query.data?.summary?.universityName}</Text></Pressable>}<RetentionButton kind="follows" targetType="PROGRAM" id={id} initialActive/></Card>;
}
