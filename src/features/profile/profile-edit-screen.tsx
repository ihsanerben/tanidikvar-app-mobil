import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { Page } from "@/components/ui/page";
import { FeatureForm } from "@/components/ui/feature-form";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { CatalogPicker } from "@/features/catalog/catalog-picker";
import type { Schema } from "@/lib/api/types";
import { myProfile, profileApi } from "./api";
import { profileSchema } from "./schemas";
export function ProfileEditScreen() {
  const query = useQuery(myProfile());
  const [revision, setRevision] = useState(0);
  const [saved, setSaved] = useState(false);
  return (
    <Page title="Profilim" backHref="/profil" backLabel="Hesabıma dön">
      {saved && <Text accessibilityRole="alert" className="text-success">Profilin kaydedildi.</Text>}
      {query.isPending ? (
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
          profile={query.data}
          onSaved={() => { setSaved(true); setRevision(value => value + 1); }}
          reload={() => {
            void query.refetch().then(() => { setSaved(false); setRevision(value => value + 1); });
          }}
        />
      )}
    </Page>
  );
}
function Editor({
  profile: initialProfile,
  reload,
  onSaved,
}: {
  profile: Schema["ProfileResponse"];
  reload: () => void;
  onSaved: () => void;
}) {
  // Freeze the form baseline until explicit reload/save; background reads must not replace a draft.
  const [profile] = useState(initialProfile);
  const [universityName, setUniversityName] = useState(
    profile.education?.universityName,
  );
  const [programName, setProgramName] = useState(
    profile.education?.departmentName,
  );
  return (
    <View className="gap-3">
    <FeatureForm
      schema={profileSchema}
      reload={reload}
      onSuccess={onSaved}
      defaults={{
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        educationStatus: profile.educationStatus ?? "YKS_ADAYI",
        universityId: profile.education?.universityId ?? "",
        programId: profile.programId ?? "",
        departmentId: profile.education?.departmentId ?? "",
        classYear: profile.classYear?.toString() ?? "",
        graduationYear: profile.graduationYear?.toString() ?? "",
        biography: profile.biography ?? "",
        occupation: profile.occupation ?? "",
        company: profile.company ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        portfolioUrl: profile.portfolioUrl ?? "",
      }}
      fields={[]}
      label="Profili kaydet"
      testID="profile-submit"
      submit={(values) =>
        profileApi.save({
          ...values,
          version: profile.version ?? 0,
          universityId:
            values.educationStatus === "YKS_ADAYI"
              ? undefined
              : values.universityId,
          programId:
            values.educationStatus === "YKS_ADAYI"
              ? undefined
              : values.programId || undefined,
          departmentId:
            values.educationStatus === "YKS_ADAYI"
              ? undefined
              : values.departmentId || undefined,
          classYear:
            values.educationStatus === "UNIVERSITE_OGRENCISI" &&
            values.classYear
              ? Number(values.classYear)
              : undefined,
          graduationYear:
            values.educationStatus === "MEZUN"
              ? Number(values.graduationYear)
              : undefined,
        })
      }
    >
      {(form) => (
        <View className="gap-4">
          <View className="gap-3 rounded-card border border-border bg-surface p-card-inset">
            <Text variant="heading">Temel bilgiler</Text>
            <View className="gap-3">
              {([ ["firstName", "Ad"], ["lastName", "Soyad"] ] as const).map(([name, label]) => <View key={name}><Controller control={form.control} name={name} render={({ field, fieldState }) => <FormField label={label} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />} /></View>)}
            </View>
          <Select
            label="Eğitim durumu"
            value={form.watch("educationStatus")}
            onChange={(value) => form.setValue("educationStatus", value)}
            options={[
              { value: "YKS_ADAYI", label: "YKS adayı" },
              { value: "UNIVERSITE_OGRENCISI", label: "Üniversite öğrencisi" },
              { value: "MEZUN", label: "Mezun" },
            ]}
          />
          {form.watch("educationStatus") !== "YKS_ADAYI" && (
            <CatalogPicker
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
          {form.watch("educationStatus") === "UNIVERSITE_OGRENCISI" && (
            <Controller
              control={form.control}
              name="classYear"
              render={({ field, fieldState }) => (
                <FormField
                  label="Sınıf (1–8, isteğe bağlı)"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                  keyboardType="number-pad"
                />
              )}
            />
          )}
          {form.watch("educationStatus") === "MEZUN" && (
            <Controller
              control={form.control}
              name="graduationYear"
              render={({ field, fieldState }) => (
                <FormField
                  label="Mezuniyet yılı"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                  keyboardType="number-pad"
                />
              )}
            />
          )}
          </View>
          <View className="gap-3 rounded-card border border-border bg-surface p-card-inset">
            <Text variant="heading">İsteğe bağlı bilgiler</Text>
            {([ ["biography", "Kısa biyografi", true], ["occupation", "Meslek", false], ["company", "Şirket", false], ["linkedinUrl", "LinkedIn bağlantısı", false], ["portfolioUrl", "Portfolyo sitesi", false] ] as const).map(([name, label, multiline]) => <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => <FormField label={label} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} multiline={multiline} />} />)}
            <Text variant="muted">Bu bağlantılar profilinde herkese açık görünür.</Text>
          </View>
        </View>
      )}
    </FeatureForm>
    <Button label="Hesabıma dön" variant="secondary" onPress={() => router.push("/profil")} />
    </View>
  );
}
