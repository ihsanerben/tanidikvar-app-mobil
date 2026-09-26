import { router } from "expo-router";
import type { Schema } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Avatar } from '@/components/ui/avatar';
import { QuestionContext } from './question-context';
import { View, Pressable } from 'react-native';
export function QuestionCard({ item }: { item: Schema["QuestionResponse"] }) {
  return (
    <Card>
      <QuestionContext question={item} />
      <Pressable accessibilityRole="link" accessibilityLabel={item.title} className="min-h-11 justify-center" onPress={() => item.id && router.push({ pathname: '/questions/[id]', params: { id: item.id } })}><Text variant="heading">{item.title}</Text></Pressable>
      {!!item.body && <Text numberOfLines={2} className="text-excerpt text-muted">{item.body}</Text>}
      <Pressable accessibilityRole="link" disabled={!item.authorId} onPress={() => item.authorId && router.push({ pathname: '/profiles/[id]', params: { id: item.authorId } })} className="min-h-11 flex-row items-center gap-2">
        <Avatar name={item.authorName} educationStatus={item.educationStatus} tanidik={item.activeAdmin} size="small" />
        <View className="flex-1 gap-1"><Text variant="muted">{item.authorName}</Text><Text className="text-metadata text-muted">{item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : ''}</Text></View>
      </Pressable>
      {item.archivedAt && <Badge label="Arşivlenmiş soru" />}
      <Text className="self-end text-metadata text-muted">{item.statistics?.viewCount ?? 0} görüntülenme · {item.statistics?.likeCount ?? 0} faydalı oy · {item.statistics?.totalAnswerCount ?? 0} yorum</Text>
    </Card>
  );
}
