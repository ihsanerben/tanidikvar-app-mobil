import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { FilterPanel, FilterSelect, FilterRow, FilterCell } from "@/components/ui/filter-panel";
import { universityFilterOptions, departmentFilterOptions, tagFilterOptions } from "@/features/catalog/filter-options";
import { catalogCities } from "@/features/catalog/api";
import { FormField } from "@/components/ui/form-field";
import { ErrorState } from "@/components/ui/states";
import { questionParams } from "@/lib/navigation/params";
import { useState, type ReactNode } from 'react';
type Filters=ReturnType<typeof questionParams.parse>;
export function QuestionFilters({filters,onApply,lockedContext,leadingAction}:{filters:Filters;onApply:(values:Filters)=>void;lockedContext?:{universityId:string;departmentId?:string};leadingAction?:ReactNode}) {
  const [open, setOpen] = useState(false);
  const fixed=lockedContext?{universityId:lockedContext.universityId,departmentId:lockedContext.departmentId,scope:lockedContext.departmentId?'UNIVERSITY_DEPARTMENT' as const:'' as const}:{};
  const form = useForm({
    resolver: zodResolver(questionParams),
    values: {...filters,...fixed},
  });
  const selectedUniversity = useWatch({ control: form.control, name: 'universityId' });
  const universities = useQuery({ ...universityFilterOptions(), enabled: open && !lockedContext });
  const departments = useQuery({ ...departmentFilterOptions(selectedUniversity ?? ''), enabled: open && !lockedContext && !!selectedUniversity });
  const tags = useQuery({ ...tagFilterOptions(), enabled: open });
  const cities = useQuery({ ...catalogCities(), enabled: open && !lockedContext });
  const cityOptions = (cities.data ?? []).map(item => ({ value: item.label ?? '', label: item.label ?? '' })).filter(item => item.value).sort((a,b) => a.label.localeCompare(b.label, 'tr'));
return <View className="gap-2">      {<View className="flex-row flex-wrap items-center gap-1.5">{leadingAction}<View className="min-w-[120px] flex-1"><Controller
        control={form.control}
        name="q"
        render={({ field }) => (
          <FormField
            compact label="Soru ara" hideLabel placeholder="Soru ara" returnKeyType="search"
            value={field.value}
            onChangeText={field.onChange}
            onSubmitEditing={form.handleSubmit((values) =>
              onApply({...values,...fixed}),
            )}
          />
        )}
      /></View>
      <View className="ml-auto flex-row gap-1.5">
        <View><Button label="Filtrele" size="standard" variant="secondary" onPress={() => setOpen(true)} /></View>
        <View><Button label="Ara" size="standard" onPress={form.handleSubmit(values => onApply({...values,...fixed}))} /></View>
      </View></View>}
      {<FilterPanel visible={open} title="Soruları filtrele" close={() => setOpen(false)}>
        {!lockedContext&&<FilterRow>
          <FilterCell><Controller control={form.control} name="scope" render={({ field }) => <FilterSelect label="Soru kapsamı" value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tüm kapsamlar' }, { value: 'GENERAL', label: 'Genel' }, { value: 'UNIVERSITY', label: 'Üniversite' }, { value: 'UNIVERSITY_DEPARTMENT', label: 'Üniversite + Bölüm' }]} />} /></FilterCell>
          <FilterCell><Controller control={form.control} name="universityId" render={({ field }) => <FilterSelect label="Üniversite" value={field.value ?? ''} onChange={value => { field.onChange(value || undefined); form.setValue('departmentId', undefined); }} options={[{ value: '', label: universities.isPending ? 'Yükleniyor…' : 'Tüm üniversiteler' }, ...(universities.data ?? [])]} />} /></FilterCell>
        </FilterRow>}
        {!lockedContext&&<FilterRow>
          <FilterCell><Controller control={form.control} name="departmentId" render={({ field }) => <FilterSelect label="Bölüm" disabled={!selectedUniversity} value={field.value ?? ''} onChange={value => field.onChange(value || undefined)} options={[{ value: '', label: selectedUniversity && departments.isPending ? 'Yükleniyor…' : 'Tüm bölümler' }, ...(departments.data ?? [])]} />} /></FilterCell>
          <FilterCell><Controller control={form.control} name="tagId" render={({ field }) => <FilterSelect label="Etiket" value={field.value ?? ''} onChange={value => field.onChange(value || undefined)} options={[{ value: '', label: tags.isPending ? 'Yükleniyor…' : 'Tüm etiketler' }, ...(tags.data ?? [])]} />} /></FilterCell>
        </FilterRow>}
        {lockedContext&&<Controller control={form.control} name="tagId" render={({ field }) => <FilterSelect label="Etiket" value={field.value ?? ''} onChange={value => field.onChange(value || undefined)} options={[{ value: '', label: tags.isPending ? 'Yükleniyor…' : 'Tüm etiketler' }, ...(tags.data ?? [])]} />} />}
        {!lockedContext&&<FilterRow>
          <FilterCell><Controller control={form.control} name="city" render={({ field }) => <FilterSelect label="Şehir" value={field.value} onChange={field.onChange} options={[{ value: '', label: cities.isPending ? 'Yükleniyor…' : 'Tüm şehirler' }, ...cityOptions]} />} /></FilterCell>
          <FilterCell><Controller control={form.control} name="sort" render={({ field }) => <FilterSelect label="Sıralama" value={field.value} onChange={field.onChange} options={[{ value: 'NEWEST', label: 'En yeni' }, { value: 'MOST_COMMENTED', label: 'En çok cevaplanan' }, { value: 'MOST_LIKED', label: 'En faydalı' }, { value: 'MOST_VIEWED', label: 'En çok görüntülenen' }, { value: 'OLDEST', label: 'En eski' }]} />} /></FilterCell>
        </FilterRow>}
        {lockedContext&&<FilterRow><FilterCell><Controller control={form.control} name="sort" render={({ field }) => <FilterSelect label="Sıralama" value={field.value} onChange={field.onChange} options={[{ value: 'NEWEST', label: 'En yeni' }, { value: 'MOST_COMMENTED', label: 'En çok cevaplanan' }, { value: 'MOST_LIKED', label: 'En faydalı' }, { value: 'MOST_VIEWED', label: 'En çok görüntülenen' }, { value: 'OLDEST', label: 'En eski' }]} />} /></FilterCell></FilterRow>}
        {[universities, tags, cities, ...(selectedUniversity ? [departments] : [])].filter(result => result.isError).map((result, index) => <ErrorState key={index} error={result.error} retry={() => { void result.refetch(); }} />)}
        <View className="flex-row justify-between gap-2">
          <Button label="Tümünü temizle" variant="secondary" onPress={() => { const cleared=questionParams.parse(fixed); form.reset(cleared); onApply(cleared); setOpen(false); }} />
          <Button label="Ara" size="standard" onPress={form.handleSubmit(values => { onApply({...values,...fixed}); setOpen(false); })} />
        </View>
      </FilterPanel>}
</View>;
}
