import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Schema } from '@/lib/api/types';
export function QuestionByline({ question }: { question: Schema['QuestionResponse'] }) {
  return <View className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1"><View className="min-w-0 flex-1 gap-1">
    <Pressable accessibilityRole="link" accessibilityLabel={`${question.authorName ?? 'Üye'} profili`} disabled={!question.authorId} onPress={() => question.authorId && router.push({ pathname: '/profiles/[id]', params: { id: question.authorId } })} className="min-h-touch-ios flex-row items-center gap-2">
      <Avatar name={question.authorName} educationStatus={question.educationStatus} tanidik={question.activeAdmin} size="small" /><Text className="min-w-0 flex-1 text-caption">{question.authorName}</Text>
    </Pressable>
    {question.createdAt && <Text className="text-metadata text-muted">{new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(new Date(question.createdAt))}</Text>}
  </View><View className="flex-row items-center gap-3">{([
    ['view', question.statistics?.viewCount ?? 0, 'görüntülenme'], ['heart', question.statistics?.likeCount ?? 0, 'faydalı oy'], ['comment', question.statistics?.totalAnswerCount ?? 0, 'yorum'],
  ] as const).map(([name, count, label]) => <View key={name} accessible accessibilityLabel={`${count} ${label}`} className="flex-row items-center gap-1"><Icon name={name} /><Text className="text-metadata text-muted">{count.toLocaleString('tr-TR')}</Text></View>)}</View></View>;
}
