import { AchievementMedallion } from './achievement-medallion';
import { groupAchievementEntries } from './achievement-groups';
import type { ReactElement } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ErrorState, useOffline } from '@/components/ui/states';
import type { Schema } from '@/lib/api/types';
import { retentionKeys, setShowcase } from './api';
import { showcaseSchema } from './schemas';

type Achievement = Schema['AchievementResponse'];
type Definition = Schema['AchievementDefinitionResponse'];
type Entry = { achievement?: Achievement; definition: Definition };
type Group = { title: string; items: Entry[] };

export function ShowcaseForm({ id, items, header, refreshing, refresh, onSaved, onChange, catalog=[] }: {
  catalog?: Definition[];
  id: string;
  items: Achievement[];
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
  const selected = useWatch({ control: form.control, name: 'achievementIds' });
  const save = useMutation({ mutationFn: (achievementIds: string[]) => setShowcase(achievementIds), retry: 0,
    onSuccess: async () => {
      onSaved();
      await Promise.all([
        client.invalidateQueries({ queryKey: retentionKeys.achievements(id) }),
        client.invalidateQueries({ queryKey: retentionKeys.score(id) }),
      ]);
    } });

  const entries: Entry[] = catalog.flatMap(definition => {
    const earned = items.filter(item => item.key === definition.key);
    return earned.length ? earned.map(achievement => ({ definition, achievement })) : [{ definition }];
  });
  for (const achievement of items.filter(item => !catalog.some(definition => definition.key === item.key))) {
    entries.push({ achievement, definition: { key: achievement.key ?? achievement.id ?? 'OTHER', title: achievement.title ?? 'Rozet', description: 'Topluluğa yaptığın katkılar için kazanılan başarı rozeti.', icon: '★' } });
  }
  const groups = groupAchievementEntries(entries);
  const renderGroup: ListRenderItem<Group> = ({ item: group }) => <View className="gap-3">
    <Text variant="heading">{group.title}</Text>
    <View className="flex-row flex-wrap">{group.items.map(({ definition, achievement }) => {
      const checked = !!achievement?.id && selected.includes(achievement.id);
      const disabled = offline || save.isPending || !achievement?.id || (!checked && selected.length >= 3);
      return <View key={achievement?.id ?? definition.key} className="w-1/3 px-1 pb-2">
        <View className={`flex-1 items-center gap-2 rounded-card border border-border p-2 ${achievement ? 'bg-surface' : 'bg-subtle'}`}>
          <AchievementMedallion achievement={achievement} definition={definition} compact/>
          <Text className="text-center text-caption font-semibold text-primary" numberOfLines={3}>{achievement?.title ?? definition.title}{achievement?.periodYear ? ` · ${achievement.periodYear}` : ''}</Text>
          {achievement ? <Pressable accessibilityRole="checkbox" accessibilityLabel={`${achievement.title ?? 'Rozet'}${achievement.periodYear ? ` · ${achievement.periodYear}` : ''}`}
            accessibilityState={{ checked, disabled }} disabled={disabled}
            className={`min-h-touch-ios android:min-h-touch-android w-full items-center justify-center rounded-control border px-1 ${checked ? 'border-primary bg-primary' : 'border-secondary-border bg-surface'}`}
            onPress={() => {
              onChange(); save.reset();
              form.setValue('achievementIds', checked ? selected.filter(value => value !== achievement.id) : [...selected, achievement.id!], { shouldValidate: true, shouldDirty: true });
            }}><Text className={`text-center text-caption ${checked ? 'text-primary-foreground' : 'text-primary'}`}>{checked ? 'Seçili' : 'Seç'}</Text></Pressable>
            : <Text variant="muted" className="text-center text-caption">Kilitli</Text>}
        </View>
      </View>;
    })}</View>
  </View>;

  return <FlashList showsVerticalScrollIndicator={false} data={groups} extraData={{ selected, disabled: offline || save.isPending }}
    renderItem={renderGroup} keyExtractor={group => group.title} ItemSeparatorComponent={Separator}
    refreshing={refreshing} onRefresh={refresh}
    ListHeaderComponent={<View className="gap-3 pb-4">{header}
      <Text>Benzer rozetler aynı grupta, üçlü sıralar halinde gösterilir.</Text>
      <View className="gap-3 rounded-card border border-border bg-account-summary p-4">
        <Text variant="muted" accessibilityLiveRegion="polite">{selected.length}/3 rozet seçili · En fazla üç rozeti profilinde göster.</Text>
        {form.formState.errors.achievementIds && <Text accessibilityRole="alert" className="text-danger">{form.formState.errors.achievementIds.message}</Text>}
        {save.isError && <ErrorState error={save.error} />}
        {offline && <Text variant="unstyled" className="text-warning">Göndermek için internete bağlan.</Text>}
        <Button label="Vitrini kaydet" testID="showcase-submit" pending={save.isPending}
          disabled={offline || form.formState.isSubmitting}
          onPress={form.handleSubmit(values => { Keyboard.dismiss(); return save.mutateAsync(values.achievementIds).catch(() => undefined); })} />
      </View>
    </View>} />;
}

function Separator() { return <View className="h-list-gap" />; }
