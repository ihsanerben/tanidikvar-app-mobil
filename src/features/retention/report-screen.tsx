import { useQuery } from "@tanstack/react-query";
import { Share, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Page } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { numberText } from "@/lib/navigation/params";
import { reportQuery } from "./api";
import { reportParams } from "./schemas";
import { publicProfile } from "@/features/profile/api";
function Metric({ value, label }: { value?: number; label: string }) {
  return <View className="w-metric-half gap-1 rounded-control bg-primary-soft p-3"><Text variant="heading">{numberText(value)}</Text><Text variant="muted">{label}</Text></View>;
}
export function ReportScreen() {
  const p = reportParams.safeParse(useLocalSearchParams());
  return p.success ? (
    <Report id={p.data.id} year={Number(p.data.year)} />
  ) : (
    <Page title="Tanıdık Karnesi">
      <ErrorState error={null} />
    </Page>
  );
}
function Report({ id, year }: { id: string; year: number }) {
  const query = useQuery(reportQuery(id, year));
  const profile = useQuery(publicProfile(id));
  const current = new Date().getFullYear();
  return (
    <Page
      title="Tanıdık Karnesi"
      backHref={{ pathname: "/profiles/[id]", params: { id } }}
      backLabel="Tanıdık profili"
      refresh={() => {
        void query.refetch();
        void profile.refetch();
      }}
      refreshing={query.isRefetching || profile.isRefetching}
    >
      <Select
        label="Yıl"
        value={String(year)}
        onChange={(year) => router.setParams({ year })}
        options={Array.from({ length: current - 2019 }, (_, index) => ({
          value: String(current - index),
          label: String(current - index),
        }))}
      />
      {query.isPending || profile.isPending ? (
        <Skeleton variant="profile" />
      ) : query.isError && !query.data ? (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : profile.isError && !profile.data ? (
        <ErrorState error={profile.error} retry={() => { void profile.refetch(); }} />
      ) : (
        <>
          <Card className="border-primary bg-primary-soft">
            <Text variant="muted">{year} Tanıdık Karnesi</Text>
            <Text variant="title">{profile.data?.name || "Tanıdık"}</Text>
            <Text variant="heading">{numberText(query.data.points)} Tanıdık Puanı</Text>
            <View className="flex-row flex-wrap justify-between gap-y-2">
              <Metric value={query.data.answers} label="cevap" /><Metric value={query.data.usefulVotes} label="faydalı oy" />
              <Metric value={query.data.bestAnswers} label="En İyi Cevap" /><Metric value={query.data.experiences} label="deneyim" />
            </View>
            <Text>Topluluğun %{query.data.percentile?.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) ?? "—"} diliminde</Text>
            <Text variant="muted">Gerçek deneyimlerle birbirimize yardımcı oluyoruz · TanıdıkVar</Text>
          </Card>
          <Button label="Karneyi paylaş" onPress={() => { void Share.share({ message: `${profile.data?.name || 'Tanıdık'} ${year} Tanıdık Karnesi · https://tanidikvar.com.tr/tanidik/${id}/karne?year=${year}` }); }} />
          <Text variant="muted">{numberText(query.data.pointEvents)} puan olayı · {numberText(query.data.evaluations)} değerlendirme</Text>
          {query.isError && (
            <ErrorState
              error={query.error}
              retry={() => {
                void query.refetch();
              }}
            />
          )}
          {profile.isError && <ErrorState error={profile.error} retry={() => { void profile.refetch(); }} />}
        </>
      )}
    </Page>
  );
}
