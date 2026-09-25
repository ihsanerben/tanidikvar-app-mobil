import { Share, View, Linking } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Page, PageHeader } from "@/components/ui/page";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { idParams, numberText, sharePath } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import { universityDetail, universityStats, programDetail } from "./api";
import { RetentionButton } from "@/features/retention/retention-button";
export function UniversityDetailScreen() {
  const p = idParams.safeParse(useLocalSearchParams());
  return p.success ? (
    <University id={p.data.id} />
  ) : (
    <Page title="Üniversite">
      <ErrorState error={null} />
    </Page>
  );
}
function University({ id }: { id: string }) {
  const query = useQuery(universityDetail(id));
  const stats = useQuery(universityStats(id));
  return (
    <Page
      title={query.data?.name ?? "Üniversite"}
      refresh={() => {
        void query.refetch();
        void stats.refetch();
      }}
      refreshing={query.isRefetching || stats.isRefetching}
    >
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
          <Badge label={query.data.institutionType ?? "Üniversite"} />
          <Text>{query.data.city}</Text>
          <Text>
            {query.data.description ||
              "Bu üniversiteyi programları ve topluluk deneyimleriyle keşfet."}
          </Text>
          <Card>
            <Text variant="heading">Katalog özeti</Text>
            {stats.isPending ? (
              <Skeleton />
            ) : stats.isError ? (
              <ErrorState
                error={stats.error}
                retry={() => {
                  void stats.refetch();
                }}
              />
            ) : (
              <>
                <Text>
                  {numberText(stats.data.programCount)} program ·{" "}
                  {numberText(stats.data.facultyCount)} akademik birim
                </Text>
                <Text>
                  {numberText(stats.data.optionCount)} tercih seçeneği
                </Text>
                {stats.data.yearly?.map((year) => (
                  <Text key={year.year} variant="muted">
                    {year.year}: {numberText(year.quota)} kontenjan ·{" "}
                    {numberText(year.placed)} yerleşen
                  </Text>
                ))}
              </>
            )}
          </Card>
          <Button
            label="Programları incele"
            onPress={() =>
              router.push({
                pathname: "/kesfet",
                params: { kind: "programs", universityId: id },
              })
            }
          />
          <RetentionButton kind="follows" id={id} />
          <CommunityLinks universityId={id} />
          <ActionButton
            label="Üniversiteyi paylaş"
            action={() =>
              Share.share({
                message: sharePath("universiteler", id, query.data?.name),
              })
            }
          />
          {query.data.websiteUrl &&
            /^https:\/\//.test(query.data.websiteUrl) && (
              <ActionButton
                label="Üniversitenin web sitesi"
                action={() => Linking.openURL(query.data.websiteUrl!)}
              />
            )}
        </>
      )}
    </Page>
  );
}
export function CommunityLinks({
  universityId,
  programId,
  departmentId,
}: {
  universityId: string;
  programId?: string;
  departmentId?: string;
}) {
  return (
    <View className="gap-3">
      <Button
        label="Soru sor"
        onPress={() =>
          router.push({
            pathname: "/questions/new",
            params: { universityId, programId, departmentId },
          })
        }
      />
      {(["questions", "people", "evaluations"] as const).map((view) => (
        <Button
          key={view}
          variant="secondary"
          label={
            {
              questions: "Sorular",
              people: "Tanıdıklar",
              evaluations: "Değerlendirmeler",
            }[view]
          }
          onPress={() =>
            router.push({
              pathname: "/community",
              params: { universityId, programId, departmentId, view },
            })
          }
        />
      ))}
    </View>
  );
}
export function ProgramDetailScreen() {
  const p = idParams.safeParse(useLocalSearchParams());
  return (
    <Screen>
      {p.success ? <Program id={p.data.id} /> : <ErrorState error={null} />}
    </Screen>
  );
}
function Program({ id }: { id: string }) {
  const query = useQuery(programDetail(id));
  if (query.isPending) return <Skeleton />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const summary = query.data.summary;
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title={summary?.name ?? "Program"} />
      <Badge label={summary?.degreeLevel ?? "Program"} />
      <Text variant="heading">{summary?.universityName}</Text>
      <Text>
        {summary?.city} · {summary?.scoreTypes?.join(" / ")} ·{" "}
        {summary?.durationYears ?? "—"} yıl
      </Text>
      <Card>
        <Text>Başarı sırası: {numberText(summary?.currentBestRank)}</Text>
        <Text>Taban puan: {numberText(summary?.currentMinimumScore)}</Text>
        <Text>
          Kontenjan: {numberText(summary?.currentQuota)} · Yerleşen:{" "}
          {numberText(summary?.currentPlaced)}
        </Text>
      </Card>
      {summary?.universityId && (
        <CommunityLinks
          universityId={summary.universityId}
          programId={id}
          departmentId={summary.departmentId}
        />
      )}
      <ActionButton
        label="Programı paylaş"
        action={() => Share.share({ message: sharePath("programlar", id) })}
      />
      <Text variant="heading">Akademik bilgiler</Text>
      {query.data.academicDetails?.map((detail, index) => (
        <Card key={detail.academicUnitId ?? index}>
          <Text variant="label">{detail.faculty}</Text>
          <Text variant="muted">
            Profesör {numberText(detail.professorCount)} · Doçent{" "}
            {numberText(detail.associateProfessorCount)} · Dr. öğretim üyesi{" "}
            {numberText(detail.doctorFacultyMemberCount)}
          </Text>
          <Text>
            {detail.accreditationDescription ||
              "Akreditasyon bilgisi bulunmuyor."}
          </Text>
          <Text variant="muted">
            Başarı barajı: {numberText(detail.minimumSuccessRank)} · TYÇ:{" "}
            {detail.tycQualified == null
              ? "Bilgi yok"
              : detail.tycQualified
                ? "Evet"
                : "Hayır"}
          </Text>
        </Card>
      ))}
      <Text variant="heading">Tercih seçenekleri ve yıllar</Text>
    </View>
  );
  return (
    <FlashList
      data={query.data.options ?? []}
      keyExtractor={(item) => item.id!}
      renderItem={AdmissionCard}
      ListHeaderComponent={header}
      refreshing={query.isRefetching}
      onRefresh={() => {
        void query.refetch();
      }}
      ListFooterComponent={
        <Text variant="muted" className="py-5">
          Kaynak: YÖK Atlas tercih kılavuzu. Eksik değerler çizgi ile
          gösterilir.
        </Text>
      }
    />
  );
}
function AdmissionCard({ item }: { item: Schema["AdmissionOptionResponse"] }) {
  return (
    <View className="pb-4">
      <Card>
        <Text variant="heading">{item.scholarship || "Tercih seçeneği"}</Text>
        <Text variant="muted">
          {item.programCode} · {item.language} · {item.educationType}
        </Text>
        {item.specialQuotaType && <Badge label={item.specialQuotaType} />}
        {item.annualFee != null && (
          <Text>Yıllık ücret: {numberText(item.annualFee)} TL</Text>
        )}
        {item.statistics?.map((year) => (
          <View key={year.year} className="gap-1 border-t border-border pt-3">
            <Text variant="label">{year.year}</Text>
            <Text>
              Taban {numberText(year.minimumScore)} · Sıra{" "}
              {numberText(year.successRank)}
            </Text>
            <Text variant="muted">
              Kontenjan {numberText(year.quota)} · Yerleşen{" "}
              {numberText(year.placed)} · Tercih{" "}
              {numberText(year.totalPreferences)}
            </Text>
            <Text variant="muted">
              TYT Türkçe {numberText(year.tytTurkishNet)} · Matematik{" "}
              {numberText(year.tytMathNet)} · Sosyal{" "}
              {numberText(year.tytSocialNet)} · Fen{" "}
              {numberText(year.tytScienceNet)}
            </Text>
            <Text variant="muted">
              AYT Matematik {numberText(year.aytMathNet)} · Fizik{" "}
              {numberText(year.aytPhysicsNet)} · Kimya{" "}
              {numberText(year.aytChemistryNet)} · Biyoloji{" "}
              {numberText(year.aytBiologyNet)}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  );
}
