import {AchievementMedallion} from "./achievement-medallion";
import type { ReactElement } from "react";
import { Keyboard, Platform, Pressable, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { ErrorState, useOffline } from "@/components/ui/states";
import type { Schema } from "@/lib/api/types";
import { retentionKeys, setShowcase } from "./api";
import { showcaseSchema } from "./schemas";

const row = cva("flex-row items-center gap-3 rounded-control border border-border bg-surface px-3 py-2", {
  variants: {
    platform: { ios: "min-h-touch-ios", android: "min-h-touch-android" },
    disabled: { true: "opacity-50", false: "active:opacity-80" },
  },
});
const check = cva("h-5 w-5 items-center justify-center rounded border", {
  variants: { checked: { true: "border-primary bg-primary", false: "border-secondary-border bg-surface" } },
});
export function ShowcaseForm({ id, items, header, refreshing, refresh, onSaved, onChange, catalog=[] }: {
  catalog?: Schema["AchievementDefinitionResponse"][];
  id: string;
  items: Schema["AchievementResponse"][];
  header: ReactElement;
  refreshing: boolean;
  refresh: () => void;
  onSaved: () => void;
  onChange: () => void;
}) {
  const client = useQueryClient();
  const offline = useOffline();
  const form = useForm({ resolver: zodResolver(showcaseSchema),
    defaultValues: { achievementIds: items.filter(item => item.featured && item.id).map(item => item.id!) } });
  const selected = useWatch({ control: form.control, name: "achievementIds" });
  const save = useMutation({ mutationFn: (achievementIds: string[]) => setShowcase(achievementIds), retry: 0,
    onSuccess: async () => {
      onSaved();
      await Promise.all([
        client.invalidateQueries({ queryKey: retentionKeys.achievements(id) }),
        client.invalidateQueries({ queryKey: retentionKeys.score(id) }),
      ]);
    } });
  const renderOption: ListRenderItem<Schema["AchievementResponse"]> = ({ item }) => {
    const checked = !!item.id && selected.includes(item.id);
    const disabled = offline || save.isPending || !item.id || (!checked && selected.length >= 3);
    return <View className="flex-row items-center gap-3 rounded-card border border-border bg-surface p-3"><AchievementMedallion achievement={item} definition={catalog.find(d=>d.key===item.key)}/><Pressable accessibilityRole="checkbox"
      accessibilityLabel={`${item.title ?? "Rozet"}${item.periodYear ? ` · ${item.periodYear}` : ""}`}
      accessibilityState={{ checked, disabled }} disabled={disabled}
      className={row({ platform: Platform.OS === "android" ? "android" : "ios", disabled })}
      onPress={() => {
        onChange(); save.reset();
        form.setValue("achievementIds", checked ? selected.filter(value => value !== item.id) : [...selected, item.id!], { shouldValidate: true, shouldDirty: true });
      }}>
      <View accessible={false} className={check({ checked })}>
        {checked && <Text variant="unstyled" className="text-metadata text-primary-foreground">✓</Text>}
      </View>
      <Text variant="unstyled" className="min-w-0 flex-1">{item.title}{item.periodYear ? ` · ${item.periodYear}` : ""}</Text>
    </Pressable></View>;
  };
  return <FlashList data={items} extraData={{ selected, disabled: offline || save.isPending }}
    renderItem={renderOption} keyExtractor={item => item.id!} ItemSeparatorComponent={Separator}
    refreshing={refreshing} onRefresh={refresh}
    ListHeaderComponent={<View className="gap-3 pb-4">{header}
      <Text>Profilinde göstermek için en fazla üç rozet seç.</Text>
      <Text variant="muted" accessibilityLiveRegion="polite">{selected.length}/3 rozet seçili</Text>
    </View>}
    ListFooterComponent={<View className="gap-3 pt-4">
      {catalog.filter(d=>!items.some(item=>item.key===d.key)).map(definition=><View key={definition.key} className="flex-row items-center gap-3 rounded-card border border-border bg-surface p-3"><AchievementMedallion definition={definition}/><View className="min-w-0 flex-1 gap-1"><Text variant="label">{definition.title}</Text><Text variant="muted">{definition.description}</Text><Text variant="muted">Kilitli</Text></View></View>)}
      {form.formState.errors.achievementIds && <Text accessibilityRole="alert" className="text-danger">{form.formState.errors.achievementIds.message}</Text>}
      {save.isError && <ErrorState error={save.error} />}
      {offline && <Text variant="unstyled" className="text-warning">Göndermek için internete bağlan.</Text>}
      <Button label="Vitrini kaydet" testID="showcase-submit" pending={save.isPending}
        disabled={offline || form.formState.isSubmitting}
        onPress={form.handleSubmit(values => { Keyboard.dismiss(); return save.mutateAsync(values.achievementIds).catch(() => undefined); })} />

    </View>} />;
}
function Separator() { return <View className="h-list-gap" />; }
