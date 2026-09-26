import type { ReactElement } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
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
import { Select } from '@/components/ui/select';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { AppFooter } from '@/components/ui/app-footer';
import { ContextContribution, PollCreate } from './context-contribution';
const labels: Record<string,string> = { WEEKLY_STUDY_HOURS:'Haftalık çalışma', ATTENDANCE_LEVEL:'Devam zorunluluğu', PROJECT_INTENSITY:'Proje yoğunluğu', EXAM_INTENSITY:'Sınav yoğunluğu', ENGLISH_PERCENT:'İngilizce kullanımı', GROUP_WORK_PERCENT:'Grup çalışması', CAMPUS_HOURS:'Kampüste geçirilen süre', MONTHLY_HOUSING_COST:'Aylık barınma', MONTHLY_TRANSPORT_COST:'Aylık ulaşım', MONTHLY_FOOD_COST:'Aylık yemek' };
export const metricOptions = Object.entries(labels).map(([value,label]) => ({value,label}));
function decisionData(universityId: string, programId?: string) {
  return { queryKey: ['catalog','decisions',universityId,programId], staleTime: 30_000, queryFn: async ({signal}: {signal: AbortSignal}) => {
    const query = { universityId, programId, size: 20 };
    const [summary,evaluations,polls,metrics,experiences,sentiments,career] = await Promise.all([
      api.call('get','/api/evaluations/summary',{query,signal}), api.call('get','/api/evaluations',{query,signal}), api.call('get','/api/polls',{query,signal}), api.call('get','/api/context-metrics',{query,signal}), api.call('get','/api/experiences',{query,signal}), api.call('get','/api/experience-sentiments',{query,signal}), programId ? api.call('get','/api/career-outcomes',{query:{universityId,programId},signal}) : Promise.resolve(null),
    ]);
    return {summary,evaluations:evaluations.items ?? [],polls:polls.items ?? [],metrics,experiences:experiences.items ?? [],sentiments,career};
  }};
}
function CategoryBars({title,items}: {title:string;items?:Schema['CareerCategoryResponse'][]}) {
  const max = Math.max(1,...(items ?? []).map(item => item.count ?? 0));
  return <Card><Text variant="heading">{title}</Text>{(items ?? []).map(item => <View key={item.label} className="gap-1"><View className="flex-row justify-between gap-2"><Text className="min-w-0 flex-1 text-caption">{item.label}</Text><Text variant="muted">{item.count ?? 0}</Text></View><View className="h-2 rounded-full bg-primary-soft"><View className="h-2 rounded-full bg-primary" style={{width:`${(item.count ?? 0)/max*100}%`}} /></View></View>)}</Card>;
}
const evaluationSchema = z.object({rating:z.enum(['1','2','3','4','5']),focus:z.string(),body:z.string().max(2000)});
const voteSchema = z.object({optionId:z.uuid()});
function Poll({poll}: {poll:Schema['PollResponse']}) {
  const client=useQueryClient();
  return <Card><Text variant="heading">{poll.question}</Text><Text variant="muted">{poll.totalVotes ?? 0} oy · {poll.verifiedVoteCount ?? 0} doğrulanmış katılımcı{poll.verifiedOnly ? ' · yalnız doğrulanmış katılım' : ''}</Text>
    <FeatureForm schema={voteSchema} defaults={{optionId:''}} fields={[]} label="Oy ver" submit={body => api.call('put','/api/polls/{id}/vote',{params:{id:poll.id!},body,authenticated:true})} onSuccess={() => { void client.invalidateQueries({queryKey:['catalog','decisions']}); }}>
      {form => <Controller control={form.control} name="optionId" render={({field}) => <Select label="Seçeneğin" value={field.value} onChange={field.onChange} options={(poll.options ?? []).filter(item => !!item.id).map(item => ({value:item.id!,label:`${item.label} (${item.voteCount ?? 0})`}))} />} />}
    </FeatureForm>
  </Card>;
}
export function ContextInsights({universityId,programId,view='general',header}: {universityId:string;programId?:string;view?:'general'|'evaluations'|'polls';header:ReactElement}) {
  const query=useQuery(decisionData(universityId,programId));
  const user=useCurrentUser();
  const profile=useQuery({...myProfile(),enabled:!!user.data});
  const canContribute=user.data?.role === 'TANIDIK' && profile.data?.education?.universityId === universityId && (!programId || profile.data?.programId === programId);
  const data=query.data;
  const sections: {id:string;content:ReactElement}[]=[];
  const add=(id:string,content:ReactElement) => sections.push({id,content});
  if (query.isPending) add('loading',<Skeleton />);
  else if (!data) add('error',<ErrorState error={query.error} retry={() => void query.refetch()} />);
  if (data) {
    if (query.isError) add('retry',<ErrorState error={query.error} retry={() => void query.refetch()} />);
    if(view==='evaluations') {
      add('summary',<Text variant="muted">{data.summary.evaluationCount ?? 0} topluluk değerlendirmesi · Ortalama {(data.summary.averageRating ?? 0).toLocaleString('tr-TR')} / 5</Text>);
      add('evaluate',canContribute ? <Card><Text variant="heading">Deneyimini değerlendir</Text><FeatureForm schema={evaluationSchema} defaults={{rating:'5',focus:'Eğitim kalitesi',body:''}} fields={[{name:'body',label:'Deneyimin',multiline:true}]} label="Değerlendirmeyi kaydet" submit={values => api.call('put','/api/evaluations',{body:{universityId,programId,rating:Number(values.rating),body:values.body.trim() ? `${values.focus}: ${values.body.trim()}` : values.focus},authenticated:true})} onSuccess={() => void query.refetch()}>{form => <><Controller control={form.control} name="rating" render={({field}) => <Select label="Genel puan" value={field.value} onChange={field.onChange} options={['5','4','3','2','1'].map(value => ({value,label:`${value} / 5`}))} />} /><Controller control={form.control} name="focus" render={({field}) => <Select label="Değerlendirme odağı" value={field.value} onChange={field.onChange} options={['Eğitim kalitesi','Akademik kadro','Kampüs ve sosyal yaşam','Ulaşım ve konum','Yurt ve barınma','Kariyer olanakları','Öğrenci işleri'].map(value => ({value,label:value}))} />} /></>}</FeatureForm></Card> : <Text variant="muted">Değerlendirme eklemek için profilinde bu üniversiteyle eşleşen bir Tanıdık olmalısın.</Text>);
      data.evaluations.forEach(item => add(`evaluation-${item.id}`,<Card><Text accessibilityLabel={`${item.rating} yıldız`} className="text-gold">{'★'.repeat(item.rating ?? 0)}{'☆'.repeat(5-(item.rating ?? 0))}</Text>{!!item.body && <Text>{item.body}</Text>}<Text variant="muted">{item.authorName}</Text></Card>));
      if(!data.evaluations.length)add('empty',<Text variant="muted">Henüz değerlendirme yok.</Text>);
    } else if(view==='polls') {
      add('count',<Text variant="muted">{data.polls.length} aktif anket</Text>);
      if(canContribute)add('create',<PollCreate universityId={universityId} programId={programId} after={() => void query.refetch()} />);
      data.polls.forEach(poll => add(`poll-${poll.id}`,<Poll poll={poll} />));
      if(!data.polls.length)add('empty',<Text variant="muted">Henüz anket yok.</Text>);
    } else {
      add('metrics',<View className="flex-row gap-2"><Metric label="5 üzerinden puan" value={data.summary.averageRating ?? 0} /><Metric label="değerlendirme" value={data.summary.evaluationCount ?? 0} /><Metric label="anket" value={data.polls.length} /></View>);
      if(canContribute)add('contribute',<ContextContribution universityId={universityId} programId={programId} after={() => void query.refetch()} />);
      for(const cost of [false,true]) {
        const metrics=data.metrics.filter(item => item.metricKey?.startsWith('MONTHLY_') === cost);
        if(metrics.length)add(cost?'cost-heading':'life-heading',<View className="gap-2"><Text variant="heading">{cost?'Güncel öğrenci maliyeti':'Gerçek hayat ölçümleri'}</Text>{cost && <Text variant="muted">Para değerleri yalnız bilgi amaçlıdır; iyi veya kötü olarak renklendirilmez.</Text>}</View>);
        metrics.forEach(item => add(`metric-${item.metricKey}`,<Card><Text variant="heading">{item.privacyThresholdMet ? `${item.average?.toLocaleString('tr-TR') ?? '—'}${cost?' ₺':''}` : cost?'En az 5 katkı gerekli':'Gizli'}</Text><Text variant="muted">{labels[item.metricKey ?? ''] ?? 'Ölçüm'} · {item.sampleSize ?? 0} katkı ({item.verifiedSampleSize ?? 0} doğrulanmış){cost && item.updatedAt ? ` · ${new Date(item.updatedAt).toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}`:''}</Text></Card>));
      }
      if(data.sentiments.positives?.length)add('positives',<CategoryBars title="Öğrencilerin en sevdiği şeyler" items={data.sentiments.positives} />);
      if(data.sentiments.negatives?.length)add('negatives',<CategoryBars title="En çok geliştirilmeli denilenler" items={data.sentiments.negatives} />);
      if(data.career) {
        add('career',<Card><Text variant="heading">Bu program mezunları nereye gidiyor?</Text><Text>{data.career.privacyThresholdMet ? `${data.career.sampleSize} anonim mezun katkısı · Ortalama ilk iş bulma süresi ${data.career.averageJobSearchMonths ?? '—'} ay · ${data.career.graduateStudyCount ?? 0} yüksek lisans` : `Mezun gizliliği için sonuçlar en az 5 katkıdan sonra gösterilir. Şu an ${data.career.sampleSize ?? 0} katkı var.`}</Text></Card>);
        if(data.career.privacyThresholdMet) {add('sectors',<CategoryBars title="Sektörler" items={data.career.sectors} />);add('roles',<CategoryBars title="İlk roller" items={data.career.firstRoles} />);add('companies',<CategoryBars title="Şirket türleri" items={data.career.companyTypes} />);}
      }
      if(data.experiences.length)add('experiences-heading',<Text variant="heading">Yapılandırılmış deneyimler</Text>);
      data.experiences.forEach(item => add(`experience-${item.id}`,<Card><Text variant="muted">{item.templateType}</Text><Text variant="heading">{item.title}</Text><Text>{item.body}</Text><Text variant="muted">{item.authorName}</Text></Card>));
    }
  }
  return <FlashList data={sections} renderItem={InsightRow} keyExtractor={item => item.id} ListHeaderComponent={header} ListFooterComponent={<AppFooter />} ItemSeparatorComponent={InsightGap} onRefresh={() => void query.refetch()} refreshing={query.isRefetching} />;
}
function InsightRow({item}: {item:{content:ReactElement}}) {return item.content;}
function InsightGap(){return <View className="h-list-gap" />;}
