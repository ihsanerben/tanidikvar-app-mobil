import { Switch } from "@/components/ui/switch";
import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, Pressable, } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { PageHeader } from '@/components/ui/page';
import { PagedList } from '@/components/ui/paged-list';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { FilterPanel, FilterSelect, FilterRow, FilterCell } from '@/components/ui/filter-panel';
import { universityFilterOptions, departmentFilterOptions } from './filter-options';
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
  const [open, setOpen] = useState(false);
  const universityId=useWatch({control:form.control,name:"universityId"});
  const universities = useQuery({ ...universityFilterOptions(), enabled: open });
  const departments = useQuery({ ...departmentFilterOptions(universityId ?? ''), enabled: open && !!universityId });
  return <PagedList query={query} renderItem={Person} header={<View className="gap-4 pb-5"><PageHeader title="Tanıdıklar" back={false} help="Üniversite, bölüm, sınıf, eğitim doğrulaması ve uzmanlık alanına göre deneyim sahibi Tanıdıklara ulaşabilirsin." /><View className="flex-row items-center gap-1.5"><View className="min-w-0 flex-1"><Controller control={form.control} name="q" render={({ field }) => <FormField hideLabel placeholder="İsim veya uzmanlık" label="İsim veya uzmanlık" value={field.value} onChangeText={field.onChange} onSubmitEditing={form.handleSubmit(values => router.setParams(values))} />} /></View><View className="flex-row gap-1.5"><View><Button label="Filtrele" variant="secondary" onPress={() => setOpen(true)} /></View><View><Button label="Ara" onPress={form.handleSubmit(values => router.setParams(values))} /></View></View></View>
    <FilterPanel visible={open} title="Tanıdıkları filtrele" close={() => setOpen(false)}>
      <Controller control={form.control} name="q" render={({ field }) => <FormField compact label="İsim veya uzmanlık" value={field.value} onChangeText={field.onChange} />} />
      <FilterRow>
        <FilterCell><Controller control={form.control} name="universityId" render={({ field }) => <FilterSelect label="Üniversite" value={field.value ?? ''} onChange={value => { field.onChange(value || undefined); form.setValue('departmentId', undefined); }} options={[{ value: '', label: 'Tümü' }, ...(universities.data ?? [])]} />} /></FilterCell>
        <FilterCell><Controller control={form.control} name="departmentId" render={({ field }) => <FilterSelect label="Bölüm" disabled={!universityId} value={field.value ?? ''} onChange={value => field.onChange(value || undefined)} options={[{ value: '', label: 'Tümü' }, ...(departments.data ?? [])]} />} /></FilterCell>
      </FilterRow>
      <FilterRow>
        <FilterCell><Controller control={form.control} name="educationStatus" render={({field})=><FilterSelect label="Durum" value={field.value} onChange={field.onChange} options={[{value:'',label:'Tümü'},{value:'UNIVERSITE_OGRENCISI',label:'Öğrenci'},{value:'MEZUN',label:'Mezun'}]} />} /></FilterCell>
        <FilterCell><Controller control={form.control} name="classYear" render={({field})=><FilterSelect label="Sınıf" value={field.value} onChange={field.onChange} options={(['','1','2','3','4','5','6'] as const).map(value=>({value,label:value||'Tümü'}))} />} /></FilterCell>
      </FilterRow>
      <Controller control={form.control} name="expertise" render={({field})=><FilterSelect label="Uzmanlık" value={field.value} onChange={field.onChange} options={['','Dersler','Kariyer','Erasmus','Hazırlık','Kampüs','Yurt','Sosyal Hayat'].map(value=>({value,label:value||'Tümü'}))} />} />
      <Controller control={form.control} name="verified" render={({field})=><View className="flex-row items-center gap-2"><Text variant="unstyled" className="min-w-0 flex-1 text-caption text-text">Eğitim kimliği doğrulanmış</Text><Switch accessibilityLabel="Eğitim kimliği doğrulanmış" value={field.value==='true'} onValueChange={value=>field.onChange(value?'true':'')} /></View>} />
      {[universities, ...(universityId ? [departments] : [])].filter(result => result.isError).map((result, index) => <ErrorState key={index} error={result.error} retry={() => { void result.refetch(); }} />)}
      <View className="flex-row justify-end gap-2"><Button label="Filtrele" onPress={form.handleSubmit(values => { router.setParams(values); setOpen(false); })} /><Button label="Temizle" variant="secondary" onPress={() => { router.replace('/people'); setOpen(false); }} /></View>
    </FilterPanel><Text variant="muted">{query.data?.pages[0]?.totalElements ?? 0} Tanıdık</Text></View>} />;
}
export function Person({ item }: { item: Schema['PublicTanidikProfileResponse'] }) {
  return <Card><View className="flex-row items-center gap-3"><Avatar name={item.name} educationStatus={item.educationStatus} tanidik size="medium" /><View className="min-w-0 flex-1 gap-1"><Pressable accessibilityRole="link" onPress={()=>item.id && router.push({pathname:'/profiles/[id]',params:{id:item.id}})} className="min-h-touch-ios android:min-h-touch-android min-w-touch-ios android:min-w-touch-android justify-center"><Text variant="heading">{item.name}</Text></Pressable><Text variant="muted">{item.educationStatus==='MEZUN'?'Mezun':'Üniversite öğrencisi'} · Tanıdık{item.educationVerified?' · Eğitim kimliği doğrulandı':''}</Text></View></View><Text>{[item.universityName,item.departmentName].filter(Boolean).join(' · ')}</Text><Text variant="muted">{item.classYear ? `${item.classYear}. sınıf` : item.graduationYear ? `${item.graduationYear} mezunu` : ''}</Text>{!!item.biography && <Text numberOfLines={2}>{item.biography}</Text>}<View className="flex-row gap-2"><Metric label="Tanıdık yorumu" value={item.tanidikAnswerCount ?? 0} /><Metric label="Topluluk yorumu" value={item.communityAnswerCount ?? 0} /><Metric label="Faydalı oy" value={item.helpfulVoteCount ?? 0} /></View></Card>;
}
