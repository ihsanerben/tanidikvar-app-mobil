import { useInfiniteQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, Pressable, Switch } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { PageHeader } from '@/components/ui/page';
import { PagedList } from '@/components/ui/paged-list';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { CatalogPicker } from './catalog-picker';
import { Metric } from '@/components/ui/metric';
import { ErrorState } from '@/components/ui/states';
import type { Schema } from '@/lib/api/types';
import { peopleList } from './api';
import { peopleParams } from '@/lib/navigation/params';
export function PeopleScreen() {
  const p = peopleParams.safeParse(useLocalSearchParams());
  return <Screen>{p.success ? <People key={JSON.stringify(p.data)} filters={p.data} /> : <ErrorState error={null} retry={() => router.replace('/people')} />}</Screen>;
}
function People({ filters }: { filters: z.infer<typeof peopleParams> }) {
  const query = useInfiniteQuery(peopleList(filters.universityId, filters.departmentId, filters.q,{educationStatus:filters.educationStatus || undefined,classYear:filters.classYear ? Number(filters.classYear):undefined,expertise:filters.expertise || undefined,verified:filters.verified ? true:undefined}));
  const form = useForm({ resolver: zodResolver(peopleParams), defaultValues: filters });
  const universityId=useWatch({control:form.control,name:"universityId"});
  return <PagedList query={query} renderItem={Person} header={<View className="gap-4 pb-5"><PageHeader title="Tanıdıklar" help="Üniversite, bölüm, sınıf, eğitim doğrulaması ve uzmanlık alanına göre deneyim sahibi Tanıdıklara ulaşabilirsin." /><Controller control={form.control} name="q" render={({ field }) => <FormField label="İsim veya uzmanlık" value={field.value} onChangeText={field.onChange} onSubmitEditing={form.handleSubmit(values => router.setParams(values))} />} /><CatalogPicker universityId={universityId} onUniversity={item=>{form.setValue('universityId',item.id);form.setValue('departmentId',undefined);}} onProgram={item=>form.setValue('departmentId',item.departmentId)} />
    <Controller control={form.control} name="educationStatus" render={({field})=><Select label="Durum" value={field.value} onChange={field.onChange} options={[{value:'',label:'Tümü'},{value:'UNIVERSITE_OGRENCISI',label:'Öğrenci'},{value:'MEZUN',label:'Mezun'}]} />} />
    <Controller control={form.control} name="classYear" render={({field})=><Select label="Sınıf" value={field.value} onChange={field.onChange} options={(['','1','2','3','4','5','6'] as const).map(value=>({value,label:value||'Tümü'}))} />} />
    <Controller control={form.control} name="expertise" render={({field})=><Select label="Uzmanlık" value={field.value} onChange={field.onChange} options={['','Dersler','Kariyer','Erasmus','Hazırlık','Kampüs','Yurt','Sosyal Hayat'].map(value=>({value,label:value||'Tümü'}))} />} />
    <Controller control={form.control} name="verified" render={({field})=><View className="flex-row items-center gap-2"><Text className="min-w-0 flex-1">Eğitim kimliği doğrulanmış</Text><Switch accessibilityLabel="Eğitim kimliği doğrulanmış" value={field.value==='true'} onValueChange={value=>field.onChange(value?'true':'')} /></View>} />
    <Button label="Temizle" variant="secondary" onPress={()=>router.replace('/people')} /><Button label="Filtrele" onPress={form.handleSubmit(values => router.setParams(values))} /><Text variant="muted">{query.data?.pages[0]?.totalElements ?? 0} Tanıdık</Text></View>} />;
}
export function Person({ item }: { item: Schema['PublicTanidikProfileResponse'] }) {
  return <Card><View className="flex-row items-center gap-3"><Avatar name={item.name} educationStatus={item.educationStatus} tanidik size="account" /><View className="min-w-0 flex-1 gap-1"><Pressable accessibilityRole="link" onPress={()=>item.id && router.push({pathname:'/profiles/[id]',params:{id:item.id}})} className="min-h-touch-ios justify-center"><Text variant="heading">{item.name}</Text></Pressable><Text variant="muted">{item.educationStatus==='MEZUN'?'Mezun':'Üniversite öğrencisi'} · Tanıdık{item.educationVerified?' · Eğitim kimliği doğrulandı':''}</Text></View></View><Text>{[item.universityName,item.departmentName].filter(Boolean).join(' · ')}</Text><Text variant="muted">{item.classYear ? `${item.classYear}. sınıf` : item.graduationYear ? `${item.graduationYear} mezunu` : ''}</Text>{!!item.biography && <Text numberOfLines={2}>{item.biography}</Text>}<View className="flex-row gap-2"><Metric label="Tanıdık yorumu" value={item.tanidikAnswerCount ?? 0} /><Metric label="Topluluk yorumu" value={item.communityAnswerCount ?? 0} /><Metric label="Faydalı oy" value={item.helpfulVoteCount ?? 0} /></View></Card>;
}
