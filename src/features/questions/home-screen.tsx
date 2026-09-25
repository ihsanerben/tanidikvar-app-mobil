import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/ui/choice";
import { FormField } from "@/components/ui/form-field";
import { PagedList } from "@/components/ui/paged-list";
import { ErrorState } from "@/components/ui/states";
import { questionParams } from "@/lib/navigation/params";
import { questionList } from "./api";
import { QuestionCard } from "./question-card";
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
  const form = useForm({
    resolver: zodResolver(questionParams),
    defaultValues: filters,
  });
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title="Bir tanıdığına sor" back={false} />
      <Text variant="muted">Üniversite hayatını yaşayanlardan öğren.</Text>
      <Button
        label="Soru sor"
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
      />
      <Controller
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
      />
      <Button
        label="Ara"
        variant="secondary"
        onPress={form.handleSubmit((values) => router.setParams(values))}
      />
      <Choice
        label="Sıralama"
        value={filters.sort}
        onChange={(sort) => router.setParams({ ...filters, sort })}
        options={[
          { value: "NEWEST", label: "En yeni" },
          { value: "MOST_LIKED", label: "En beğenilen" },
        ]}
      />
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
