import { ScoreSummary } from "@/features/retention/score-summary";
import { useState } from "react";
import { View, Linking, Share } from "react-native";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/ui/choice";
import { ActionButton } from "@/components/ui/action-button";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { idParams, sharePath } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import { publicProfile, publicHistory, publicTanidikHistory } from "./api";
export function PublicProfileScreen() {
  const p = idParams.safeParse(useLocalSearchParams());
  return (
    <Screen>
      {p.success ? <Profile id={p.data.id} /> : <ErrorState error={null} />}
    </Screen>
  );
}
function Profile({ id }: { id: string }) {
  const profile = useQuery(publicProfile(id));
  const [tab, setTab] = useState<"community" | "tanidik">("community");
  if (profile.isPending) return <Skeleton />;
  if (profile.isError && !profile.data)
    return (
      <ErrorState
        error={profile.error}
        retry={() => {
          void profile.refetch();
        }}
      />
    );
  const p = profile.data;
  const tanidik = p.role === "TANIDIK";
  const header = (
    <View className="gap-4 pb-5">
      <PageHeader title={tanidik ? "Tanıdık profili" : "Profil"} />
      <Card className="gap-3"><View className="flex-row items-center gap-4"><Avatar name={p.name} educationStatus={p.educationStatus} tanidik={tanidik} size={tanidik ? "large" : "account"} />
        <View className="min-w-0 flex-1"><Text variant="heading">{p.name ?? "Üye"}</Text><Text variant="muted">{tanidik ? "Tanıdık" : "Üye"} · {p.educationStatus === "MEZUN" ? "Mezun" : p.educationStatus === "UNIVERSITE_OGRENCISI" ? "Öğrenci" : "YKS adayı"}</Text></View></View>
        {!!p.universityName && <Text>{p.universityName}</Text>}{!!p.departmentName && <Text>{p.departmentName}</Text>}
        {!!p.graduationYear && <Text variant="muted">{p.graduationYear} mezunu</Text>}
        {!!p.biography && <Text>{p.biography}</Text>}
        {!!(p.occupation || p.company) && <Text variant="muted">{[p.occupation, p.company].filter(Boolean).join(" · ")}</Text>}
      </Card>
      {tanidik && <ScoreSummary id={id} />}
      {[p.linkedinUrl, p.portfolioUrl]
        .filter((url): url is string => !!url && /^https?:\/\//.test(url))
        .map((url) => (
          <ActionButton
            key={url}
            label={url.includes("linkedin.com") ? "LinkedIn" : "Web sitesi"}
            action={() => Linking.openURL(url)}
          />
        ))}
      <ActionButton
        label="Profili paylaş"
        action={() => Share.share({ message: sharePath("profil", id) })}
      />
      {tanidik && <Choice
        label="Katkılar"
        value={tab}
        onChange={setTab}
        options={[
          { value: "community", label: "Topluluk cevapları" },
          { value: "tanidik", label: "Tanıdık cevapları" },
        ]}
      />}
    </View>
  );
  return tab === "community" ? (
    <History id={id} header={header} />
  ) : (
    <TanidikHistory id={id} header={header} />
  );
}
function History({ id, header }: { id: string; header: React.ReactElement }) {
  const query = useInfiniteQuery(publicHistory(id));
  return <PagedList query={query} renderItem={Contribution} header={header} />;
}
function TanidikHistory({
  id,
  header,
}: {
  id: string;
  header: React.ReactElement;
}) {
  const query = useInfiniteQuery(publicTanidikHistory(id));
  return <PagedList query={query} renderItem={Contribution} header={header} />;
}
function Contribution({
  item,
}: {
  item: Schema["AnswerResponse"] | Schema["AdminAnswerResponse"];
}) {
  return (
    <Card>
      <Text>{item.body}</Text>
      <Text variant="muted">{item.likeCount ?? 0} faydalı oy</Text>
      <Button
        label="Soruyu gör"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/questions/[id]",
            params: { id: item.questionId! },
          })
        }
      />
    </Card>
  );
}
