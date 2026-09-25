import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Page } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Choice } from "@/components/ui/choice";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { numberText } from "@/lib/navigation/params";
import { reportQuery } from "./api";
import { reportParams } from "./schemas";
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
  const current = new Date().getFullYear();
  return (
    <Page
      title="Yıllık Tanıdık Karnesi"
      refresh={() => {
        void query.refetch();
      }}
      refreshing={query.isRefetching}
    >
      <Choice
        label="Yıl"
        value={String(year)}
        onChange={(year) => router.setParams({ year })}
        options={Array.from({ length: current - 2019 }, (_, index) => ({
          value: String(current - index),
          label: String(current - index),
        }))}
      />
      {query.isPending ? (
        <Skeleton />
      ) : query.isError && !query.data ? (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <>
          <Card>
            <Text variant="heading">{year} katkı özeti</Text>
            <Text>{numberText(query.data.points)} puan</Text>
            <Text>{numberText(query.data.pointEvents)} puan olayı</Text>
            <Text>{numberText(query.data.answers)} cevap</Text>
            <Text>{numberText(query.data.bestAnswers)} En İyi Cevap</Text>
            <Text>{numberText(query.data.usefulVotes)} faydalı oy</Text>
            <Text>{numberText(query.data.evaluations)} değerlendirme</Text>
            <Text>{numberText(query.data.experiences)} deneyim paylaşımı</Text>
            <Text variant="muted">
              Puan yüzdelik dilimi: %{numberText(query.data.percentile)}
            </Text>
          </Card>
          {query.isError && (
            <ErrorState
              error={query.error}
              retry={() => {
                void query.refetch();
              }}
            />
          )}
        </>
      )}
    </Page>
  );
}
