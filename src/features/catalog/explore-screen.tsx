import { useState } from "react";
import { View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/ui/choice";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ErrorState } from "@/components/ui/states";
import { catalogParams } from "@/lib/navigation/params";
import { universityList, programList } from "./api";
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
  const form = useForm({
    resolver: zodResolver(catalogParams),
    defaultValues: filters,
  });
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title="Üniversiteni keşfet" back={false} />
      <Controller
        control={form.control}
        name="q"
        render={({ field, fieldState }) => (
          <FormField
            label="Üniversite veya program ara"
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
      />
      <Button
        label="Ara"
          testID="catalog-search-submit"
        onPress={form.handleSubmit((values) => router.setParams(values))}
      />
      <Choice
        label="Ne arıyorsun?"
        value={filters.kind}
        options={[
          { value: "universities", label: "Üniversiteler" },
          { value: "programs", label: "Programlar" },
        ]}
        onChange={(kind) => router.setParams({ ...filters, kind })}
      />
      <Button
        label="Filtreler"
        variant="secondary"
        onPress={() => setOpen(true)}
      />
      <BottomSheet
        visible={open}
        title="Aramayı daralt"
        close={() => setOpen(false)}
      >
        <Controller
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormField
              label="Şehir"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="institutionType"
          render={({ field }) => (
            <Choice
              label="Üniversite türü"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "", label: "Tümü" },
                { value: "DEVLET", label: "Devlet" },
                { value: "VAKIF", label: "Vakıf" },
              ]}
            />
          )}
        />
        {filters.kind === "programs" && (
          <Controller
            control={form.control}
            name="scoreType"
            render={({ field }) => (
              <Choice
                label="Puan türü"
                value={field.value}
                onChange={field.onChange}
                options={["", "SAY", "EA", "SÖZ", "DİL", "TYT"].map(
                  (value) => ({ value, label: value || "Tümü" }),
                )}
              />
            )}
          />
        )}
        <Button
          label="Filtreleri uygula"
          onPress={form.handleSubmit((values) => {
            router.setParams(values);
            setOpen(false);
          })}
        />
        <Button
          label="Filtreleri temizle"
          variant="secondary"
          onPress={() => {
            router.replace("/kesfet");
            setOpen(false);
          }}
        />
      </BottomSheet>
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
    <PagedList query={query} renderItem={UniversityCard} header={header} />
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
  return <PagedList query={query} renderItem={ProgramCard} header={header} />;
}
