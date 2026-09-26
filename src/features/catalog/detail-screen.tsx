import { Share, View, Pressable } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { PageHeader } from '@/components/ui/page';
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
  const query=useQuery(programDetail(id));
  const summary=query.data?.summary;
  const questions=useInfiniteQuery({...questionList({universityId:summary?.universityId,departmentId:summary?.departmentId}),enabled:!!summary?.universityId});
  if(query.isPending)return <Skeleton />;
  if(!query.data)return <ErrorState error={query.error} retry={()=>void query.refetch()} />;
  const header=<View className="gap-4 pb-4"><PageHeader title="" backHref={{pathname:'/kesfet',params:{kind:'programs'}}} backLabel="Programlar" /><Card><Text variant="muted">{summary?.degreeLevel} · {summary?.scoreTypes?.join(' / ')}</Text><Text variant="title">{summary?.name}</Text><Pressable accessibilityRole="link" disabled={!summary?.universityId} onPress={()=>summary?.universityId && router.push({pathname:'/universities/[id]',params:{id:summary.universityId}})} className="min-h-touch-ios justify-center"><Text>{summary?.universityName} · {summary?.city ?? 'Şehir belirtilmemiş'} · {summary?.institutionType}</Text></Pressable><Text variant="muted">{summary?.faculties?.join(' · ')}</Text><Button label="Soru sor" onPress={()=>router.push({pathname:'/questions/new',params:{universityId:summary?.universityId,departmentId:summary?.departmentId,programId:id}})} />{summary?.universityId && summary.departmentId && <Button label="Program topluluğu" variant="secondary" onPress={()=>router.push({pathname:'/department',params:{universityId:summary.universityId!,departmentId:summary.departmentId!}})} />}</Card>
    {query.isError && <ErrorState error={query.error} retry={()=>void query.refetch()} />}
    <ProgramAcademic data={query.data} /><ProgramOptions options={query.data.options ?? []} name={summary?.name} /><Text variant="heading">Sorular</Text>
  </View>;
  return <PagedList query={questions} renderItem={QuestionCard} header={header} footer={<View className="gap-3"><Text variant="muted">Kaynak: Resmî YÖK Atlas 2026 tercih kılavuzu ve Net Sihirbazı verileri.</Text><ActionButton label="Programı paylaş" action={()=>Share.share({message:sharePath('programlar',id)})} /></View>} />;
}
