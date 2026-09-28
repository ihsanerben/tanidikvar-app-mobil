import { useState } from "react";
import { View } from "react-native";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { PageHeader } from "@/components/ui/page";
import { PagedList } from "@/components/ui/paged-list";
import { FeatureForm } from "@/components/ui/feature-form";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import type { Schema } from "@/lib/api/types";
import { newRequestId } from "@/features/questions/api";
import { myProfile, applications, profileApi } from "./api";
import { applicationSchema } from "./schemas";

const statuses: Record<string, string> = {
  PENDING: "İnceleme bekliyor", APPROVED: "Onaylandı", REJECTED: "Reddedildi", REVOKED: "Kaldırıldı",
};
const educationLabel = (status?: string, year?: number) => status === "MEZUN"
  ? `${year ?? "—"} Mezunu` : status === "YKS_ADAYI" ? "YKS Adayı" : "Üniversite Öğrencisi";
const date = (value: string) => new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul",
}).format(new Date(value));

export function ApplicationScreen() {
  const profile = useQuery(myProfile());
  const query = useInfiniteQuery(applications());
  const [requestId, setRequestId] = useState(newRequestId);
  const [saved, setSaved] = useState(false);
  const items = query.data?.pages.flatMap(page => page.items ?? []) ?? [];
  const pending = items.some(item => item.status === "PENDING");
  const approved = items.some(item => item.activeVerification);
  const current = profile.data;
  const header = <View className="gap-4 pb-4">
    <PageHeader title="Başvurularım" backHref="/profil" backLabel="Hesabıma dön" />
    {profile.isPending && <Skeleton />}
    {profile.isError && <ErrorState error={profile.error} retry={() => { void profile.refetch(); }} />}
    {current && !current.completed && <Card>
      <Text>Tanıdık başvurusu için eğitim bilgilerini tamamla.</Text>
      <Button label="Profilime git" variant="secondary" onPress={() => router.push("/profile/edit")} />
    </Card>}
    {saved && <Text accessibilityRole="alert" className="text-success">Tanıdık başvurun alındı.</Text>}
  </View>;
  const footer = current?.completed && query.isSuccess && !saved && !pending && !approved ? <Card>
    <Text variant="heading">Tanıdık başvurusu</Text>
    <Text>{[current.firstName, current.lastName].filter(Boolean).join(" ")}
      {current.education && ` · ${current.education.universityName ?? ""} · ${current.education.departmentName ?? ""}`}</Text>
    <Text>{educationLabel(current.educationStatus, current.graduationYear)}</Text>
    <Text variant="muted">Başvurun eğitim ve profil bilgilerine göre incelenir. Gönderilen bilgiler sonradan değiştirilemez.</Text>
    <FeatureForm key={requestId} schema={applicationSchema} defaults={{ coverLetter: "" }}
      fields={[{ name: "coverLetter", label: "Kısa ön yazı (20–1000 karakter)", multiline: true }]}
      label="Başvuruyu gönder" testID="application-submit"
      submit={values => profileApi.apply({ requestId, profileVersion: current.version, coverLetter: values.coverLetter })}
      onSuccess={() => { setSaved(true); setRequestId(newRequestId()); void query.refetch(); }} />
  </Card> : undefined;
  return <Screen><PagedList query={query} renderItem={Application} header={header} footer={footer}
    empty={<EmptyState title="Henüz başvurun yok" description="Eğitim bilgilerini tamamladıktan sonra Tanıdık başvurusu yapabilirsin." />} /></Screen>;
}
function Application({ item }: { item: Schema["ApplicationResponse"] }) {
  return <Card>
    <Badge tone={item.status === "APPROVED" ? "success" : item.status === "REJECTED" ? "danger" : item.status === "PENDING" ? "warning" : "neutral"} label={statuses[item.status ?? ""] ?? "Başvuru"} />
    <Text variant="heading">{[item.firstName, item.lastName].filter(Boolean).join(" ")}</Text>
    {(item.universityName || item.departmentName) && <Text>{[item.universityName, item.departmentName].filter(Boolean).join(" · ")}</Text>}
    <Text>{educationLabel(item.educationStatus, item.graduationYear)}</Text>
    {(item.occupation || item.company) && <Text>{[item.occupation, item.company].filter(Boolean).join(" · ")} <Text variant="muted">(kişisel beyan)</Text></Text>}
    <View className="gap-1 rounded-control bg-account-summary p-3">
      <Text variant="label">Ön yazı:</Text><Text>{item.coverLetter || "Eski başvuruda ön yazı bulunmuyor."}</Text>
    </View>
    {item.submittedAt && <Text variant="muted">Başvuru tarihi: {date(item.submittedAt)}</Text>}
    {item.reviewedAt && <Text variant="muted">{item.status === "APPROVED" ? "Onay tarihi" : "Karar tarihi"}: {date(item.reviewedAt)}</Text>}
    {item.status === "APPROVED" && !item.activeVerification && <Text className="text-warning">Tanıdık statün şu anda aktif değil.</Text>}
    {item.rejectionReason && <View className="gap-1 rounded-control bg-danger-soft p-3">
      <Text variant="label" className="text-danger-text">Ret gerekçesi:</Text><Text>{item.rejectionReason}</Text>
    </View>}
  </Card>;
}
