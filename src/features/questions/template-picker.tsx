import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { api } from '@/lib/api/client';
import type { Schema } from '@/lib/api/types';
import { Text } from '@/components/ui/text';
import { ErrorState, Skeleton, EmptyState } from '@/components/ui/states';

type Template = Schema['QuestionTemplateResponse'];
export function TemplatePicker({ choose }: { choose: (template: Template) => void }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const query = useQuery({ queryKey: ['questions','templates'], queryFn: ({ signal }) => api.call('get','/api/question-templates',{ signal }), staleTime: 300_000, enabled: open });
  const categories = useMemo(() => [...new Set((query.data ?? []).map(item => item.category).filter((value): value is string => !!value))], [query.data]);
  const visible = (query.data ?? []).filter(item => !category || item.category === category);
  return <View className="overflow-hidden rounded-control border border-secondary-border bg-primary-soft">
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel="Ne soracağımı bilmiyorum, hazır soru önerilerine göz at" onPress={() => setOpen(value => !value)} className="min-h-touch-ios flex-row items-center gap-2 px-3 py-2.5">
      <View className="h-6 w-6 items-center justify-center rounded-full bg-primary"><Text variant="unstyled" className="text-[12px] font-bold text-primary-foreground">?</Text></View>
      <View className="min-w-0 flex-1"><Text variant="unstyled" className="text-[12px] font-bold text-primary">Ne soracağımı bilmiyorum</Text><Text variant="unstyled" className="text-[10px] text-muted">Hazır soru önerilerine göz at</Text></View>
      <Text className="text-primary">{open ? '⌃' : '⌄'}</Text>
    </Pressable>
    {open && <View className="gap-2 border-t border-secondary-border bg-surface p-2.5">
      <Text variant="unstyled" className="text-[11px] font-semibold text-primary">Hazır sorular</Text>
      <ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5">{['',...categories].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: category === value }} onPress={() => setCategory(value)} className={category === value ? 'rounded-control border border-primary bg-primary-soft px-2 py-1' : 'rounded-control border border-border bg-surface px-2 py-1'}><Text variant="unstyled" className="text-[10px] text-primary">{value || 'Tümü'}</Text></Pressable>)}</ScrollView>
      {query.isPending ? <Skeleton /> : query.isError ? <ErrorState error={query.error} retry={() => { void query.refetch(); }} /> : visible.length ? <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled className="max-h-44">{visible.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => { choose(item); setOpen(false); }} className="border-b border-border px-2 py-2"><Text variant="unstyled" className="text-[11px] text-primary">{item.title}</Text></Pressable>)}</ScrollView> : <EmptyState title="Henüz hazır soru yok" />}
    </View>}
  </View>;
}
