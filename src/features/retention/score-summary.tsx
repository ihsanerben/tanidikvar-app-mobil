import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, ErrorState } from "@/components/ui/states";
import { numberText } from "@/lib/navigation/params";
import { scoreQuery } from "./api";
export function ScoreSummary({ id }: { id: string }) {
  const score = useQuery(scoreQuery(id));
  return (
    <Card>
      {score.isPending ? (
        <Skeleton />
      ) : score.isError && !score.data ? (
        <ErrorState
          error={score.error}
          retry={() => {
            void score.refetch();
          }}
        />
      ) : (
        <>
          <Text variant="heading">
            {numberText(score.data.totalPoints)} Tanıdık Puanı
          </Text>
          <Badge label={score.data.title || "Yeni Tanıdık"} />
          <Text variant="muted">
            {numberText(score.data.eventCount)} puan kazandıran katkı
          </Text>
          {score.data.badges?.map((badge) => (
            <Badge key={badge} label={badge} />
          ))}
          {!!score.data.expertise?.length && (
            <Text>Uzmanlık: {score.data.expertise.join(", ")}</Text>
          )}
          <Button
            label="Rozetler ve yıllık karneler"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: "/achievements/[id]", params: { id } })
            }
          />
        </>
      )}
    </Card>
  );
}
