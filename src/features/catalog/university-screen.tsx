import { useState } from 'react';
import { Linking, View, ScrollView, Pressable } from 'react-native';
import { Image } from '@/components/ui/image';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { z } from 'zod';
import { Screen } from '@/components/ui/screen';
import { CatalogBreadcrumb } from './catalog-breadcrumb';
import { useForm, Controller } from 'react-hook-form';
import { PagedList } from '@/components/ui/paged-list';
import { Tabs } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Metric } from '@/components/ui/metric';
import { Distribution } from '@/components/ui/distribution';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { RetentionButton } from '@/features/retention/retention-button';
import { ContextInsights } from './context-insights';
import { ContextCommunity } from './community-screen';
import { programList, universityDetail, universityStats } from './api';
import { UniversityProgramCard } from './cards';
const params=z.object({id:z.uuid(),tab:z.enum(['general','programs','statistics','questions','evaluations','polls','people','metrics','experiences']).optional(),contentId:z.uuid().optional(),metricKey:z.string().regex(/^[A-Z_]+$/).max(80).optional()});
type Tab='general'|'programs'|'statistics'|'questions'|'evaluations'|'polls'|'people'|'metrics'|'experiences';
export function UniversityDetailScreen(){const p=params.safeParse(useLocalSearchParams());return <Screen>{p.success ? <University key={`${p.data.id}:${p.data.tab ?? ""}:${p.data.contentId ?? ""}`} id={p.data.id} initialTab={p.data.tab} contentId={p.data.contentId} metricKey={p.data.metricKey} /> : <ErrorState error={null} />}</Screen>;}
function University({id,initialTab,contentId,metricKey}: {id:string;initialTab?:Tab;contentId?:string;metricKey?:string}) {
  const query=useQuery(universityDetail(id));
  const [tab,setTab]=useState<Tab>(initialTab ?? 'programs');
  if(query.isPending)return <Skeleton variant="detail" />;
  if(!query.data)return <ErrorState error={query.error} retry={()=>void query.refetch()} />;
  const university=query.data;
  // Accent values are API supplied theme data, validated before use as native colors.
  const accent=/^#[0-9a-fA-F]{6}$/.test(university.accentPrimary ?? '') ? university.accentPrimary : undefined;
  const soft=/^#[0-9a-fA-F]{6}$/.test(university.accentSoft ?? '') ? university.accentSoft : undefined;
  const header=<View className="gap-3 pb-4"><CatalogBreadcrumb items={[{label:"Üniversiteler",href:"/kesfet"},{label:university.name ?? "Üniversite"}]} />
    <Card className="bg-primary-soft py-4" style={soft ? {backgroundColor:soft} : undefined}>
      {university.logoUrl && <Image source={{uri:university.logoUrl}} contentFit="contain" accessibilityLabel={`${university.name} logosu`} className="h-12 w-12" />}
      <Text variant="muted">{[university.city,university.institutionType].filter(Boolean).join(' · ') || 'Üniversite topluluğu'}</Text><Text variant="title" style={accent ? {color:accent} : undefined}>{university.name}</Text><>{university.description && <Text>{university.description}</Text>}</>
      {university.websiteUrl && /^https?:\/\//.test(university.websiteUrl) && <Pressable accessibilityRole="link" className="min-h-touch-ios justify-center" onPress={()=>void Linking.openURL(university.websiteUrl!)}><Text className="text-primary underline">Resmî web sitesi</Text></Pressable>}
      <View className="flex-row flex-wrap gap-2"><RetentionButton kind="follows" id={id} /></View>
    </Card>
    {query.isError && <ErrorState error={query.error} retry={()=>void query.refetch()} />}
    <Tabs compact revealSelected variant="filled" label="Üniversite bölümleri" value={tab} onChange={setTab} options={[{value:'general',label:'Genel'},{value:'programs',label:'Programlar'},{value:'questions',label:'Sorular'},{value:'people',label:'Tanıdıklar'},{value:'statistics',label:'İstatistikler'},{value:'experiences',label:'Deneyimler'},{value:'polls',label:'Anketler'},{value:'evaluations',label:'Değerlendirmeler'},{value:'metrics',label:'Ölçümler'}]} />

  </View>;
  const emptyHeader=<View/>;
  const content=tab==='programs'?<Programs id={id} header={emptyHeader}/>
    :tab==='statistics'?<Statistics id={id} header={emptyHeader}/>
    :tab==='questions'||tab==='people'?<ContextCommunity params={{universityId:id,view:tab}} header={emptyHeader}/>
    :<ContextInsights programCount={university.programCount} questionCount={university.questionCount} tanidikCount={university.tanidikCount} universityId={id} contentId={contentId} metricKey={metricKey} view={tab} header={emptyHeader}/>;
  return <View className="flex-1">{header}<View className="min-h-0 flex-1">{content}</View></View>;
}
function Programs({id,header}: {id:string;header:React.ReactElement}) {
  const form=useForm<{q:string;scoreType:''|'TYT'|'SAY'|'EA'|'SÖZ'|'DİL';degreeLevel:''|'LISANS'|'ONLISANS';sort:'RANK'|'NAME'}>({defaultValues:{q:'',scoreType:'',degreeLevel:'',sort:'RANK'}});
  const [applied,setApplied]=useState(form.getValues());
  const query=useInfiniteQuery(programList({universityId:id,...applied}));
  return <PagedList query={query} numColumns={3} renderItem={({ item }) => <View className="flex-1 px-0.5 pb-1"><UniversityProgramCard item={item} /></View>} header={<View className="gap-3 pb-4">{header}
    <View className="rounded-control border border-border bg-surface p-2"><ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="items-end gap-2">
      <View className="w-28"><Controller control={form.control} name="q" render={({field})=><FormField compact label="Program ara" value={field.value} onChangeText={field.onChange} onSubmitEditing={form.handleSubmit(setApplied)} />} /></View>
      <View className="w-20"><Controller control={form.control} name="scoreType" render={({field})=><Select label="Puan türü" value={field.value} onChange={field.onChange} options={['','TYT','SAY','EA','SÖZ','DİL'].map(value=>({value,label:value||'Tümü'}))} />} /></View>
      <View className="w-20"><Controller control={form.control} name="degreeLevel" render={({field})=><Select label="Düzey" value={field.value} onChange={field.onChange} options={[{value:'',label:'Tümü'},{value:'LISANS',label:'Lisans'},{value:'ONLISANS',label:'Ön lisans'}]} />} /></View>
      <View className="w-24"><Controller control={form.control} name="sort" render={({field})=><Select label="Sırala" value={field.value} onChange={field.onChange} options={[{value:'RANK',label:'Başarı sırasına göre'},{value:'NAME',label:'Ada göre'}]} />} /></View>
      <Button label="Filtrele" onPress={form.handleSubmit(setApplied)} />
    </ScrollView></View>
  </View>} />;
}

function Statistics({id,header}: {id:string;header:React.ReactElement}) {
  const query=useQuery(universityStats(id));const data=query.data;
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-10">{header}{query.isPending ? <Skeleton /> : !data ? <ErrorState error={query.error} retry={()=>void query.refetch()} /> : <>
    <View className="flex-row gap-2"><Metric compact label="Akademik birim" value={data.facultyCount} /><Metric compact label="Program" value={data.programCount} /><Metric compact label="Yerleştirme seçeneği" value={data.optionCount} /></View>
    <Distribution compact columns={2} title="Program düzeyleri" items={data.degreeLevels} /><Distribution compact columns={2} title="Puan türleri" items={data.scoreTypes} /><Distribution compact columns={2} title="Fakülte ve MYO programları" items={data.academicUnits} /><Distribution compact columns={2} title="En iyi başarı sırasıyla alan programlar" items={(data.bestRankedPrograms ?? []).filter(item=>(item.currentBestRank ?? 0)>0).map(item=>({label:item.name,count:item.currentBestRank}))} />
    <DataTable compact fit label="Yıllara göre yerleşme" columns={['Yıl','Kontenjan','Yerleşen','Doluluk']} rows={(data.yearly ?? []).map(item=>[item.year == null ? undefined : String(item.year),item.quota,item.placed,item.fillRate==null?'—':`%${item.fillRate.toLocaleString('tr-TR')}`])} />
    {query.isError && <ErrorState error={query.error} retry={()=>void query.refetch()} />}
  </>}</ScrollView>;
}
