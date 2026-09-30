import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Schema } from '@/lib/api/types';
export function QuestionByline({ question, compact = false, actions, stackActions = false, statsRight = false }: { question: Schema['QuestionResponse']; compact?: boolean; actions?: ReactNode; stackActions?: boolean; statsRight?: boolean }) {
  const date = question.createdAt ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(new Date(question.createdAt)) : '';
  return <View className={stackActions ? "gap-1" : statsRight ? "flex-row items-end justify-between gap-1" : "flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1"}><View className={stackActions ? "min-w-[140px] gap-1" : "min-w-0 flex-1 gap-1"}>
    <Pressable accessibilityRole="link" accessibilityLabel={`${question.authorName ?? 'Üye'} profili`} disabled={!question.authorId} onPress={event => { event.stopPropagation(); if(question.authorId) router.push({ pathname: '/profiles/[id]', params: { id: question.authorId } }); }} className="min-h-9 self-start flex-row items-center gap-2">
      <Avatar name={question.authorName} educationStatus={question.educationStatus} tanidik={question.activeAdmin} size="small" /><View className="min-w-0"><Text variant="unstyled" numberOfLines={compact ? 1 : undefined} className="text-caption text-text">{question.authorName}</Text>{compact && !!date && <Text variant="unstyled" numberOfLines={1} className="text-compact-badge text-muted">{date}</Text>}</View>
    </Pressable>
    {!compact && question.createdAt && <Text className="text-metadata text-muted">{new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(new Date(question.createdAt))}</Text>}
  </View><View className={stackActions ? "flex-row flex-wrap items-center gap-1" : statsRight ? "shrink-0 flex-row items-center justify-end gap-1" : "flex-row items-center gap-1"}>{actions ?? ([
    ['view', question.statistics?.viewCount ?? 0, 'görüntülenme'], ['heart', question.statistics?.likeCount ?? 0, 'beğeni'], ['comment', question.statistics?.totalAnswerCount ?? 0, 'yorum'],
  ] as const).map(([name, count, label]) => <View key={name} accessible accessibilityLabel={`${count} ${label}`} className="flex-row items-center gap-1"><Icon name={name} /><Text className="text-metadata text-muted">{count.toLocaleString('tr-TR')}</Text></View>)}</View></View>;
}
