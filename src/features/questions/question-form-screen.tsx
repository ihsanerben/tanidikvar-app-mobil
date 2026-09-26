import { TagPicker } from "./tag-picker";
import { TemplatePicker } from './template-picker';
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Page } from "@/components/ui/page";
import { Text } from "@/components/ui/text";
import { Select } from "@/components/ui/select";
import { FeatureForm } from "@/components/ui/feature-form";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { CatalogPicker } from "@/features/catalog/catalog-picker";
import { creationParams, idParams } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import { questionSchema } from "./schemas";
import {
  questionDetail,
  questionsApi,
  newRequestId,
  refreshQuestions,
} from "./api";
export function QuestionCreateScreen() {
  const p = creationParams.safeParse(useLocalSearchParams());
  return (
    <Page title="Soru sor">
      {p.success ? (
        <Editor
          initial={{
            universityId: p.data.universityId,
            programId: p.data.programId,
            departmentId: p.data.departmentId,
          }}
        />
      ) : (
        <ErrorState error={null} />
      )}
    </Page>
  );
}
export function QuestionEditScreen() {
  const p = idParams.safeParse(useLocalSearchParams());
  return (
    <Page title="Soruyu düzenle">
      {p.success ? <EditLoader id={p.data.id} /> : <ErrorState error={null} />}
    </Page>
  );
}
function EditLoader({ id }: { id: string }) {
  const query = useQuery(questionDetail(id));
  const [revision, setRevision] = useState(0);
  return query.isPending ? (
    <Skeleton />
  ) : query.isError && !query.data ? (
    <ErrorState
      error={query.error}
      retry={() => {
        void query.refetch();
      }}
    />
  ) : (
    <Editor
      key={revision}
      initial={query.data}
      reload={() => {
        void query.refetch().then(() => setRevision(value => value + 1));
      }}
    />
  );
}
function Editor({
  initial: initialQuestion,
  reload,
}: {
  initial: Schema["QuestionResponse"];
  reload?: () => void;
}) {
  const [initial] = useState(initialQuestion);
  const [requestId] = useState(newRequestId);
  const [universityName, setUniversityName] = useState(initial.universityName);
  const [programName, setProgramName] = useState(initial.departmentName);
  return (
    <FeatureForm
      schema={questionSchema}
      reload={reload}
      defaults={{
        title: initial.title ?? "",
        body: initial.body ?? "",
        scope:
          initial.scope ??
          (initial.programId || initial.departmentId
            ? "UNIVERSITY_DEPARTMENT"
            : initial.universityId
              ? "UNIVERSITY"
              : "GENERAL"),
        universityId: initial.universityId ?? "",
        programId: initial.programId ?? "",
        departmentId: initial.departmentId ?? "",
        tagIds: initial.tags?.flatMap((tag) => (tag.id ? [tag.id] : [])) ?? [],
      }}
      fields={[
        { name: "title", label: "Soru başlığı" },
        { name: "body", label: "Soru açıklaması (isteğe bağlı)", multiline: true },
      ]}
      label={initial.id ? "Değişiklikleri kaydet" : "Soruyu yayınla"}
      testID="question-submit"
      submit={async (values) => {
        const content: Schema["QuestionContent"] = {
          title: values.title,
          body: values.body,
          scope: values.scope,
          tagIds: values.tagIds,
          universityId:
            values.scope === "GENERAL" ? undefined : values.universityId,
          programId:
            values.scope === "UNIVERSITY_DEPARTMENT"
              ? values.programId || undefined
              : undefined,
          departmentId:
            values.scope === "UNIVERSITY_DEPARTMENT"
              ? values.departmentId || undefined
              : undefined,
        };
        const result = initial.id
          ? await questionsApi.update(initial.id, {
              content,
              version: initial.version!,
            })
          : await questionsApi.create({ content, requestId });
        await refreshQuestions();
        if (result.id)
          router.replace({
            pathname: "/questions/[id]",
            params: { id: result.id },
          });
      }}
    >
      {(form) => (
        <View className="gap-4">
          {!initial.id && <TemplatePicker choose={template => { form.setValue('title', template.title ?? '', { shouldValidate: true }); form.setValue('body', template.body ?? '', { shouldValidate: true }); }} />}
          <Select
            label="Bağlam"
            value={form.watch("scope")}
            onChange={(value) => form.setValue("scope", value)}
            options={[
              { value: "GENERAL", label: "Genel" },
              { value: "UNIVERSITY", label: "Üniversite" },
              { value: "UNIVERSITY_DEPARTMENT", label: "Üniversite + Bölüm" },
            ]}
          />
          {form.watch("scope") !== "GENERAL" && (
            <CatalogPicker
              showProgram={form.watch("scope") === "UNIVERSITY_DEPARTMENT"}
              universityId={form.watch("universityId")}
              universityName={universityName}
              programName={programName}
              onUniversity={(item) => {
                form.setValue("universityId", item.id!);
                form.setValue("programId", "");
                form.setValue("departmentId", "");
                setUniversityName(item.name);
                setProgramName(undefined);
              }}
              onProgram={(item) => {
                form.setValue("programId", item.id!);
                form.setValue("departmentId", item.departmentId ?? "");
                setProgramName(item.name);
              }}
            />
          )}
          {(form.formState.errors.universityId?.message || form.formState.errors.programId?.message) && <Text accessibilityRole="alert" className="text-danger">{form.formState.errors.universityId?.message || form.formState.errors.programId?.message}</Text>}
          <TagPicker
            selected={form.watch("tagIds")}
            onChange={(ids) =>
              form.setValue("tagIds", ids, { shouldValidate: true })
            }
          />
          {form.formState.errors.tagIds?.message && <Text accessibilityRole="alert" className="text-danger">{form.formState.errors.tagIds.message}</Text>}
        </View>
      )}
    </FeatureForm>
  );
}
