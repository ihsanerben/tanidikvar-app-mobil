import { ScoreSummary } from "@/features/retention/score-summary";
import { useState } from "react";
import { View, Linking, Share } from "react-native";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Metric } from "@/components/ui/metric";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { ActionButton } from "@/components/ui/action-button";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { api } from "@/lib/api/client";
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
  const tanidikProfile=useQuery({queryKey:["profiles",id,"tanidik-details"],staleTime:30_000,enabled:profile.data?.role === "TANIDIK",queryFn:({signal})=>api.call("get","/api/tanidiklar/{id}",{params:{id},signal})});
  const [tab, setTab] = useState<"community" | "tanidik">("tanidik");
  if (profile.isPending) return <Skeleton variant="profile" />;
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
        {tanidik && <View className="gap-2"><View className="flex-row gap-2"><Metric label="Meslek" value={p.occupation ?? "—"} /><Metric label="Şirket" value={p.company ?? "—"} /></View><Metric label="Hesap açılışı" value={p.createdAt ? new Date(p.createdAt).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric",timeZone:"Europe/Istanbul"}):"—"} /></View>}
      </Card>
      {tanidik && <><View className="flex-row gap-2"><Metric label="cevap" value={tanidikProfile.data ? (tanidikProfile.data.tanidikAnswerCount ?? 0)+(tanidikProfile.data.communityAnswerCount ?? 0):null} /><Metric label="faydalı oy" value={tanidikProfile.data?.helpfulVoteCount} /></View><View className="flex-row gap-2"><Metric label="en iyi cevap" value={tanidikProfile.data?.bestAnswerCount} /><Metric label="yardım edilen kişi" value={tanidikProfile.data?.helpedPeopleCount} /></View>{tanidikProfile.isError && <ErrorState error={tanidikProfile.error} retry={()=>void tanidikProfile.refetch()} />}</>}
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
      {tanidik && <Tabs
        label="Katkılar"
        value={tab}
        onChange={setTab}
        options={[
          { value: "community", label: `Topluluk yorumları (${tanidikProfile.data?.communityAnswerCount ?? "…"})` },
          { value: "tanidik", label: `Tanıdık yorumları (${tanidikProfile.data?.tanidikAnswerCount ?? "…"})` },
        ]}
      />}
    </View>
  );
  return !tanidik || tab === "community" ? (
    <History id={id} header={header} tanidik={tanidik} />
  ) : (
    <TanidikHistory id={id} header={header} />
  );
}
function History({ id, header, tanidik }: { id: string; header: React.ReactElement; tanidik:boolean }) {
  const query = useInfiniteQuery(publicHistory(id));
  return <PagedList query={query} renderItem={Contribution} header={header} footer={tanidik ? <ScoreSummary id={id} /> : undefined} />;
}
function TanidikHistory({
  id,
  header,
}: {
  id: string;
  header: React.ReactElement;
}) {
  const query = useInfiniteQuery(publicTanidikHistory(id));
  return <PagedList query={query} renderItem={Contribution} header={header} footer={<ScoreSummary id={id} />} />;
}
function Contribution({
  item,
}: {
  item: Schema["AnswerResponse"] | Schema["AdminAnswerResponse"];
}) {
  return (
    <Card><View className="flex-row items-center gap-2"><Avatar name={item.authorName} educationStatus={item.educationStatus} tanidik={'anonymous' in item} size="small" /><Text variant="label">{item.authorName}</Text></View>
      <Text>{item.body}</Text>
      <Text variant="muted">{item.likeCount ?? 0} faydalı oy</Text>
      {item.publishedAt && <Text variant="muted">{new Date(item.publishedAt).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"})}</Text>}
      <Button
        label="Soru detayı"
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
