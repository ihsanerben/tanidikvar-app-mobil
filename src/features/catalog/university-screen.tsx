import { useState } from 'react';
import { Linking, Share, View, ScrollView } from 'react-native';
import { Image } from '@/components/ui/image';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';
import { Screen } from '@/components/ui/screen';
import { PageHeader } from '@/components/ui/page';
import { PagedList } from '@/components/ui/paged-list';
import { Tabs } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Metric } from '@/components/ui/metric';
import { Distribution } from '@/components/ui/distribution';
import { DataTable } from '@/components/ui/data-table';
import { ActionButton } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { RetentionButton } from '@/features/retention/retention-button';
import { sharePath } from '@/lib/navigation/params';
import { ContextInsights } from './context-insights';
import { ContextCommunity } from './community-screen';
import { programList, universityDetail, universityStats } from './api';
import { ProgramCard } from './cards';
import { AppFooter } from '@/components/ui/app-footer';
const params=z.object({id:z.uuid()});
type Tab='general'|'programs'|'statistics'|'questions'|'evaluations'|'polls'|'people';
export function UniversityDetailScreen(){const p=params.safeParse(useLocalSearchParams());return <Screen>{p.success ? <University id={p.data.id} /> : <ErrorState error={null} />}</Screen>;}
function University({id}: {id:string}) {
  const query=useQuery(universityDetail(id));
  const [tab,setTab]=useState<Tab>('general');
  if(query.isPending)return <Skeleton variant="detail" />;
  if(!query.data)return <ErrorState error={query.error} retry={()=>void query.refetch()} />;
  const university=query.data;
  // Accent values are API supplied theme data, validated before use as native colors.
  const accent=/^#[0-9a-fA-F]{6}$/.test(university.accentPrimary ?? '') ? university.accentPrimary : undefined;
  const soft=/^#[0-9a-fA-F]{6}$/.test(university.accentSoft ?? '') ? university.accentSoft : undefined;
  const header=<View className="gap-3 pb-4"><PageHeader title="" backHref="/kesfet" backLabel="Üniversiteler" />
    <Card style={soft ? {backgroundColor:soft} : undefined}>
      {university.logoUrl && <Image source={{uri:university.logoUrl}} contentFit="contain" accessibilityLabel={`${university.name} logosu`} className="h-20 w-20" />}
      <Text variant="muted">{[university.city,university.institutionType].filter(Boolean).join(' · ') || 'Üniversite topluluğu'}</Text><Text variant="title" style={accent ? {color:accent} : undefined}>{university.name}</Text><Text>{university.description ?? 'Programlar ve bu üniversiteye ait topluluk içerikleri tek bağlamda.'}</Text>
      {university.websiteUrl && /^https?:\/\//.test(university.websiteUrl) && <ActionButton label="Resmî web sitesi" action={()=>Linking.openURL(university.websiteUrl!)} />}
      <View className="flex-row flex-wrap gap-2"><RetentionButton kind="follows" id={id} /><ActionButton label="Paylaş" action={()=>Share.share({message:sharePath('universiteler',id,university.name)})} /></View>
    </Card>
    {query.isError && <ErrorState error={query.error} retry={()=>void query.refetch()} />}
    <Tabs label="Üniversite bölümleri" value={tab} onChange={setTab} options={[{value:'general',label:'Genel'},{value:'programs',label:'Programlar'},{value:'statistics',label:'İstatistikler'},{value:'questions',label:'Sorular'},{value:'evaluations',label:'Değerlendirmeler'},{value:'polls',label:'Anketler'},{value:'people',label:'Tanıdıklar'}]} />
    {tab==='questions' && <Button label="Soru sor" onPress={()=>router.push({pathname:'/questions/new',params:{universityId:id}})} />}
  </View>;
  if(tab==='programs')return <Programs id={id} header={header} />;
  if(tab==='statistics')return <Statistics id={id} header={header} />;
  if(tab==='questions'||tab==='people')return <ContextCommunity params={{universityId:id,view:tab}} header={header} />;
  return <ContextInsights universityId={id} view={tab} header={header} />;
}
function Programs({id,header}: {id:string;header:React.ReactElement}) {
  const [q,setQ]=useState('');const [applied,setApplied]=useState('');const [scoreType,setScore]=useState<''|'TYT'|'SAY'|'EA'|'SÖZ'|'DİL'>('');const [degreeLevel,setDegree]=useState<''|'LISANS'|'ONLISANS'>('');const [sort,setSort]=useState<'NAME'|'RANK'>('RANK');
  const query=useInfiniteQuery(programList({universityId:id,q:applied,scoreType,degreeLevel,sort}));
  return <PagedList query={query} renderItem={ProgramCard} header={<View className="gap-3 pb-4">{header}<FormField label="Program ara" value={q} onChangeText={setQ} onSubmitEditing={()=>setApplied(q)} /><Select label="Puan türü" value={scoreType} onChange={setScore} options={(['','TYT','SAY','EA','SÖZ','DİL'] as const).map(value=>({value,label:value||'Tümü'}))} /><Select label="Düzey" value={degreeLevel} onChange={setDegree} options={[{value:'',label:'Tümü'},{value:'LISANS',label:'Lisans'},{value:'ONLISANS',label:'Ön lisans'}]} /><Select label="Sırala" value={sort} onChange={setSort} options={[{value:'RANK',label:'Başarı sırasına göre'},{value:'NAME',label:'Ada göre'}]} /><Button label="Filtrele" onPress={()=>setApplied(q)} /></View>} />;
}
function Statistics({id,header}: {id:string;header:React.ReactElement}) {
  const query=useQuery(universityStats(id));const data=query.data;
  return <ScrollView contentContainerClassName="gap-3 pb-10">{header}{query.isPending ? <Skeleton /> : !data ? <ErrorState error={query.error} retry={()=>void query.refetch()} /> : <>
    <View className="flex-row gap-2"><Metric label="Akademik birim" value={data.facultyCount} /><Metric label="Program" value={data.programCount} /><Metric label="Yerleştirme seçeneği" value={data.optionCount} /></View>
    <Distribution title="Program düzeyleri" items={data.degreeLevels} /><Distribution title="Puan türleri" items={data.scoreTypes} /><Distribution title="Fakülte ve MYO programları" items={data.academicUnits} /><Distribution title="En iyi başarı sırasıyla alan programlar" items={(data.bestRankedPrograms ?? []).filter(item=>(item.currentBestRank ?? 0)>0).map(item=>({label:item.name,count:item.currentBestRank}))} />
    <DataTable label="Yıllara göre yerleşme" columns={['Yıl','Kontenjan','Yerleşen','Doluluk']} rows={(data.yearly ?? []).map(item=>[item.year,item.quota,item.placed,item.fillRate==null?'—':`%${item.fillRate.toLocaleString('tr-TR')}`])} />
    {query.isError && <ErrorState error={query.error} retry={()=>void query.refetch()} />}
  </>}<AppFooter /></ScrollView>;
}
