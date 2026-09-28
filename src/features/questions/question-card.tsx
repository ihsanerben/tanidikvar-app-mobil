import type { ReactNode } from "react";
import { router } from "expo-router";
import type { Schema } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { QuestionByline } from './question-byline';
import { QuestionContext } from './question-context';
import { Pressable } from 'react-native';
export function QuestionCard({ item, actions }: { item: Schema["QuestionResponse"]; actions?:ReactNode }) {
  return (
    <Card compact className="gap-1">
      {actions}
      <QuestionContext question={item} compact />
      <Pressable accessibilityRole="link" accessibilityLabel={item.title} hitSlop={{ top: 8, bottom: 8 }} className="min-h-7 justify-center" onPress={() => item.id && router.push({ pathname: '/questions/[id]', params: { id: item.id } })}><Text variant="heading" numberOfLines={2}>{item.title}</Text></Pressable>
      {!!item.body && <Text numberOfLines={1} className="text-excerpt text-muted">{item.body}</Text>}
      <QuestionByline question={item} compact />
      {item.archivedAt && <Badge label="Arşivlenmiş soru" />}

    </Card>
  );
}
