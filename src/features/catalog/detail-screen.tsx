import { useState } from 'react';
import {Page} from '@/components/ui/page';
import {Tabs} from '@/components/ui/tabs';
import {RetentionButton} from '@/features/retention/retention-button';
import { Share, View, Pressable } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { CatalogBreadcrumb } from './catalog-breadcrumb';
import { Screen } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/action-button';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { PagedList } from '@/components/ui/paged-list';
import { idParams, sharePath } from '@/lib/navigation/params';
import { questionList } from '@/features/questions/api';
import { QuestionCard } from '@/features/questions/question-card';
import { programDetail } from './api';
import { ProgramAcademic, ProgramOptions } from './program-panels';
export { UniversityDetailScreen } from './university-screen';
export function ProgramDetailScreen(){const p=idParams.safeParse(useLocalSearchParams());return <Screen>{p.success?<Program id={p.data.id}/>:<ErrorState error={null}/>}</Screen>;}
function Program({id}: {id:string}) {
  const [tab,setTab]=useState("questions");
  const query=useQuery(programDetail(id));
  const summary=query.data?.summary;
  const questions=useInfiniteQuery({...questionList({universityId:summary?.universityId,departmentId:summary?.departmentId,programId:id,scope:"UNIVERSITY_DEPARTMENT"}),enabled:!!summary?.universityId&&tab==="questions"});
  if(query.isPending)return <Skeleton />;
  if(!query.data)return <ErrorState error={query.error} retry={()=>void query.refetch()} />;
  const header=<View className="gap-4 pb-4"><CatalogBreadcrumb items={[{label:"Programlar",href:{pathname:"/kesfet",params:{kind:"programs"}}},{label:summary?.universityName ?? "Üniversite",href:summary?.universityId?{pathname:"/universities/[id]",params:{id:summary.universityId}}:undefined},{label:summary?.name ?? "Program"}]} /><Card className="bg-primary-soft py-4"><Text variant="muted">{summary?.degreeLevel} · {summary?.scoreTypes?.join(' / ')}</Text><Text variant="title">{summary?.name}</Text><Pressable accessibilityRole="link" disabled={!summary?.universityId} onPress={()=>summary?.universityId && router.push({pathname:'/universities/[id]',params:{id:summary.universityId}})} className="min-h-touch-ios android:min-h-touch-android min-w-touch-ios android:min-w-touch-android justify-center"><Text className="text-primary underline">{summary?.universityName} · {summary?.city ?? 'Şehir belirtilmemiş'} · {summary?.institutionType}</Text></Pressable><Text variant="muted">{summary?.faculties?.join(' · ')}</Text><View className="flex-row flex-wrap gap-2"><Button label="Soru sor" onPress={()=>router.push({pathname:'/questions/new',params:{universityId:summary?.universityId,departmentId:summary?.departmentId,programId:id}})} /><RetentionButton kind="follows" id={id} targetType="PROGRAM"/></View></Card>
    {query.isError && <ErrorState error={query.error} retry={()=>void query.refetch()} />}
    <Tabs variant="navigation" label="Program bölümleri" value={tab} onChange={setTab} options={[{value:"questions",label:"Sorular"},{value:"information",label:"Programın ortak bilgileri"},{value:"statistics",label:"Bölüm istatistikleri"}]}/>
    {tab==="information"&&<ProgramAcademic data={query.data} />}{tab==="statistics"&&<ProgramOptions options={query.data.options ?? []} name={summary?.name} />}
  </View>;
  if(tab!=="questions")return <Page title="">{header}</Page>;
  return <PagedList query={questions} renderItem={QuestionCard} header={header} footer={<View className="gap-3"><Text variant="muted">Kaynak: Resmî YÖK Atlas 2026 tercih kılavuzu ve Net Sihirbazı verileri.</Text><ActionButton label="Programı paylaş" action={()=>Share.share({message:sharePath('programlar',id)})} /></View>} />;
}
