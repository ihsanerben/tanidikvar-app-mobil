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
import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { FilterPanel, FilterSelect, FilterRow, FilterCell } from '@/components/ui/filter-panel';
import { universityFilterOptions, departmentFilterOptions } from './filter-options';
import { ErrorState } from '@/components/ui/states';
import type { Schema } from '@/lib/api/types';
import { peopleList } from './api';
import { peopleParams } from '@/lib/navigation/params';
export function PeopleScreen() {
  const p = peopleParams.safeParse(useLocalSearchParams());
  return <Screen>{p.success ? <People key={JSON.stringify(p.data)} filters={p.data} /> : <ErrorState error={null} retry={() => router.replace('/people')} />}</Screen>;
}
function People({ filters }: { filters: z.infer<typeof peopleParams> }) {
  const query = useInfiniteQuery(peopleList(filters.universityId, filters.departmentId, filters.q,{educationStatus:filters.educationStatus || undefined,classYear:filters.classYear ? Number(filters.classYear):undefined,expertise:filters.expertise || undefined}));
  const form = useForm({ resolver: zodResolver(peopleParams), defaultValues: filters });
  const [open, setOpen] = useState(false);
  const universityId=useWatch({control:form.control,name:"universityId"});
  const universities = useQuery({ ...universityFilterOptions(), enabled: open });
  const departments = useQuery({ ...departmentFilterOptions(universityId ?? ''), enabled: open && !!universityId });
  return <PagedList query={query} numColumns={2} renderItem={({item})=><View className="min-w-0 flex-1 px-1 pb-2"><Person item={item} /></View>} header={<View className="gap-4 pb-5"><PageHeader title="Tanıdıklar" back={false} help="Üniversite, bölüm, sınıf ve uzmanlık alanına göre deneyim sahibi Tanıdıklara ulaşabilirsin." /><View className="flex-row items-center gap-1.5"><View className="min-w-0 flex-1"><Controller control={form.control} name="q" render={({ field }) => <FormField compact hideLabel placeholder="İsim veya uzmanlık" label="İsim veya uzmanlık" value={field.value} onChangeText={field.onChange} onSubmitEditing={form.handleSubmit(values => router.setParams(values))} />} /></View><View className="flex-row gap-1.5"><View><Button label="Filtrele" variant="secondary" onPress={() => setOpen(true)} /></View><View><Button label="Ara" onPress={form.handleSubmit(values => router.setParams(values))} /></View></View></View>
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
      {[universities, ...(universityId ? [departments] : [])].filter(result => result.isError).map((result, index) => <ErrorState key={index} error={result.error} retry={() => { void result.refetch(); }} />)}
      <View className="flex-row justify-end gap-2"><Button label="Filtrele" onPress={form.handleSubmit(values => { router.setParams(values); setOpen(false); })} /><Button label="Temizle" variant="secondary" onPress={() => { router.replace('/people'); setOpen(false); }} /></View>
    </FilterPanel><Text variant="muted">{query.data?.pages[0]?.totalElements ?? 0} Tanıdık</Text></View>} />;
}
export function Person({ item }: { item: Schema['PublicTanidikProfileResponse'] }) {
  const stage=item.classYear?`${item.classYear}. sınıf`:item.graduationYear?`${item.graduationYear} mezunu`:null;
  return <Pressable accessibilityRole="link" accessibilityLabel={`${item.name} profilini aç`} onPress={()=>item.id && router.push({pathname:'/profiles/[id]',params:{id:item.id}})} className="min-h-[196px] gap-2 rounded-card border border-border bg-surface p-3 active:border-gold">
    <View className="min-h-[44px] flex-row items-center gap-2"><Avatar name={item.name} educationStatus={item.educationStatus} tanidik size="ranking" /><Text variant="unstyled" className="min-w-0 flex-1 text-[14px] font-bold leading-[18px] text-primary">{item.name}</Text></View>
    <View className="min-h-[54px] gap-0.5">{item.universityName&&<Text variant="muted" numberOfLines={2} className="text-[11px] leading-[15px]">{item.universityName}</Text>}{item.departmentName&&<Text variant="muted" numberOfLines={2} className="text-[11px] leading-[15px]">{item.departmentName}</Text>}{stage&&<Text variant="muted" className="text-[11px] leading-[15px]">{stage}</Text>}</View>
    <View className="self-start rounded-full border border-gold bg-gold-soft px-2 py-0.5"><Text variant="unstyled" className="text-[10px] font-bold text-primary">Tanıdık</Text></View>
    <View className="mt-auto gap-0.5 border-t border-border pt-2"><Text variant="unstyled" className="text-[10px] leading-[14px] text-muted"><Text className="font-bold text-primary">{item.tanidikAnswerCount ?? 0}</Text> Tanıdık yorumu</Text><Text variant="unstyled" className="text-[10px] leading-[14px] text-muted"><Text className="font-bold text-primary">{item.communityAnswerCount ?? 0}</Text> topluluk yorumu</Text></View>
  </Pressable>;
}
