import {FeaturedAchievements} from "./achievement-medallion";
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Help } from "@/components/ui/help";
import { Skeleton, ErrorState } from "@/components/ui/states";
import { numberText } from "@/lib/navigation/params";
import { scoreQuery } from "./api";
export function ScoreSummary({ id }: { id: string }) {
  const score = useQuery(scoreQuery(id));
  return (
    <Card>
      {score.isPending ? (
        <Skeleton variant="metrics" />
      ) : score.isError && !score.data ? (
        <ErrorState
          error={score.error}
          retry={() => {
            void score.refetch();
          }}
        />
      ) : (
        <>
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="label" className="shrink">Katkı seviyesi</Text>
            <Help title="Katkı seviyesi" description={"Katkı seviyesi, kişinin platformdaki faydalı ve doğrulanmış katkılarından oluşur. Amaç yalnızca çok içerik üretmek değil, topluluğa gerçekten yardımcı olmaktır.\n\nFaydalı oy: Kalite etkisi\nEn iyi cevap: Güven etkisi\nYorum ve deneyim: Katılım etkisi\nRozetler: Başarı alanları"} />
          </View>
          <Text variant="heading">{score.data.title || "Yeni Tanıdık"}</Text>
          <Text variant="heading">{numberText(score.data.totalPoints)} puan</Text>
          <Text variant="muted">
            {numberText(score.data.eventCount)} puan kazandıran katkı
          </Text>
          <FeaturedAchievements id={id}/>
          {!!score.data.expertise?.length && (
            <View className="gap-2">
              <Text className="font-semibold">Uzmanlık alanları</Text>
              <View className="flex-row flex-wrap gap-2">{score.data.expertise.map((item) => <Badge key={item} label={item} />)}</View>
            </View>
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
