import { router } from "expo-router";
import type { Schema } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export function QuestionCard({ item }: { item: Schema["QuestionResponse"] }) {
  return (
    <Card>
      <Badge label={item.universityName || "Genel"} />
      <Text variant="heading">{item.title}</Text>
      <Text numberOfLines={3}>{item.body}</Text>
      <Text variant="muted">
        {item.authorName} · {item.statistics?.totalAnswerCount ?? 0} cevap ·{" "}
        {item.statistics?.likeCount ?? 0} beğeni
      </Text>
      <Button
        label="Soruyu aç"
        variant="secondary"
        onPress={() =>
          item.id &&
          router.push({ pathname: "/questions/[id]", params: { id: item.id } })
        }
      />
    </Card>
  );
}
