import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { api } from '@/lib/api/client';
import type { Schema } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Text } from '@/components/ui/text';
import { ErrorState, Skeleton, EmptyState } from '@/components/ui/states';
export function TemplatePicker({ choose }: { choose: (template: Schema['QuestionTemplateResponse']) => void }) {
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ['questions','templates'], queryFn: ({ signal }) => api.call('get','/api/question-templates',{ signal }), staleTime: 300_000, enabled: open });
  function render({ item }: { item: Schema['QuestionTemplateResponse'] }) { return <View className="gap-2 pb-3"><Text variant="muted">{item.category}</Text><Button variant="secondary" label={item.title ?? 'Hazır soru'} onPress={() => { choose(item); setOpen(false); }} /></View>; }
  return <><Button label="Ne soracağımı bilmiyorum · Hazır soru önerileri" variant="secondary" onPress={() => setOpen(true)} /><BottomSheet visible={open} scroll={false} title="Hazır soru havuzu" close={() => setOpen(false)}><View className="h-96">{query.isPending ? <Skeleton /> : query.isError ? <ErrorState error={query.error} retry={() => { void query.refetch(); }} /> : <FlashList data={query.data ?? []} renderItem={render} keyExtractor={item => item.id!} ListEmptyComponent={<EmptyState title="Henüz hazır soru yok" />} />}</View></BottomSheet></>;
}
