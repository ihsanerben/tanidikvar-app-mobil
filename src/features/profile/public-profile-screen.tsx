import { cva } from "class-variance-authority";
import { ScoreSummary } from "@/features/retention/score-summary";
import { useState } from "react";
import { View, Linking, Share, Pressable } from "react-native";
import { keepPreviousData, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Metric } from "@/components/ui/metric";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/ui/action-button";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { api } from "@/lib/api/client";
import { idParams, sharePath } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import { publicProfile, publicHistory, publicTanidikHistory } from "./api";
const hero=cva('gap-3', {variants:{education:{YKS_ADAYI:'border-t-4 border-t-candidate',UNIVERSITE_OGRENCISI:'border-t-4 border-t-profile-student',MEZUN:'border-t-4 border-t-graduate',OTHER:''}}});
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
      <PageHeader title={tanidik ? "" : "Profil"} backHref={tanidik ? "/people" : undefined} backLabel={tanidik ? "Tanıdıklar" : "Geri"} />
      <Card className={hero({education:tanidik && (p.educationStatus === "YKS_ADAYI" || p.educationStatus === "UNIVERSITE_OGRENCISI" || p.educationStatus === "MEZUN") ? p.educationStatus : "OTHER"})}><View className="flex-row items-center gap-4"><Avatar name={p.name} educationStatus={p.educationStatus} tanidik={tanidik} size={tanidik ? "large" : "account"} />
        <View className="min-w-0 flex-1"><Text variant={tanidik ? "title" : "heading"}>{p.name ?? "Üye"}</Text><View className="mt-2 flex-row flex-wrap items-center gap-2"><Badge label={p.educationStatus === "MEZUN" ? "Mezun" : p.educationStatus === "UNIVERSITE_OGRENCISI" ? "Üniversite öğrencisi" : "YKS adayı"} /><Badge label={tanidik ? "★ Tanıdık" : "Üye"} /></View></View></View>
        {tanidikProfile.data?.educationVerified && <Text className="text-success">✓ Eğitim kimliği doğrulandı</Text>}
        {!!(p.universityName || p.departmentName) && <Text variant="muted">{[p.universityName, p.departmentName].filter(Boolean).join(" · ")}</Text>}

        {!!p.biography && <Text>{p.biography}</Text>}
        <View className="gap-2">{p.graduationYear && <Metric inset label="Mezuniyet yılı" value={String(p.graduationYear)} />}<View className="flex-row gap-2"><Metric inset label="Meslek" value={p.occupation ?? "—"} /><Metric inset label="Şirket" value={p.company ?? "—"} /></View><Metric inset label="Hesap açılışı" value={p.createdAt ? new Date(p.createdAt).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric",timeZone:"Europe/Istanbul"}):"—"} /></View>
        <View className="flex-row flex-wrap gap-2">{[{url:p.linkedinUrl,label:'LinkedIn ↗'},{url:p.portfolioUrl,label:'Portfolyo ↗'}].filter((link):link is {url:string;label:string}=>!!link.url && /^https?:\/\//.test(link.url)).map(link=><ActionButton key={link.label} label={link.label} action={()=>Linking.openURL(link.url)} />)}</View>
      {tanidik && <><View className="flex-row gap-2"><Metric label="cevap" value={tanidikProfile.data ? (tanidikProfile.data.tanidikAnswerCount ?? 0)+(tanidikProfile.data.communityAnswerCount ?? 0):null} /><Metric label="faydalı oy" value={tanidikProfile.data?.helpfulVoteCount} /></View><View className="flex-row gap-2"><Metric label="en iyi cevap" value={tanidikProfile.data?.bestAnswerCount} /><Metric label="yardım edilen kişi" value={tanidikProfile.data?.helpedPeopleCount} /></View>{tanidikProfile.isError && <ErrorState error={tanidikProfile.error} retry={()=>void tanidikProfile.refetch()} />}</>}
      </Card>
      <ActionButton
        label="Profili paylaş"
        action={() => Share.share({ message: sharePath("profil", id) })}
      />
      <Text variant="heading">Katkılar</Text>
      {tanidik && <Tabs
        variant="filled"
        tone={p.educationStatus === "MEZUN" ? "graduate" : p.educationStatus === "UNIVERSITE_OGRENCISI" ? "student" : "candidate"}
        label="Katkılar"
        value={tab}
        onChange={setTab}
        options={[
          { value: "tanidik", label: `Tanıdık yorumları (${tanidikProfile.data?.tanidikAnswerCount ?? "…"})` },
          { value: "community", label: `Topluluk yorumları (${tanidikProfile.data?.communityAnswerCount ?? "…"})` },
        ]}
      />}
    </View>
  );
  return <History id={id} header={header} tanidik={tanidik} tab={tab} />;
}
function History({ id, header, tanidik, tab }: { id: string; header: React.ReactElement; tanidik: boolean; tab: 'community' | 'tanidik' }) {
  const query = useInfiniteQuery({ ...(tanidik && tab === 'tanidik' ? publicTanidikHistory(id) : publicHistory(id)), placeholderData: keepPreviousData });
  return <PagedList<Schema['AnswerResponse'] | Schema['AdminAnswerResponse']> query={query} renderItem={Contribution} header={header} maintainPosition={false} footer={tanidik ? <ScoreSummary id={id} /> : undefined} />;
}
function Contribution({
  item,
}: {
  item: Schema["AnswerResponse"] | Schema["AdminAnswerResponse"];
}) {
  return (
    <Card><View className="flex-row items-center gap-2"><Avatar name={item.authorName} educationStatus={item.educationStatus} tanidik={'anonymous' in item} size="small" /><Text variant="label">{item.authorName}</Text></View>
      <Text>{item.body}</Text>
      <View className="flex-row items-center justify-between gap-2">
        <Text variant="muted" className="min-w-0 flex-1">{item.publishedAt ? new Date(item.publishedAt).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul",day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):''}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel="Soru detayı" className="min-h-touch-ios android:min-h-touch-android justify-center" onPress={() => item.questionId && router.push({pathname:'/questions/[id]',params:{id:item.questionId}})}><Text variant="muted" className="font-semibold text-primary underline">Soru detayı ↗</Text></Pressable>
      </View>
    </Card>
  );
}
