import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { Page } from "@/components/ui/page";
import { FeatureForm } from "@/components/ui/feature-form";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { preferences, profileApi } from "./api";
import { preferenceSchema, notificationCategories } from "./schemas";
export function PreferencesScreen() {
  return <Page title="Bildirim tercihleri" backHref="/profil" backLabel="Hesabıma dön"><PreferencesForm /></Page>;
}
export function PreferencesForm({ onSaved }: { onSaved?: () => void } = {}) {
  const query = useQuery({ ...preferences(), refetchOnWindowFocus: false, refetchOnReconnect: false });
  const [saved, setSaved] = useState(false);
  const p = query.data;
  return (
    <View className="gap-4">
      {saved && <Text accessibilityRole="alert" className="text-success">Bildirim tercihlerin kaydedildi.</Text>}
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
        <FeatureForm
          onSuccess={() => { setSaved(true); onSaved?.(); }}
          testID="preferences-submit"
          label="Ayarları kaydet"
          key={p?.version}
          schema={preferenceSchema}
          reload={() => {
            void query.refetch();
          }}
          defaults={{
            categories: Object.fromEntries(Object.keys(notificationCategories).map(key => [key, p?.categories?.[key] ?? true])) as Record<keyof typeof notificationCategories, boolean>,
            inAppEnabled: p?.inAppEnabled ?? true,
            emailEnabled: p?.emailEnabled ?? true,
            questionRoutingEnabled: p?.questionRoutingEnabled ?? true,
            emailFrequency: preferenceSchema.shape.emailFrequency.safeParse(
              p?.emailFrequency,
            ).success
              ? preferenceSchema.shape.emailFrequency.parse(p?.emailFrequency)
              : "IMMEDIATE",
          }}
          fields={[]}
          submit={(values) =>
            profileApi.preferences({ ...values, version: p?.version })
          }
        >
          {(form) => (
            <View className="gap-3">
              <Text variant="muted">Hangi gelişmelerden, hangi kanalla haberdar olmak istediğini seç.</Text>
              <View className="gap-3 rounded-card border border-border bg-account-summary p-3">
                <Text variant="heading">Bildirim konuları</Text>
                {(Object.keys(notificationCategories) as (keyof typeof notificationCategories)[]).map(key => <Controller key={key} control={form.control} name={`categories.${key}`}
                  render={({ field }) => <View className="min-h-touch-android flex-row items-center justify-between gap-3">
                    <Text className="flex-1">{notificationCategories[key]}</Text>
                    <Switch accessibilityLabel={notificationCategories[key]} value={field.value} onValueChange={field.onChange} />
                  </View>} />)}
              </View>
              {([
                { title: "Uygulama içi", items: [
                  { name: "inAppEnabled", label: "Uygulama bildirimleri", description: "Hesabın ve katkılarınla ilgili gelişmeleri Bildirimler sayfasında göster." },
                  { name: "questionRoutingEnabled", label: "Deneyimime uygun sorular", description: "Üniversite ve program bilgilerinle eşleşen yeni sorulardan haberdar ol." },
                ] },
                { title: "E-posta", items: [
                  { name: "emailEnabled", label: "E-posta bildirimleri", description: "İzin verdiğin bildirimleri e-posta adresine de gönder." },
                ] },
              ] as const).map(group => <View key={group.title} className="gap-3 rounded-card border border-border bg-account-summary p-3">
                <Text variant="heading">{group.title}</Text>
                {group.items.map(item => <Controller key={item.name} control={form.control} name={item.name}
                  render={({ field }) => <View className="min-h-touch-android flex-row items-center justify-between gap-3 rounded-control border border-border bg-surface p-3">
                    <View className="min-w-0 flex-1 gap-1"><Text variant="label">{item.label}</Text><Text variant="muted">{item.description}</Text></View>
                    <Switch testID={`preference-${item.name}`} accessibilityLabel={item.label} value={field.value} onValueChange={field.onChange} />
                  </View>} />)}
                {group.title === "E-posta" && <Controller control={form.control} name="emailFrequency"
                  render={({ field }) => <Select label="E-posta sıklığı" value={field.value} onChange={field.onChange}
                    options={[{ value: "IMMEDIATE", label: "Anında" }, { value: "DAILY", label: "Günlük özet" }, { value: "WEEKLY", label: "Haftalık özet" }, { value: "NEVER", label: "Asla" }]} />} />}
              </View>)}
            </View>
          )}
        </FeatureForm>
      )}
    </View>
  );
}
