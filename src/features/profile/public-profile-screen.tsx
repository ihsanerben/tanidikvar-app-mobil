import { useState } from "react";
import { View, Pressable } from "react-native";
import { keepPreviousData, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { Tabs } from "@/components/ui/tabs";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { api } from "@/lib/api/client";
import { idParams } from "@/lib/navigation/params";
import type { Schema } from "@/lib/api/types";
import { publicProfile, publicContributionSummary, publicHistory, publicTanidikHistory } from "./api";
import { ProfileIdentityCard } from './profile-identity-card';
export function PublicProfileScreen() {
  const p = idParams.safeParse(useLocalSearchParams());
  return (
    <Screen wide>
      {p.success ? <Profile id={p.data.id} /> : <ErrorState error={null} />}
    </Screen>
  );
}
function Profile({ id }: { id: string }) {
  const profile = useQuery(publicProfile(id));
  const contributionSummary = useQuery({ ...publicContributionSummary(id), enabled: !!profile.data });
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
      <View className="w-full max-w-profile-history self-center px-1.5"><PageHeader title={tanidik ? "" : "Profil"} backHref={tanidik ? "/people" : undefined} backLabel={tanidik ? "Tanıdıklar" : "Geri"} /></View>
      <ProfileIdentityCard name={p.name ?? 'Üye'} profileId={id} educationStatus={p.educationStatus} tanidik={tanidik} contributionSummary={contributionSummary.data}
        subtitle={[p.universityName, p.departmentName].filter(Boolean).join(' · ')} biography={p.biography}
        facts={[{ label: 'Şirket', value: p.company }, { label: 'Meslek', value: p.occupation }, { label: 'Mezuniyet yılı', value: p.graduationYear }, { label: 'Hesap açılışı', value: p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }) : '—' }]}
        links={[...(p.linkedinUrl ? [{ label: 'LinkedIn', url: p.linkedinUrl }] : []), ...(p.portfolioUrl ? [{ label: 'Portfolyo', url: p.portfolioUrl }] : [])]} />
      {tanidikProfile.isError && <ErrorState error={tanidikProfile.error} retry={() => void tanidikProfile.refetch()} />}
      <View className="w-full max-w-profile-history self-center gap-4 px-1.5"><Text variant="heading">Katkılar</Text>
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
      />}</View>
    </View>
  );
  return <History id={id} header={header} tanidik={tanidik} tab={tab} />;
}
function History({ id, header, tanidik, tab }: { id: string; header: React.ReactElement; tanidik: boolean; tab: 'community' | 'tanidik' }) {
  const query = useInfiniteQuery({ ...(tanidik && tab === 'tanidik' ? publicTanidikHistory(id) : publicHistory(id)), placeholderData: keepPreviousData });
  return <PagedList<Schema['AnswerResponse'] | Schema['AdminAnswerResponse']> query={query} renderItem={Contribution} header={header} maintainPosition={false} />;
}
function Contribution({
  item,
}: {
  item: Schema["AnswerResponse"] | Schema["AdminAnswerResponse"];
}) {
  return (
    <View className="w-full max-w-profile-history self-center px-1.5"><Card compact><View className="flex-row items-center gap-2"><Avatar name={item.authorName} educationStatus={item.educationStatus} tanidik={'anonymous' in item} size="small" /><Text variant="label" className="min-w-0 flex-1">{item.authorName}</Text></View>
      <Text>{item.body}</Text>
      <View className="flex-row items-center justify-between gap-2">
        <Text variant="muted" className="min-w-0 flex-1">{item.publishedAt ? new Date(item.publishedAt).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul",day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):''}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel="Soru detayı" className="min-h-touch-ios android:min-h-touch-android justify-center rounded-control border border-secondary-border bg-primary-soft px-2" onPress={() => item.questionId && router.push({pathname:'/questions/[id]',params:{id:item.questionId,answerId:item.id}})}><Text variant="muted" className="font-semibold text-primary">Soru detayı →</Text></Pressable>
      </View>
    </Card></View>
  );
}
