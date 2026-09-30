import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "@/components/ui/text";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { FilterPanel, FilterSelect, FilterRow, FilterCell } from "@/components/ui/filter-panel";
import { ErrorState } from "@/components/ui/states";
import { catalogParams } from "@/lib/navigation/params";
import { catalogCities, universityList, programList } from "./api";
import { UniversityCard, ProgramCard } from "./cards";
export function ExploreScreen() {
  const result = catalogParams.safeParse(useLocalSearchParams());
  return result.success ? (
    <Explorer key={JSON.stringify(result.data)} filters={result.data} />
  ) : (
    <Screen>
      <PageHeader title="Keşfet" />
      <ErrorState error={new Error()} retry={() => router.replace("/kesfet")} />
    </Screen>
  );
}
function Explorer({ filters }: { filters: z.infer<typeof catalogParams> }) {
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const form = useForm({
    resolver: zodResolver(catalogParams),
    defaultValues: {...filters,year:filters.year || String(new Date().getFullYear())},
  });
  const universityId = useWatch({ control: form.control, name: 'universityId' });
  const cities = useQuery({ ...catalogCities(), enabled: open });
  const cityNames = Array.from(new Set([filters.city, ...(cities.data ?? []).map(item => item.label)].filter((value): value is string => !!value && value !== "Belirtilmemiş"))).sort((a, b) => a.localeCompare(b, 'tr'));
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title={filters.kind === "programs" ? "Programlar" : "Üniversiteler"} back={false} help={filters.kind === 'programs' ? 'Programları ad, üniversite, şehir ve puan türüne göre arayabilirsin.' : 'Üniversiteleri ad, şehir ve kurum türüne göre arayabilirsin.'} />
      <View className="flex-row items-center gap-1.5"><View className="min-w-0 flex-1"><Controller
        control={form.control}
        name="q"
        render={({ field, fieldState }) => (
          <FormField
            compact hideLabel
            placeholder={filters.kind === "programs" ? "Program ara" : "Üniversite ara"}
            label={filters.kind === "programs" ? "Program ara" : "Üniversite ara"}
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            returnKeyType="search"
            onSubmitEditing={form.handleSubmit((values) =>
              router.setParams(values),
            )}
            testID="catalog-search"
          />
        )}
      /></View>
      <View className="flex-row gap-1.5">
        <View><Button label="Filtrele" variant="secondary" onPress={()=>setOpen(true)} /></View>
        <View><Button label="Ara" testID="catalog-search-submit" onPress={form.handleSubmit(values=>router.setParams(values))} /></View>
      </View></View>
      <FilterPanel visible={open} title={filters.kind === 'programs' ? 'Programları filtrele' : 'Üniversiteleri filtrele'} close={() => setOpen(false)}>
        {filters.kind === 'universities' ? <Controller control={form.control} name="q" render={({ field }) => <FormField compact label="Üniversite" placeholder="Üniversite ara" value={field.value} onChangeText={field.onChange} />} /> : <FilterRow>
          <FilterCell><Controller control={form.control} name="programName" render={({ field }) => <FormField compact label="Program adı" placeholder="Örn. Bilgisayar Mühendisliği" value={field.value} onChangeText={field.onChange} />} /></FilterCell>
          <FilterCell><Controller control={form.control} name="universityName" render={({ field }) => <FormField compact label="Üniversite adı" placeholder="Üniversite ara" value={field.value} onChangeText={field.onChange} />} /></FilterCell>
        </FilterRow>}
        <FilterRow>
          <FilterCell><Controller control={form.control} name="city" render={({ field }) => <FilterSelect label="Şehir" value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tüm şehirler' }, ...cityNames.map(value => ({ value, label: value }))]} />} /></FilterCell>
          {filters.kind === 'universities' && <><FilterCell><Controller control={form.control} name="institutionType" render={({ field }) => <FilterSelect label={filters.kind === 'programs' ? 'Kurum' : 'Kurum türü'} value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tümü' }, { value: 'DEVLET', label: 'Devlet' }, { value: 'VAKIF', label: 'Vakıf' }, { value: 'KKTC', label: 'KKTC' }, { value: 'YURT_DISI', label: 'Yurt dışı' }]} />} /></FilterCell></>}
        </FilterRow>
        {cities.isError && <ErrorState error={cities.error} retry={() => { void cities.refetch(); }} />}
        {filters.kind === 'programs' && <>
          <ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false}><View className="flex-row items-end gap-2 pb-1">
          <View className="w-20"><Controller control={form.control} name="institutionType" render={({ field }) => <FilterSelect label={filters.kind === 'programs' ? 'Kurum' : 'Kurum türü'} value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tümü' }, { value: 'DEVLET', label: 'Devlet' }, { value: 'VAKIF', label: 'Vakıf' }, { value: 'KKTC', label: 'KKTC' }, { value: 'YURT_DISI', label: 'Yurt dışı' }]} />} /></View>

            <View className="w-20"><Controller control={form.control} name="degreeLevel" render={({ field }) => <FilterSelect label="Düzey" value={field.value} onChange={field.onChange} options={[{ value: '', label: 'Tümü' }, { value: 'LISANS', label: 'Lisans' }, { value: 'ONLISANS', label: 'Ön lisans' }]} />} /></View>
            <View className="w-20"><Controller control={form.control} name="scoreType" render={({ field }) => <FilterSelect label="Puan türü" value={field.value} onChange={field.onChange} options={['', 'TYT', 'SAY', 'EA', 'SÖZ', 'DİL'].map(value => ({ value, label: value || 'Tümü' }))} />} /></View>


            <View className="w-20"><Controller control={form.control} name="year" render={({ field }) => <FilterSelect label="Yıl" value={field.value} onChange={field.onChange} options={[...Array.from({ length: 12 }, (_, index) => { const value = String(new Date().getFullYear() - index); return { value, label: value }; })]} />} /></View>
            <View className="w-36"><Controller control={form.control} name="sort" render={({ field }) => <FilterSelect label="Sırala" value={field.value} onChange={field.onChange} options={[{ value: 'RANK', label: 'Başarı sırasına göre' }, { value: 'NAME', label: 'Ada göre' }, { value: 'SCORE', label: 'Taban puana göre' }, { value: 'QUOTA', label: 'Kontenjana göre' }]} />} /></View>

          </View></ScrollView>
          {universityId && <Button label="Üniversite seçimini kaldır" variant="secondary" onPress={() => form.setValue('universityId', undefined)} />}
          {advanced && <View className="gap-2 rounded-control border border-border bg-account-summary p-2">
            {([['rankFrom', 'rankTo'], ['scoreFrom', 'scoreTo']] as const).map(([from, to]) => <FilterRow key={from}>
              {[from, to].map(name => <FilterCell key={name}><Controller control={form.control} name={name} render={({ field, fieldState }) => <FormField compact ref={field.ref} label={`${name.startsWith('rank') ? 'Başarı sırası' : 'Taban puan'} (${name.endsWith('From') ? 'en az' : 'en çok'})`} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} keyboardType={name.startsWith('rank') ? 'number-pad' : 'decimal-pad'} />} /></FilterCell>)}
            </FilterRow>)}
          </View>}
        </>}
        <View className="flex-row items-center justify-end gap-2">
          {filters.kind === 'programs' && <Button label={advanced ? '… Kapat' : '…'} variant="secondary" onPress={() => setAdvanced(value => !value)} />}
          <Button label="Filtrele" onPress={form.handleSubmit(values => { router.setParams(values); setOpen(false); }, () => setAdvanced(true))} />
          <Button label="Temizle" variant="secondary" onPress={() => { form.reset({ ...catalogParams.parse({ kind: filters.kind }), year: String(new Date().getFullYear()), universityId: undefined }); setAdvanced(false); router.replace({ pathname: '/kesfet', params: { kind: filters.kind } }); setOpen(false); }} />
        </View>
      </FilterPanel>
    </View>
  );
  return (
    <Screen>
      {filters.kind === "universities" ? (
        <Universities filters={filters} header={header} />
      ) : (
        <Programs filters={filters} header={header} />
      )}
    </Screen>
  );
}
function Universities({
  filters,
  header,
}: {
  filters: z.infer<typeof catalogParams>;
  header: React.ReactElement;
}) {
  const query = useInfiniteQuery(universityList(filters));
  return (
    <PagedList query={query} numColumns={2} renderItem={({item}) => <View className="min-w-0 flex-1 px-1 pb-2"><UniversityCard item={item}/></View>} header={<View>{header}{query.data && <Text variant="muted" className="pb-3">{query.data.pages[0]?.totalElements?.toLocaleString("tr-TR") ?? "—"} sonuç</Text>}</View>} />
  );
}
function Programs({
  filters,
  header,
}: {
  filters: z.infer<typeof catalogParams>;
  header: React.ReactElement;
}) {
  const query = useInfiniteQuery(programList(filters));
  return <PagedList query={query} numColumns={3} renderItem={({ item }) => <View className="flex-1 px-0.5 pb-1"><ProgramCard item={item} year={filters.year || undefined} tile /></View>} header={<View>{header}{query.data && <Text variant="muted" className="pb-3">{query.data.pages[0]?.totalElements?.toLocaleString("tr-TR") ?? "—"} sonuç</Text>}</View>} />;
}
