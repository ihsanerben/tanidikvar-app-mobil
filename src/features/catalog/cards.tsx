import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Schema } from "@/lib/api/types";
import { numberText } from "@/lib/navigation/params";
export function UniversityCard({
  item,
}: {
  item: Schema["UniversityResponse"];
}) {
  return (
    <Card>
      <Badge label={item.institutionType ?? "Üniversite"} />
      <Text variant="heading">{item.name}</Text>
      <Text variant="muted">
        {item.city} · {numberText(item.programCount)} program ·{" "}
        {numberText(item.questionCount)} soru
      </Text>
      <Button
        label="Üniversiteyi keşfet"
        variant="secondary"
        onPress={() =>
          item.id &&
          router.push({
            pathname: "/universities/[id]",
            params: { id: item.id },
          })
        }
      />
    </Card>
  );
}
export function ProgramCard({
  item,
}: {
  item: Schema["ProgramSummaryResponse"];
}) {
  return (
    <Card>
      <Text variant="heading">{item.name}</Text>
      <Text variant="muted">
        {item.universityName} · {item.city}
      </Text>
      <Text>
        {item.scoreTypes?.join(" / ")} · {item.durationYears ?? "—"} yıl
      </Text>
      <Text variant="muted">
        Başarı sırası {numberText(item.currentBestRank)} · Taban puan{" "}
        {numberText(item.currentMinimumScore)}
      </Text>
      <Button
        label="Programı incele"
        variant="secondary"
        onPress={() =>
          item.id &&
          router.push({ pathname: "/programs/[id]", params: { id: item.id } })
        }
      />
    </Card>
  );
}
