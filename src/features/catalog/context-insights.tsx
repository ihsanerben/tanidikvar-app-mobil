import {ExperienceCard,ExperienceTabs} from "./experience-card";
import {ExperienceEditor} from "./experience-editor";
import {MeasurementCard} from "./measurement-card";
import {Poll} from "./poll-card";
import {EvaluationRatings} from "./evaluation-ratings";
import {ContributionDialog} from './contribution-dialog';
import {useState,type ReactElement} from 'react';
import { useInfiniteQuery, useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { router } from 'expo-router';
import { questionList } from '@/features/questions/api';
import { QuestionCard } from '@/features/questions/question-card';
import { peopleList } from './api';
import { Person } from './people-screen';
import { api } from '@/lib/api/client';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { myProfile } from '@/features/profile/api';
import { Card } from '@/components/ui/card';
import { Metric } from '@/components/ui/metric';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { PollCreate } from './context-contribution';
import { pollParticipationQuery, decisionKeys, summaryQuery, metricsQuery, evaluationsQuery, pollsQuery, experiencesQuery } from './decision-queries';
const labels: Record<string,string> = { WEEKLY_STUDY_HOURS:'Haftalık çalışma', ATTENDANCE_LEVEL:'Devam zorunluluğu', PROJECT_INTENSITY:'Proje yoğunluğu', EXAM_INTENSITY:'Sınav yoğunluğu', ENGLISH_PERCENT:'İngilizce kullanımı', GROUP_WORK_PERCENT:'Grup çalışması', CAMPUS_HOURS:'Kampüste geçirilen süre', MONTHLY_HOUSING_COST:'Aylık barınma', MONTHLY_TRANSPORT_COST:'Aylık ulaşım', MONTHLY_FOOD_COST:'Aylık yemek' };
export const metricOptions = Object.entries(labels).map(([value,label]) => ({value,label}));
export function ContextInsights({universityId,programId,departmentId,view='general',header,contentId,metricKey,programCount,questionCount,tanidikCount}: {universityId:string;programId?:string;departmentId?:string;view?:'general'|'evaluations'|'polls'|'metrics'|'experiences';header:ReactElement;contentId?:string;metricKey?:string;programCount?:number;questionCount?:number;tanidikCount?:number}) {
  const [selectedTemplate,setSelectedTemplate]=useState<string>();
  const focusedEvaluation=useQuery({queryKey:['catalog','decisions','evaluation',contentId],enabled:!!contentId&&view==='evaluations',queryFn:({signal})=>api.call('get','/api/evaluations/{id}',{params:{id:contentId!},signal})});
  const focusedPoll=useQuery({queryKey:['catalog','decisions','poll',contentId],enabled:!!contentId&&view==='polls',queryFn:({signal})=>api.call('get','/api/polls/{id}',{params:{id:contentId!},signal})});
  const focusedExperience=useQuery({queryKey:['catalog','decisions','experience',contentId],enabled:!!contentId&&view==='experiences',queryFn:({signal})=>api.call('get','/api/experiences/{id}',{params:{id:contentId!},signal})});
  const template=selectedTemplate??focusedExperience.data?.templateType??'WHY_I_CHOSE';
  const client = useQueryClient();
  const showCommunity = !!departmentId && view === 'general';
  const questions = useInfiniteQuery({...questionList({universityId,departmentId,scope:'UNIVERSITY_DEPARTMENT',sort:'MOST_COMMENTED'}),enabled:showCommunity});
  const people = useInfiniteQuery({...peopleList(universityId,departmentId),enabled:showCommunity});
  const summary = useQuery({ ...summaryQuery(universityId, programId), enabled: view === 'general' || view === 'evaluations' });
  const evaluations = useInfiniteQuery({ ...evaluationsQuery(universityId, programId), enabled: view === 'evaluations' && !!contentId });
  const polls = useInfiniteQuery({ ...pollsQuery(universityId, programId), enabled: view === 'general' || view === 'polls' });
  const metrics = useQuery({ ...metricsQuery(universityId, programId), enabled: view === 'general' || view === 'metrics' });
  const experiences = useInfiniteQuery({ ...experiencesQuery(universityId, programId,view==='experiences'?template:undefined), enabled: view === 'general' || view === 'experiences' });
  const refresh = () => client.invalidateQueries({ queryKey: decisionKeys.context(universityId, programId) });
  const activeQueries = view === 'polls' ? [polls] : view === 'evaluations' ? [summary] : view === 'metrics' ? [metrics] : view === 'experiences' ? [experiences] : [summary,polls,metrics,experiences];
  const list = view === 'polls' ? polls : view === 'evaluations' ? evaluations : experiences;
  const user=useCurrentUser();
  const profile=useQuery({...myProfile(),enabled:!!user.data});
  const canContribute=!!user.data && user.data.role !== 'MANAGER' && ['UNIVERSITE_OGRENCISI','MEZUN'].includes(profile.data?.educationStatus??'') && profile.data?.education?.universityId === universityId && (!programId || profile.data?.programId === programId);
  const canVote=!!user.data&&user.data.role!=='MANAGER'&&profile.data?.education?.universityId===universityId&&(profile.data?.educationStatus==='UNIVERSITE_OGRENCISI'||user.data.role==='TANIDIK');
  const data = {
    summary: summary.data,
    evaluations: evaluations.data?.pages.flatMap(page => page.items ?? []) ?? [],
    polls: polls.data?.pages.flatMap(page => page.items ?? []) ?? [],
    metrics: metrics.data ?? [],
    experiences: experiences.data?.pages.flatMap(page => page.items ?? []) ?? [],
  };
  const {status}=useAuth();
  const pollIds=[...new Set([...data.polls.map(poll=>poll.id),...(focusedPoll.data?[focusedPoll.data.id]:[])].filter((id):id is string=>!!id))];
  const participation=useQueries({queries:Array.from({length:Math.ceil(pollIds.length/100)},(_,index)=>({...pollParticipationQuery(pollIds.slice(index*100,index*100+100)),enabled:view==='polls'&&status==='authenticated'}))});
  const votes=participation.flatMap(query=>query.data??[]);
  const participationReady=status!=='authenticated'||participation.every(query=>query.isSuccess);
  const sections: {id:string;content:ReactElement}[]=[];
  const add=(id:string,content:ReactElement) => sections.push({id,content});
  if(contentId&&['evaluations','polls','experiences'].includes(view)&&(view!=='experiences'||!focusedExperience.data||focusedExperience.data.templateType===template)) {
    const focused=view==='evaluations'?focusedEvaluation:view==='polls'?focusedPoll:focusedExperience;
    add('focused',<View className="gap-2 rounded-card border-2 border-primary p-2"><Text variant="label">Bildirimdeki içerik</Text>
      {focused.isPending?<Skeleton/>:focused.isError?<ErrorState error={focused.error} retry={()=>void focused.refetch()}/>:view==='polls'&&focusedPoll.data?<Poll poll={focusedPoll.data} saved={votes.find(vote=>vote.pollId===focusedPoll.data?.id)?.optionId} participationReady={participationReady} canVote={canVote}/>:view==='evaluations'&&focusedEvaluation.data?<Card><Text>{focusedEvaluation.data.rating} / 5</Text><Text>{focusedEvaluation.data.body}</Text><Text variant="muted">{focusedEvaluation.data.authorName}</Text></Card>:focusedExperience.data?<ExperienceCard item={focusedExperience.data} userId={user.data?.id} canEdit={canContribute} after={()=>void refresh()}/>:null}
    </View>);
  }
  // Loading/error notices live in the header: removing placeholder rows while
  // native layout events are pending can invalidate FlashList's row indices.
  const queryStatus = <View>{[...activeQueries,...(view==='polls'&&status==='authenticated'?participation:[]),...(showCommunity?[questions,people]:[])].map((part,index)=><View key={index}>{part.isPending && <Skeleton variant={view === 'general' ? 'metrics' : 'list'} />}{part.isError && <ErrorState error={part.error} retry={()=>void part.refetch()} />}</View>)}</View>;

  {
    if(view==='evaluations') {
      if (data.summary) add('summary',<Text variant="muted">{data.summary.evaluationCount ?? 0} topluluk değerlendirmesi · Ortalama {(data.summary.averageRating ?? 0).toLocaleString('tr-TR')} / 5</Text>);
      add('evaluate',<EvaluationRatings universityId={universityId} programId={programId} canContribute={canContribute}/>);
    } else if(view==='polls') {
      add('poll-toolbar',<View className="min-h-touch-ios flex-row items-center justify-between gap-2"><Text variant="muted">{polls.data?.pages[0]?.totalElements ?? '—'} anket</Text>{canContribute&&user.data?.role==='TANIDIK'&&<ContributionDialog label="Anket ekle"><PollCreate universityId={universityId} programId={programId} after={() => void refresh()} /></ContributionDialog>}</View>);
      data.polls.forEach(poll => add(`poll-${poll.id}`,<Poll poll={poll} saved={votes.find(vote=>vote.pollId===poll.id)?.optionId} participationReady={participationReady} canVote={canVote}/>));
      if(polls.isSuccess && !data.polls.length)add('empty',<Text variant="muted">Henüz anket yok.</Text>);
    } else if(view==='general') {
      add('summary',<View className="gap-3"><View className="flex-row gap-2"><Metric label="Topluluk puanı" value={data.summary ? data.summary.evaluationCount ? `${(data.summary.averageRating??0).toLocaleString('tr-TR',{maximumFractionDigits:1})} / 5` : 'Henüz oy yok' : undefined}/><Metric label="Değerlendirme" value={data.summary?.evaluationCount}/></View>{(programCount!==undefined||questionCount!==undefined)&&<View className="flex-row gap-2"><Metric label="Program" value={programCount}/><Metric label="Soru" value={questionCount}/></View>}{tanidikCount!==undefined&&<Metric label="Tanıdık" value={tanidikCount}/>}<View className="flex-row gap-2"><Metric label="Anket" value={polls.data?.pages[0]?.totalElements}/><Metric label="Deneyim" value={experiences.data?.pages[0]?.totalElements}/></View><View className="flex-row gap-2"><Metric label="Ölçüm katkısı" value={metrics.data?data.metrics.reduce((sum,item)=>sum+(item.sampleSize??0),0):undefined}/><Metric label="Katkı yapılan ölçüm" value={metrics.data?data.metrics.filter(item=>(item.sampleSize??0)>0).length:undefined}/></View></View>);
    } else {
      if(departmentId)add('general-heading',<Text variant="heading">Karar verileri</Text>);

      if(view==='metrics') {
        if(!canContribute)add('measurement-policy',<Text variant="muted">Bu üniversitenin öğrencileri ve mezunları ölçümlere katılabilir.</Text>);
        for(const cost of [false,true]) {
          add(cost?'cost-heading':'life-heading',<View className="gap-2"><Text variant="heading">{cost?'Güncel öğrenci maliyeti':'Öğrencilik ve kampüs yaşamı'}</Text>{cost&&<Text variant="muted">Aylık giderler Türk lirası cinsindedir. Sonuçlar en az 5 katkıyla görünür.</Text>}</View>);
          metricOptions.filter(item=>item.value.startsWith('MONTHLY_')===cost).forEach(item=>add(`metric-${item.value}`,<MeasurementCard metricKey={item.value} label={item.label} metric={data.metrics.find(metric=>metric.metricKey===item.value)} universityId={universityId} programId={programId} canContribute={canContribute} targeted={metricKey===item.value} after={()=>void refresh()}/>));
        }
      }
      if(view==='experiences'){
      add('experience-templates',<View className="flex-row items-center gap-2"><View className="min-w-0 flex-1"><ExperienceTabs value={template} onChange={setSelectedTemplate}/></View>{canContribute&&<ContributionDialog key={template} label="Yorum yaz" variant="primary"><ExperienceEditor universityId={universityId} programId={programId} templateType={template} after={()=>void refresh()}/></ContributionDialog>}</View>);
      if(!canContribute)add('experience-policy',<Text variant="muted">Bu üniversitenin öğrencileri ve mezunları deneyim paylaşabilir.</Text>);
      if(experiences.isSuccess&&!data.experiences.length)add('empty-experiences',<Text variant="muted">Bu soruya henüz deneyim paylaşılmadı.</Text>);
      data.experiences.filter(item=>item.id!==contentId).forEach(item=>add(`experience-${item.id}`,<ExperienceCard item={item} userId={user.data?.id} canEdit={canContribute} after={()=>void refresh()}/>));
      }
    }
  }
  if(view==='metrics'&&metricKey){const index=sections.findIndex(item=>item.id===`metric-${metricKey}`);if(index>0)sections.unshift(...sections.splice(index,1));}
  if (view!=="general"&&view!=="metrics"&&view!=="evaluations"&&list.hasNextPage) add('load-more', <Button label="Daha fazla göster" variant="secondary" pending={list.isFetchingNextPage} onPress={() => { void list.fetchNextPage(); }} />);
  if (showCommunity) {
    add('questions-heading', <Text variant="heading">Sorular</Text>);


    (questions.data?.pages.flatMap(page=>page.items??[]) ?? []).forEach(item=>add(`question-${item.id}`,<QuestionCard item={item} />));
    if(questions.isSuccess && !questions.data.pages[0]?.items?.length)add('questions-empty',<Card><Text variant="heading">Henüz soru yok</Text><Text>Bu program hakkındaki ilk soruyu topluluğa yöneltebilirsin.</Text></Card>);
    if(questions.hasNextPage)add('questions-more',<Button label="Daha fazla soru" pending={questions.isFetchingNextPage} onPress={()=>void questions.fetchNextPage()} />);
    add('people-heading',<Text variant="heading">Tanıdıklar</Text>);


    (people.data?.pages.flatMap(page=>page.items??[]) ?? []).forEach(item=>add(`person-${item.id}`,<Person item={item} />));
    if(people.isSuccess && !people.data.pages[0]?.items?.length)add('people-empty',<Card><Text variant="heading">Henüz Tanıdık yok</Text><Text>Bu üniversite için doğrulanan öğrenciler ve mezunlar burada görünecek.</Text><Button label="Tanıdık ol" onPress={()=>router.push('/profile/application')} /></Card>);
    if(people.hasNextPage)add('people-more',<Button label="Daha fazla Tanıdık" pending={people.isFetchingNextPage} onPress={()=>void people.fetchNextPage()} />);
  }
  const rows: typeof sections = [];
  for (let index = 0; index < sections.length; index++) {
    const section = sections[index];
    const tile = (id: string) => id.startsWith('metric-') || (id.startsWith('poll-') && id !== 'poll-toolbar');
    if (!tile(section.id)) { rows.push(section); continue; }
    const next = sections[index + 1];
    const pair = next && tile(next.id) ? next : undefined;
    rows.push({id:section.id,content:<View className="flex-row items-stretch gap-2"><View className="min-w-0 flex-1">{section.content}</View><View className="min-w-0 flex-1">{pair?.content}</View></View>});
    if (pair) index++;
  }
  return <FlashList maintainVisibleContentPosition={{disabled:true}} showsVerticalScrollIndicator={false} key={`${universityId}:${programId}:${view}`} data={rows} renderItem={InsightRow} keyExtractor={item => item.id} ListHeaderComponent={<View>{header}{queryStatus}</View>}  ItemSeparatorComponent={InsightGap} onRefresh={() => void refresh()} refreshing={activeQueries.some(part => part.isRefetching)} />;
}
function InsightRow({item}: {item:{content:ReactElement}}) {return item.content;}
function InsightGap(){return <View className="h-list-gap" />;}
