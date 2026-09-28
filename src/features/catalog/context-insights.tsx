import {ContributionDialog} from './contribution-dialog';
import type { ReactElement } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { router } from 'expo-router';
import { questionList } from '@/features/questions/api';
import { QuestionCard } from '@/features/questions/question-card';
import { peopleList } from './api';
import { Person } from './people-screen';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { api } from '@/lib/api/client';
import type { Schema } from '@/lib/api/types';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { myProfile } from '@/features/profile/api';
import { Card } from '@/components/ui/card';
import { Metric } from '@/components/ui/metric';
import { Text } from '@/components/ui/text';
import { FeatureForm } from '@/components/ui/feature-form';
import { RadioGroup } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { useLoginAction } from '@/features/auth/use-login-action';
import { Select } from '@/components/ui/select';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { ContextContribution, PollCreate } from './context-contribution';
import { decisionKeys, summaryQuery, metricsQuery, sentimentsQuery, careerQuery, evaluationsQuery, pollsQuery, experiencesQuery } from './decision-queries';
const labels: Record<string,string> = { WEEKLY_STUDY_HOURS:'Haftalık çalışma', ATTENDANCE_LEVEL:'Devam zorunluluğu', PROJECT_INTENSITY:'Proje yoğunluğu', EXAM_INTENSITY:'Sınav yoğunluğu', ENGLISH_PERCENT:'İngilizce kullanımı', GROUP_WORK_PERCENT:'Grup çalışması', CAMPUS_HOURS:'Kampüste geçirilen süre', MONTHLY_HOUSING_COST:'Aylık barınma', MONTHLY_TRANSPORT_COST:'Aylık ulaşım', MONTHLY_FOOD_COST:'Aylık yemek' };
export const metricOptions = Object.entries(labels).map(([value,label]) => ({value,label}));
function CategoryBars({title,items}: {title:string;items?:Schema['CareerCategoryResponse'][]}) {
  const max = Math.max(1,...(items ?? []).map(item => item.count ?? 0));
  return <Card><Text variant="heading">{title}</Text>{(items ?? []).map(item => <View key={item.label} className="gap-1"><View className="flex-row justify-between gap-2"><Text className="min-w-0 flex-1 text-caption">{item.label}</Text><Text variant="muted">{item.count ?? 0}</Text></View><View className="h-2 rounded-full bg-primary-soft"><View className="h-2 rounded-full bg-primary" style={{width:`${(item.count ?? 0)/max*100}%`}} /></View></View>)}</Card>;
}
const evaluationSchema = z.object({rating:z.enum(['1','2','3','4','5']),focus:z.string(),body:z.string().max(2000)});
const voteSchema = z.object({optionId:z.uuid('Oy vermek için bir seçenek seç.')});
function Poll({poll}: {poll:Schema['PollResponse']}) {
  const client=useQueryClient();
  const {status}=useAuth();
  const loginAction=useLoginAction();
  const options=(poll.options ?? []).filter(item=>!!item.id).map(item=>({value:item.id!,label:item.label || 'Seçenek',detail:`${(item.voteCount ?? 0).toLocaleString('tr-TR')} oy`}));
  return <Card><Text variant="heading">{poll.question}</Text><Text variant="muted">{poll.totalVotes ?? 0} oy · {poll.verifiedVoteCount ?? 0} doğrulanmış katılımcı{poll.verifiedOnly ? ' · yalnız doğrulanmış katılım' : ''}</Text>
    {status === 'authenticated' ? <FeatureForm key={poll.id} schema={voteSchema} defaults={{optionId:''}} fields={[]} label="Oy ver" submit={body => api.call('put','/api/polls/{id}/vote',{params:{id:poll.id!},body,authenticated:true})} onSuccess={() => { void client.invalidateQueries({queryKey:decisionKeys.all}); }}>
      {form => <Controller control={form.control} name="optionId" render={({field,fieldState}) => <RadioGroup label="Anket seçenekleri" value={field.value} onChange={field.onChange} options={options} disabled={form.formState.isSubmitting} error={fieldState.error?.message} />} />}
    </FeatureForm> : <><RadioGroup label="Anket seçenekleri ve oylar" value="" options={options} disabled onChange={()=>undefined} /><Button label="Oy vermek için giriş yap" variant="secondary" onPress={()=>loginAction(()=>undefined)} /></>}
  </Card>;
}

export function ContextInsights({universityId,programId,departmentId,view='general',header,contentId,metricKey}: {universityId:string;programId?:string;departmentId?:string;view?:'general'|'evaluations'|'polls'|'metrics'|'experiences';header:ReactElement;contentId?:string;metricKey?:string}) {
  const focusedEvaluation=useQuery({queryKey:['catalog','decisions','evaluation',contentId],enabled:!!contentId&&view==='evaluations',queryFn:({signal})=>api.call('get','/api/evaluations/{id}',{params:{id:contentId!},signal})});
  const focusedPoll=useQuery({queryKey:['catalog','decisions','poll',contentId],enabled:!!contentId&&view==='polls',queryFn:({signal})=>api.call('get','/api/polls/{id}',{params:{id:contentId!},signal})});
  const focusedExperience=useQuery({queryKey:['catalog','decisions','experience',contentId],enabled:!!contentId&&view==='experiences',queryFn:({signal})=>api.call('get','/api/experiences/{id}',{params:{id:contentId!},signal})});
  const client = useQueryClient();
  const showCommunity = !!departmentId && view === 'general';
  const questions = useInfiniteQuery({...questionList({universityId,departmentId,scope:'UNIVERSITY_DEPARTMENT',sort:'MOST_COMMENTED'}),enabled:showCommunity});
  const people = useInfiniteQuery({...peopleList(universityId,departmentId),enabled:showCommunity});
  const summary = useQuery({ ...summaryQuery(universityId, programId), enabled: view === 'general' || view === 'evaluations' });
  const evaluations = useInfiniteQuery({ ...evaluationsQuery(universityId, programId), enabled: view === 'evaluations' });
  const polls = useInfiniteQuery({ ...pollsQuery(universityId, programId), enabled: view === 'general' || view === 'polls' });
  const metrics = useQuery({ ...metricsQuery(universityId, programId), enabled: view === 'general' || view === 'metrics' });
  const sentiments = useQuery({ ...sentimentsQuery(universityId, programId), enabled: view === 'experiences' });
  const career = useQuery({ ...careerQuery(universityId, programId ?? ''), enabled: view === 'experiences' && !!programId });
  const experiences = useInfiniteQuery({ ...experiencesQuery(universityId, programId), enabled: view === 'general' || view === 'experiences' });
  const refresh = () => client.invalidateQueries({ queryKey: decisionKeys.context(universityId, programId) });
  const activeQueries = view === 'polls' ? [polls] : view === 'evaluations' ? [summary, evaluations] : view === 'metrics' ? [metrics] : view === 'experiences' ? [sentiments,experiences,...(programId?[career]:[])] : [summary,polls,metrics,experiences];
  const list = view === 'polls' ? polls : view === 'evaluations' ? evaluations : experiences;
  const user=useCurrentUser();
  const profile=useQuery({...myProfile(),enabled:!!user.data});
  const canContribute=user.data?.role === 'TANIDIK' && profile.data?.education?.universityId === universityId && (!programId || profile.data?.programId === programId);
  const data = {
    summary: summary.data,
    evaluations: evaluations.data?.pages.flatMap(page => page.items ?? []) ?? [],
    polls: polls.data?.pages.flatMap(page => page.items ?? []) ?? [],
    metrics: metrics.data ?? [],
    sentiments: sentiments.data,
    career: career.data,
    experiences: experiences.data?.pages.flatMap(page => page.items ?? []) ?? [],
  };
  const sections: {id:string;content:ReactElement}[]=[];
  const add=(id:string,content:ReactElement) => sections.push({id,content});
  if(contentId&&['evaluations','polls','experiences'].includes(view)) {
    const focused=view==='evaluations'?focusedEvaluation:view==='polls'?focusedPoll:focusedExperience;
    add('focused',<View className="gap-2 rounded-card border-2 border-primary p-2"><Text variant="label">Bildirimdeki içerik</Text>
      {focused.isPending?<Skeleton/>:focused.isError?<ErrorState error={focused.error} retry={()=>void focused.refetch()}/>:view==='polls'&&focusedPoll.data?<Poll poll={focusedPoll.data}/>:view==='evaluations'&&focusedEvaluation.data?<Card><Text>{focusedEvaluation.data.rating} / 5</Text><Text>{focusedEvaluation.data.body}</Text><Text variant="muted">{focusedEvaluation.data.authorName}</Text></Card>:focusedExperience.data?<Card><Text variant="heading">{focusedExperience.data.title}</Text><Text>{focusedExperience.data.body}</Text><Text variant="muted">{focusedExperience.data.authorName}</Text></Card>:null}
    </View>);
  }
  // Loading/error notices live in the header: removing placeholder rows while
  // native layout events are pending can invalidate FlashList's row indices.
  const queryStatus = <View>{[...activeQueries,...(showCommunity?[questions,people]:[])].map((part,index)=><View key={index}>{part.isPending && <Skeleton variant={view === 'general' ? 'metrics' : 'list'} />}{part.isError && <ErrorState error={part.error} retry={()=>void part.refetch()} />}</View>)}</View>;

  {
    if(view==='evaluations') {
      if (data.summary) add('summary',<Text variant="muted">{data.summary.evaluationCount ?? 0} topluluk değerlendirmesi · Ortalama {(data.summary.averageRating ?? 0).toLocaleString('tr-TR')} / 5</Text>);
      add('evaluate',canContribute ? <ContributionDialog label="Değerlendirme ekle"><Card><FeatureForm schema={evaluationSchema} defaults={{rating:'5',focus:'Eğitim kalitesi',body:''}} fields={[{name:'body',label:'Deneyimin',multiline:true}]} label="Değerlendirmeyi kaydet" submit={values => api.call('put','/api/evaluations',{body:{universityId,programId,rating:Number(values.rating),body:values.body.trim() ? `${values.focus}: ${values.body.trim()}` : values.focus},authenticated:true})} onSuccess={() => void refresh()}>{form => <><Controller control={form.control} name="rating" render={({field}) => <Select label="Genel puan" value={field.value} onChange={field.onChange} options={['5','4','3','2','1'].map(value => ({value,label:`${value} / 5`}))} />} /><Controller control={form.control} name="focus" render={({field}) => <Select label="Değerlendirme odağı" value={field.value} onChange={field.onChange} options={['Eğitim kalitesi','Akademik kadro','Kampüs ve sosyal yaşam','Ulaşım ve konum','Yurt ve barınma','Kariyer olanakları','Öğrenci işleri'].map(value => ({value,label:value}))} />} /></>}</FeatureForm></Card></ContributionDialog> : <Text variant="muted">Değerlendirme eklemek için profilinde bu üniversiteyle eşleşen bir Tanıdık olmalısın.</Text>);
      data.evaluations.forEach(item => add(`evaluation-${item.id}`,<Card><Text accessibilityLabel={`${item.rating} yıldız`} className="text-gold">{'★'.repeat(item.rating ?? 0)}{'☆'.repeat(5-(item.rating ?? 0))}</Text>{!!item.body && <Text>{item.body}</Text>}<Text variant="muted">{item.authorName}</Text></Card>));
      if(evaluations.isSuccess && !data.evaluations.length)add('empty',<Text variant="muted">Henüz değerlendirme yok.</Text>);
    } else if(view==='polls') {
      add('count',<Text variant="muted">{polls.data?.pages[0]?.totalElements ?? '—'} anket</Text>);
      if(canContribute)add('create',<ContributionDialog label="Anket ekle"><PollCreate universityId={universityId} programId={programId} after={() => void refresh()} /></ContributionDialog>);
      data.polls.forEach(poll => add(`poll-${poll.id}`,<Poll poll={poll} />));
      if(polls.isSuccess && !data.polls.length)add('empty',<Text variant="muted">Henüz anket yok.</Text>);
    } else if(view==='general') {
      add('summary',<View className="gap-3"><View className="flex-row gap-2"><Metric label="5 üzerinden puan" value={data.summary?.averageRating}/><Metric label="değerlendirme" value={data.summary?.evaluationCount}/><Metric label="anket" value={polls.data?.pages[0]?.totalElements}/></View><View className="flex-row gap-2"><Metric label="ölçüm katkısı" value={data.metrics.reduce((sum,item)=>sum+(item.sampleSize??0),0)}/><Metric label="deneyim" value={experiences.data?.pages[0]?.totalElements}/></View></View>);
    } else {
      if(departmentId)add('general-heading',<Text variant="heading">Karar verileri</Text>);

      if(canContribute)add('contribute',<ContributionDialog label={view==='metrics'?'Ölçüm ekle':'Deneyim ekle'}><ContextContribution universityId={universityId} programId={programId} kind={view==='metrics'?'metric':'experience'} after={() => void refresh()} /></ContributionDialog>);
      if(view==='metrics')for(const cost of [false,true]) {
        const metrics=data.metrics.filter(item => item.metricKey?.startsWith('MONTHLY_') === cost);
        if(metrics.length)add(cost?'cost-heading':'life-heading',<View className="gap-2"><Text variant="heading">{cost?'Güncel öğrenci maliyeti':'Gerçek hayat ölçümleri'}</Text>{cost && <Text variant="muted">Para değerleri yalnız bilgi amaçlıdır; iyi veya kötü olarak renklendirilmez.</Text>}</View>);
        metrics.forEach(item => add(`metric-${item.metricKey}`,<Card className={metricKey===item.metricKey ? "border-2 border-primary" : undefined}>{metricKey===item.metricKey&&<Text variant="label">Bildirimdeki ölçüm</Text>}<Text variant="heading">{item.privacyThresholdMet ? `${item.average?.toLocaleString('tr-TR') ?? '—'}${cost?' ₺':''}` : cost?'En az 5 katkı gerekli':'Gizli'}</Text><Text variant="muted">{labels[item.metricKey ?? ''] ?? 'Ölçüm'} · {item.sampleSize ?? 0} katkı ({item.verifiedSampleSize ?? 0} doğrulanmış){cost && item.updatedAt ? ` · ${new Date(item.updatedAt).toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}`:''}</Text></Card>));
      }
      if(view==='experiences'){
      if(data.sentiments?.positives?.length)add('positives',<CategoryBars title="Öğrencilerin en sevdiği şeyler" items={data.sentiments?.positives} />);
      if(data.sentiments?.negatives?.length)add('negatives',<CategoryBars title="En çok geliştirilmeli denilenler" items={data.sentiments?.negatives} />);
      if(data.career) {
        add('career',<Card><Text variant="heading">Bu program mezunları nereye gidiyor?</Text><Text>{data.career.privacyThresholdMet ? `${data.career.sampleSize} anonim mezun katkısı · Ortalama ilk iş bulma süresi ${data.career.averageJobSearchMonths ?? '—'} ay · ${data.career.graduateStudyCount ?? 0} yüksek lisans` : `Mezun gizliliği için sonuçlar en az 5 katkıdan sonra gösterilir. Şu an ${data.career.sampleSize ?? 0} katkı var.`}</Text></Card>);
        if(data.career.privacyThresholdMet) {add('sectors',<CategoryBars title="Sektörler" items={data.career.sectors} />);add('roles',<CategoryBars title="İlk roller" items={data.career.firstRoles} />);add('companies',<CategoryBars title="Şirket türleri" items={data.career.companyTypes} />);}
      }
      if(data.experiences.length)add('experiences-heading',<Text variant="heading">Yapılandırılmış deneyimler</Text>);
      data.experiences.forEach(item => add(`experience-${item.id}`,<Card><Text variant="muted">{item.templateType}</Text><Text variant="heading">{item.title}</Text><Text>{item.body}</Text><Text variant="muted">{item.authorName}</Text></Card>));
      }
    }
  }
  if(view==='metrics'&&metricKey){const index=sections.findIndex(item=>item.id===`metric-${metricKey}`);if(index>0)sections.unshift(...sections.splice(index,1));}
  if (view!=="general"&&view!=="metrics"&&list.hasNextPage) add('load-more', <Button label="Daha fazla göster" variant="secondary" pending={list.isFetchingNextPage} onPress={() => { void list.fetchNextPage(); }} />);
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
  return <FlashList key={`${universityId}:${programId}:${view}`} data={sections} renderItem={InsightRow} keyExtractor={item => item.id} ListHeaderComponent={<View>{header}{queryStatus}</View>}  ItemSeparatorComponent={InsightGap} onRefresh={() => void refresh()} refreshing={activeQueries.some(part => part.isRefetching)} />;
}
function InsightRow({item}: {item:{content:ReactElement}}) {return item.content;}
function InsightGap(){return <View className="h-list-gap" />;}
