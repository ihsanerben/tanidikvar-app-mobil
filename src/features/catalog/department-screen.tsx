import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { View } from 'react-native';
import { z } from 'zod';
import { api } from '@/lib/api/client';
import { Screen } from '@/components/ui/screen';
import { PageHeader } from '@/components/ui/page';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { ContextCommunity } from './community-screen';
import { ContextInsights } from './context-insights';
export const departmentParams=z.object({universityId:z.uuid(),departmentId:z.uuid()});
export function DepartmentScreen(){const p=departmentParams.safeParse(useLocalSearchParams());return <Screen>{p.success?<Department {...p.data} />:<ErrorState error={null} />}</Screen>;}
function Department({universityId,departmentId}:z.infer<typeof departmentParams>){
  const [tab,setTab]=useState<'general'|'questions'|'evaluations'|'polls'|'people'>('general');
  const query=useQuery({queryKey:['catalog','department',universityId,departmentId],staleTime:60_000,queryFn:({signal})=>api.call('get','/api/universities/{universityId}/departments/{departmentId}',{params:{universityId,departmentId},signal})});
  if(query.isPending)return <Skeleton variant="detail" />;
  if(!query.data)return <ErrorState error={query.error} retry={()=>void query.refetch()} />;
  const education=query.data;
  const header=<View className="gap-3 pb-4"><PageHeader title="" backHref={{pathname:'/universities/[id]',params:{id:universityId}}} backLabel={education.universityName ?? 'Üniversite'} /><Card><Text variant="muted">{education.universityName}</Text><Text variant="title">{education.departmentName}</Text><Text>Bu programa özel sorular, öğrenciler, mezunlar ve karar verileri burada toplanır.</Text></Card><Tabs label="Program bölümleri" value={tab} onChange={setTab} options={[{value:'general',label:'Genel'},{value:'questions',label:'Sorular'},{value:'evaluations',label:'Değerlendirmeler'},{value:'polls',label:'Anketler'},{value:'people',label:'Tanıdıklar'}]} />{tab==='questions' && <Button label="Soru sor" onPress={()=>router.push({pathname:'/questions/new',params:{universityId,departmentId,programId:education.id}})} />}</View>;
  return tab==='questions'||tab==='people'?<ContextCommunity params={{universityId,departmentId,programId:education.id,view:tab}} header={header} />:<ContextInsights universityId={universityId} programId={education.id} view={tab} header={header} />;
}
