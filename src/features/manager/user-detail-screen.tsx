import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { z } from "zod";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FeatureForm } from "@/components/ui/feature-form";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { ManagerPage } from "./manager-shell";

const params = z.object({ id: z.uuid() });
const reason = z.object({ reason: z.string().trim().min(5).max(1000) });
export function ManagerUserDetailScreen() {
  const parsed = params.safeParse(useLocalSearchParams());
  return parsed.success ? <Detail id={parsed.data.id} /> : <ManagerPage title="Kullanıcı"><ErrorState error={null} /></ManagerPage>;
}
function Detail({ id }: { id: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["manager", "user", id], queryFn: ({ signal }) => api.call("get", "/api/manager/users/{id}", { params: { id }, authenticated: true, signal }) });
  const mutation = useMutation({ mutationFn: (body: { reason: string }) => api.call("put", "/api/manager/users/{id}/status", { params: { id }, body: { reason: body.reason, hidden: !query.data?.user?.deletedAt, version: query.data?.user?.version }, authenticated: true }), onSuccess: async () => { setConfirmOpen(false); await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ["manager", "users"] })]); } });
  const revoke = useMutation({ mutationFn: (body: { reason: string }) => api.call("post", "/api/manager/users/{id}/revoke-tanidik", { params: { id }, body: { verificationId: query.data?.verificationId!, reason: body.reason }, authenticated: true }), onSuccess: async () => { setRevokeOpen(false); await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ["manager", "users"] })]); } });
  const data = query.data;
  return <ManagerPage title="Kullanıcı detayı">
    <Button label="← Kullanıcılara dön" variant="secondary" onPress={() => router.push("/manager/users")} />
    {query.isPending ? <Skeleton /> : query.isError && !data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : data && <>
      <Card className="border-[#e0e3ec]"><Text variant="heading">{data.user?.name || data.user?.email}</Text><Text>{data.user?.email}</Text><Text variant="muted">{data.user?.authority} · {data.user?.deletedAt ? "Pasif" : "Aktif"} · {data.user?.emailVerified ? "E-posta doğrulandı" : "E-posta doğrulanmadı"}</Text></Card>
      <Card className="border-[#e0e3ec]"><Text variant="heading">Eğitim ve profil</Text><Text>{data.universityName || "Üniversite yok"} · {data.departmentName || "Bölüm yok"}</Text><Text variant="muted">{data.user?.educationStatus || "Eğitim durumu yok"} · {data.graduationYear || "Mezuniyet yılı yok"}</Text><Text>{data.biography}</Text></Card>
      <Card className="border-[#e0e3ec]"><Text variant="heading">Katkılar</Text><Text>{data.questions ?? 0} soru · {data.communityAnswers ?? 0} topluluk yorumu · {data.adminAnswers ?? 0} Tanıdık yorumu</Text></Card>
      <Button label="Başvuru geçmişi" variant="secondary" onPress={() => router.push({ pathname: "/manager/users/[id]/applications", params: { id } })} />
      {data.user?.authority !== "MANAGER" && <Button label={data.user?.deletedAt ? "Hesabı yeniden etkinleştir" : "Hesabı pasifleştir"} variant="danger" onPress={() => setConfirmOpen(true)} />}
      {data.user?.authority === "TANIDIK" && data.verificationId && <Button label="Tanıdık yetkisini kaldır" variant="secondary" onPress={() => setRevokeOpen(true)} />}
      <BottomSheet visible={confirmOpen} title={data.user?.deletedAt ? "Hesabı yeniden etkinleştir" : "Hesabı pasifleştir"} close={() => { if (!mutation.isPending) setConfirmOpen(false); }}>
        <Text>Bu işlem için gerekçe yaz. Karar işlem geçmişine kaydedilir.</Text>
        <FeatureForm schema={reason} defaults={{ reason: "" }} fields={[{ name: "reason", label: "Gerekçe", multiline: true }]} label="Kararı kaydet" submit={body => mutation.mutateAsync(body)} />
        {mutation.isError && <ErrorState error={mutation.error} />}
      </BottomSheet>
      <BottomSheet visible={revokeOpen} title="Tanıdık yetkisini kaldır" close={() => { if (!revoke.isPending) setRevokeOpen(false); }}>
        <Text>Geçmiş yorumlar korunur. Bekleyen yeniden doğrulama başvuruları reddedilir.</Text>
        <FeatureForm schema={reason} defaults={{ reason: "" }} fields={[{ name: "reason", label: "Gerekçe", multiline: true }]} label="Yetkiyi kaldır" submit={body => revoke.mutateAsync(body)} />
        {revoke.isError && <ErrorState error={revoke.error} />}
      </BottomSheet>
    </>}
  </ManagerPage>;
}
