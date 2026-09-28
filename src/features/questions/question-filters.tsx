import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { FilterPanel, FilterSelect, FilterRow, FilterCell } from "@/components/ui/filter-panel";
import { universityFilterOptions, departmentFilterOptions, tagFilterOptions } from "@/features/catalog/filter-options";
import { FormField } from "@/components/ui/form-field";
import { ErrorState } from "@/components/ui/states";
import { questionParams } from "@/lib/navigation/params";
import { useState } from 'react';
export function QuestionFilters({filters,onApply}:{filters:ReturnType<typeof questionParams.parse>;onApply:(values:ReturnType<typeof questionParams.parse>)=>void}) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(questionParams),
    defaultValues: filters,
  });
  const selectedUniversity = useWatch({ control: form.control, name: 'universityId' });
  const universities = useQuery({ ...universityFilterOptions(), enabled: open });
  const departments = useQuery({ ...departmentFilterOptions(selectedUniversity ?? ''), enabled: open && !!selectedUniversity });
  const tags = useQuery({ ...tagFilterOptions(), enabled: open });
return <View className="gap-2">      {<View className="flex-row items-center gap-1.5"><View className="min-w-0 flex-1"><Controller
        control={form.control}
        name="q"
        render={({ field }) => (
          <FormField
            label="Soru ara" hideLabel placeholder="Soru ara" returnKeyType="search"
            value={field.value}
            onChangeText={field.onChange}
            onSubmitEditing={form.handleSubmit((values) =>
              onApply(values),
            )}
          />
        )}
      /></View>
      <View className="flex-row gap-1.5">
        <View><Button label="Filtrele" variant="secondary" onPress={() => setOpen(true)} /></View>
        <View><Button label="Ara" onPress={form.handleSubmit(values => onApply(values))} /></View>
      </View></View>}
      {<FilterPanel visible={open} title="Soruları filtrele" close={() => setOpen(false)}>
        <FilterRow>
          <FilterCell><Controller control={form.control} name="scope" render={({ field }) => <FilterSelect label="Soru kapsamı" value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tüm kapsamlar' }, { value: 'GENERAL', label: 'Genel' }, { value: 'UNIVERSITY', label: 'Üniversite' }, { value: 'UNIVERSITY_DEPARTMENT', label: 'Üniversite + Bölüm' }]} />} /></FilterCell>
          <FilterCell><Controller control={form.control} name="universityId" render={({ field }) => <FilterSelect label="Üniversite" value={field.value ?? ''} onChange={value => { field.onChange(value || undefined); form.setValue('departmentId', undefined); }} options={[{ value: '', label: universities.isPending ? 'Yükleniyor…' : 'Tüm üniversiteler' }, ...(universities.data ?? [])]} />} /></FilterCell>
        </FilterRow>
        <FilterRow>
          <FilterCell><Controller control={form.control} name="departmentId" render={({ field }) => <FilterSelect label="Bölüm" disabled={!selectedUniversity} value={field.value ?? ''} onChange={value => field.onChange(value || undefined)} options={[{ value: '', label: selectedUniversity && departments.isPending ? 'Yükleniyor…' : 'Tüm bölümler' }, ...(departments.data ?? [])]} />} /></FilterCell>
          <FilterCell><Controller control={form.control} name="tagId" render={({ field }) => <FilterSelect label="Etiket" value={field.value ?? ''} onChange={value => field.onChange(value || undefined)} options={[{ value: '', label: tags.isPending ? 'Yükleniyor…' : 'Tüm etiketler' }, ...(tags.data ?? [])]} />} /></FilterCell>
        </FilterRow>
        <FilterRow>
          <FilterCell><Controller control={form.control} name="city" render={({ field }) => <FormField compact label="Şehir" placeholder="Örn. İstanbul" value={field.value} onChangeText={field.onChange} />} /></FilterCell>
          <FilterCell><Controller control={form.control} name="answered" render={({ field }) => <FilterSelect label="Cevap durumu" value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tümü' }, { value: 'true', label: 'Cevaplanmış' }, { value: 'false', label: 'Cevap bekliyor' }]} />} /></FilterCell>
        </FilterRow>
        <FilterRow>
          <FilterCell><Controller control={form.control} name="verifiedAnswer" render={({ field }) => <FilterSelect label="Doğrulanmış kişi cevabı" value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tümü' }, { value: 'true', label: 'Var' }, { value: 'false', label: 'Yok' }]} />} /></FilterCell>
          <FilterCell><Controller control={form.control} name="sort" render={({ field }) => <FilterSelect label="Sıralama" value={field.value} onChange={field.onChange} options={[{ value: 'NEWEST', label: 'En yeni' }, { value: 'MOST_COMMENTED', label: 'En çok cevaplanan' }, { value: 'MOST_LIKED', label: 'En faydalı' }, { value: 'MOST_VIEWED', label: 'En çok görüntülenen' }, { value: 'OLDEST', label: 'En eski' }]} />} /></FilterCell>
        </FilterRow>
        {[universities, tags, ...(selectedUniversity ? [departments] : [])].filter(result => result.isError).map((result, index) => <ErrorState key={index} error={result.error} retry={() => { void result.refetch(); }} />)}
        <View className="flex-row justify-between gap-2">
          <Button label="Tümünü temizle" variant="secondary" onPress={() => { form.reset(questionParams.parse({})); onApply(questionParams.parse({})); setOpen(false); }} />
          <Button label="Ara" onPress={form.handleSubmit(values => { onApply(values); setOpen(false); })} />
        </View>
      </FilterPanel>}
</View>;
}
