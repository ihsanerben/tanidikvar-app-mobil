import { FlashList } from "@shopify/flash-list";
import { Screen } from "@/components/ui/screen";
import { Page, PageHeader } from "@/components/ui/page";
import type { Schema } from "@/lib/api/types";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { numberText } from "@/lib/navigation/params";

const params = z.object({ city: z.string().trim().min(1).max(100) });
export function CityScreen() {
  const parsed = params.safeParse(useLocalSearchParams());
  return parsed.success ? <City city={parsed.data.city} /> : <Page title="Şehir kataloğu"><ErrorState error={null} /></Page>;
}
function City({ city }: { city: string }) {
  const universities = useQuery({ queryKey: ["catalog", "city", city, "universities"], queryFn: ({ signal }) => api.call("get", "/api/universities", { query: { city, page: 0, size: 100 }, signal }) });
  const programs = useQuery({ queryKey: ["catalog", "city", city, "programs"], queryFn: ({ signal }) => api.call("get", "/api/catalog-programs", { query: { city, page: 0, size: 24 }, signal }) });
  type Row={id:string;kind:'university';item:Schema['UniversityResponse']}|{id:string;kind:'program';item:Schema['ProgramSummaryResponse']}|{id:string;kind:'heading'|'state';section:'universities'|'programs'};
  const universityItems=universities.data?.items??[],programItems=programs.data?.items??[];
  const rows:Row[]=[{id:'university-heading',kind:'heading',section:'universities'},...(universityItems.length?universityItems.map(item=>({id:`university-${item.id}`,kind:'university' as const,item})):[{id:'university-state',kind:'state' as const,section:'universities' as const}]),{id:'program-heading',kind:'heading',section:'programs'},...(programItems.length?programItems.map(item=>({id:`program-${item.id}`,kind:'program' as const,item})):[{id:'program-state',kind:'state' as const,section:'programs' as const}])];
  return <Screen><FlashList data={rows} keyExtractor={item=>item.id} renderItem={({item})=>{
    if(item.kind==='university')return <View className="pb-list-gap"><Pressable accessibilityRole="link" onPress={() => router.push({pathname:"/universities/[id]",params:{id:item.item.id!}})}><Card compact><Text variant="heading">{item.item.name}</Text><Text variant="muted">{item.item.institutionType}</Text></Card></Pressable></View>;
    if(item.kind==='program')return <View className="pb-list-gap"><Pressable accessibilityRole="link" onPress={() => router.push({pathname:"/programs/[id]",params:{id:item.item.id!}})}><Card compact><Text variant="heading">{item.item.name}</Text><Text variant="muted">{item.item.universityName} · {item.item.scoreTypes?.join("/")}</Text><Text variant="muted">2026 başarı sırası: {item.item.currentBestRank == null ? "Veri yok" : numberText(item.item.currentBestRank)}</Text></Card></Pressable></View>;
    const current=item.section==='universities'?universities:programs;
    if(item.kind==='heading')return <Text variant="heading" className="py-3">{item.section==='universities'?'Üniversiteler':'Programlar'}</Text>;
    return current.isPending?<Skeleton />:current.isError?<ErrorState error={current.error} retry={()=>void current.refetch()} />:<Text variant="muted">Bu şehirde {item.section==='universities'?'üniversite':'program'} bulunamadı.</Text>;
  }} ListHeaderComponent={<View className="gap-3 pb-3"><PageHeader back={false} eyebrow="Şehir kataloğu" title={`${city} üniversiteleri ve programları`} /><Text>{universities.data?.totalElements ?? 0} üniversite · {programs.data?.totalElements ?? 0} program</Text></View>}
    ListFooterComponent={<View className="gap-4 py-5"><Button label="Tüm programları filtrele" variant="secondary" onPress={() => router.push({ pathname: "/kesfet", params: { kind: "programs", city } })} /></View>}
    refreshing={universities.isRefetching || programs.isRefetching} onRefresh={()=>{void universities.refetch();void programs.refetch();}} /></Screen>;
}
