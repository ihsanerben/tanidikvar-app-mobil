import { useState } from "react";
import { Switch, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { Page } from "@/components/ui/page";
import { FeatureForm } from "@/components/ui/feature-form";
import { Choice } from "@/components/ui/choice";
import { Text } from "@/components/ui/text";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { preferences, profileApi } from "./api";
import { preferenceSchema } from "./schemas";
export function PreferencesScreen() {
  const query = useQuery({ ...preferences(), refetchOnWindowFocus: false, refetchOnReconnect: false });
  const [saved, setSaved] = useState(false);
  const p = query.data;
  return (
    <Page title="Bildirim tercihleri">
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
          onSuccess={() => setSaved(true)}
          testID="preferences-submit"
          key={p?.version}
          schema={preferenceSchema}
          reload={() => {
            void query.refetch();
          }}
          defaults={{
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
            <View className="gap-4">
              {(
                [
                  { name: "inAppEnabled", label: "Uygulama içi bildirimler" },
                  { name: "emailEnabled", label: "E-posta bildirimleri" },
                  {
                    name: "questionRoutingEnabled",
                    label: "Üniversitemle ilgili yeni sorular",
                  },
                ] as const
              ).map((item) => (
                <Controller
                  key={item.name}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="flex-1">{item.label}</Text>
                      <Switch
                        testID={`preference-${item.name}`}
                        accessibilityLabel={item.label}
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </View>
                  )}
                />
              ))}
              <Controller
                control={form.control}
                name="emailFrequency"
                render={({ field }) => (
                  <Choice
                    label="E-posta sıklığı"
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: "IMMEDIATE", label: "Anında" },
                      { value: "DAILY", label: "Günlük" },
                      { value: "WEEKLY", label: "Haftalık" },
                      { value: "NEVER", label: "Hiçbir zaman" },
                    ]}
                  />
                )}
              />
            </View>
          )}
        </FeatureForm>
      )}
    </Page>
  );
}
