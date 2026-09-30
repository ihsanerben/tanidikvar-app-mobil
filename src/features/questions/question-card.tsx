import type { ReactNode } from "react";
import { router } from "expo-router";
import type { Schema } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { QuestionByline } from './question-byline';
import { QuestionContext } from './question-context';
import { Pressable, View } from 'react-native';
export function QuestionCard({ item, actions }: { item: Schema["QuestionResponse"]; actions?:ReactNode }) {
  return (
    <View className="relative">
    <Pressable accessibilityRole="link" accessibilityLabel={`${item.title} sorusunu aç`} onPress={() => item.id && router.push({ pathname: '/questions/[id]', params: { id: item.id } })}>
    <Card compact className={actions ? "gap-1 pr-14" : "gap-1"}>
      <QuestionContext question={item} compact />
      <Text variant="heading" numberOfLines={2}>{item.title}</Text>
      {!!item.body && <Text numberOfLines={1} className="text-excerpt text-muted">{item.body}</Text>}
      <View className="mt-2"><QuestionByline question={item} compact statsRight /></View>
      {item.archivedAt && <Badge label="Arşivlenmiş soru" />}

    </Card>
    </Pressable>
    {actions && <View className="absolute right-3 top-2">{actions}</View>}
    </View>
  );
}
