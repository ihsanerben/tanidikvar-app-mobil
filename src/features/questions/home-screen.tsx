import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { PagedList } from "@/components/ui/paged-list";
import { ErrorState } from "@/components/ui/states";
import { questionParams } from "@/lib/navigation/params";
import { questionList } from "./api";
import { QuestionCard } from "./question-card";
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { CatalogPicker } from '@/features/catalog/catalog-picker';
import { TagPicker } from './tag-picker';
import { useState } from 'react';
export function HomeScreen() {
  const parsed = questionParams.safeParse(useLocalSearchParams());
  return parsed.success ? (
    <Feed key={JSON.stringify(parsed.data)} filters={parsed.data} />
  ) : (
    <Screen>
      <PageHeader title="Sorular" />
      <ErrorState error={null} retry={() => router.replace("/")} />
    </Screen>
  );
}
function Feed({
  filters,
}: {
  filters: ReturnType<typeof questionParams.parse>;
}) {
  const query = useInfiniteQuery(questionList(filters));
  const [open, setOpen] = useState(false);
  const [universityName, setUniversityName] = useState<string>();
  const [programName, setProgramName] = useState<string>();
  const form = useForm({
    resolver: zodResolver(questionParams),
    defaultValues: filters,
  });
  const selectedUniversity = useWatch({ control: form.control, name: 'universityId' });
  const selectedTag = useWatch({ control: form.control, name: 'tagId' });
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title={filters.period ? 'Popülerler' : 'Sorular'} back={false}
        help={filters.period ? 'Dönemler İstanbul saatine göre takvim bazlıdır: bugün 00.00, bu hafta Pazartesi 00.00, bu ay ayın ilk günü ve bu yıl 1 Ocak başlangıç alınır.' : 'Soruları üniversite, bölüm, etiket ve cevap durumuna göre filtreleyebilir veya kendi sorunu yayınlayabilirsin.'}
        action={!filters.period && <Button
        label="Soru sor"
        size="standard"
        testID="ask-question"
        onPress={() =>
          router.push({
            pathname: "/questions/new",
            params: {
              universityId: filters.universityId,
              departmentId: filters.departmentId,
            },
          })
        }
      />} />
      {!filters.period && <Controller
        control={form.control}
        name="q"
        render={({ field }) => (
          <FormField
            label="Sorularda ara"
            value={field.value}
            onChangeText={field.onChange}
            onSubmitEditing={form.handleSubmit((values) =>
              router.setParams(values),
            )}
          />
        )}
      />}
      {!filters.period && <View className="flex-row gap-2">
        <View className="min-w-0 flex-1"><Button fullWidth label="Filtrele" variant="secondary" onPress={() => setOpen(true)} /></View>
        <View className="min-w-0 flex-1"><Button fullWidth label="Ara" onPress={form.handleSubmit(values => router.setParams(values))} /></View>
      </View>}
      {!!filters.period && <Tabs label="Dönem" value={filters.period} options={[{ value: 'DAILY', label: 'Bugün' }, { value: 'WEEKLY', label: 'Bu hafta' }, { value: 'MONTHLY', label: 'Bu ay' }, { value: 'YEARLY', label: 'Bu yıl' }, { value: 'ALL_TIME', label: 'Tüm zamanlar' }]} onChange={period => router.setParams({ period })} />}
      <Text variant="muted">{query.data?.pages[0]?.totalElements ?? 0} sonuç</Text>
      {!filters.period && <BottomSheet visible={open} title="Soruları filtrele" close={() => setOpen(false)}>
        <Controller control={form.control} name="sort" render={({ field }) => <Select label="Sıralama" value={field.value} onChange={field.onChange} options={[{ value: 'NEWEST', label: 'En yeni' }, { value: 'MOST_COMMENTED', label: 'En çok cevaplanan' }, { value: 'MOST_LIKED', label: 'En faydalı' }, { value: 'MOST_VIEWED', label: 'En çok görüntülenen' }, { value: 'OLDEST', label: 'En eski' }]} />} />
        <Controller control={form.control} name="scope" render={({ field }) => <Select label="Kapsam" value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tümü' }, { value: 'GENERAL', label: 'Genel' }, { value: 'UNIVERSITY', label: 'Üniversite' }, { value: 'UNIVERSITY_DEPARTMENT', label: 'Program' }]} />} />
        <CatalogPicker universityId={selectedUniversity} universityName={universityName} programName={programName} onUniversity={item => { form.setValue('universityId', item.id); form.setValue('departmentId', undefined); setUniversityName(item.name); setProgramName(undefined); }} onProgram={item => { form.setValue('departmentId', item.departmentId); setProgramName(item.name); }} />
        <TagPicker selected={selectedTag ? [selectedTag] : []} onChange={ids => form.setValue('tagId', ids.at(-1))} />
        <Controller control={form.control} name="city" render={({ field }) => <FormField label="Şehir" value={field.value} onChangeText={field.onChange} />} />
        <Controller control={form.control} name="answered" render={({ field }) => <Select label="Cevap durumu" value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tümü' }, { value: 'true', label: 'Cevaplanmış' }, { value: 'false', label: 'Cevapsız' }]} />} />
        <Controller control={form.control} name="verifiedAnswer" render={({ field }) => <Select label="Doğrulanmış kişi cevabı" value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tümü' }, { value: 'true', label: 'Var' }, { value: 'false', label: 'Yok' }]} />} />
        <Button label="Filtreleri uygula" onPress={form.handleSubmit(values => { router.setParams(values); setOpen(false); })} />
        <Button label="Tümünü temizle" variant="secondary" onPress={() => { router.replace('/'); setOpen(false); }} />
      </BottomSheet>}
      {filters.universityId && (
        <Button
          label="Tüm sorular"
          onPress={() => router.replace("/")}
          variant="secondary"
        />
      )}
    </View>
  );
  return (
    <Screen>
      <PagedList query={query} renderItem={QuestionCard} header={header} />
    </Screen>
  );
}
