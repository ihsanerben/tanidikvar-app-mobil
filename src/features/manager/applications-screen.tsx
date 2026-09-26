import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { z } from "zod";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Choice } from "@/components/ui/choice";
import { FeatureForm } from "@/components/ui/feature-form";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import { ManagerPage } from "./manager-shell";

const idParams = z.object({ id: z.uuid() });
const decision = z.object({ reason: z.string().trim().min(5).max(1000) });
export function ManagerApplicationsScreen() {
  const [status, setStatus] = useState("PENDING");
  const query = useInfiniteQuery({ queryKey: ["manager", "applications", status], initialPageParam: 0, queryFn: ({ pageParam, signal }) => api.call("get", "/api/manager/tanidik-applications", { query: { status: status || undefined, page: pageParam, size: 20 }, authenticated: true, signal }), getNextPageParam: nextPage });
  const items = query.data?.pages.flatMap(page => page.items ?? []) ?? [];
  return <ManagerPage title="Tanıdık başvuruları">
    <Choice label="Başvuru durumu" value={status} options={[{ value: "PENDING", label: "İnceleme bekliyor" }, { value: "APPROVED", label: "Onaylandı" }, { value: "REJECTED", label: "Reddedildi" }, { value: "", label: "Tümü" }]} onChange={setStatus} />
    {query.isPending ? <Skeleton /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : !items.length ? <Text variant="muted">Başvuru bulunamadı.</Text> : <View className="gap-2">{items.map(item => <Card key={item.id} className="border-[#e0e3ec]">
      <Text variant="heading">{item.firstName} {item.lastName}</Text><Text>{item.universityName} · {item.departmentName}</Text><Text variant="muted">{item.status} · {item.submittedAt ? new Date(item.submittedAt).toLocaleString("tr-TR") : ""}</Text>
      {item.id && <Button label="Başvuruyu incele" variant="secondary" onPress={() => router.push({ pathname: "/manager/applications/[id]", params: { id: item.id! } })} />}
    </Card>)}</View>}
    {query.hasNextPage && <Button label="Daha fazla göster" variant="secondary" pending={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}
  </ManagerPage>;
}
export function ManagerApplicationDetailScreen() {
  const parsed = idParams.safeParse(useLocalSearchParams());
  return parsed.success ? <Application id={parsed.data.id} /> : <ManagerPage title="Başvuru"><ErrorState error={null} /></ManagerPage>;
}
function Application({ id }: { id: string }) {
  const [selected, setSelected] = useState<"APPROVED" | "REJECTED" | null>(null);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["manager", "application", id], queryFn: ({ signal }) => api.call("get", "/api/manager/tanidik-applications/{id}", { params: { id }, authenticated: true, signal }) });
  const mutation = useMutation({ mutationFn: (body: { reason: string }) => api.call("put", "/api/manager/tanidik-applications/{id}/decision", { params: { id }, body: { status: selected!, reason: body.reason, version: query.data?.version }, authenticated: true }), onSuccess: async () => { setSelected(null); await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ["manager", "applications"] })]); } });
  const data = query.data;
  return <ManagerPage title="Başvuru incelemesi"><Button label="← Başvurulara dön" variant="secondary" onPress={() => router.push("/manager/applications")} />
    {query.isPending ? <Skeleton /> : query.isError && !data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : data && <>
      <Card className="border-[#e0e3ec]"><Text variant="heading">{data.firstName} {data.lastName}</Text><Text>{data.universityName} · {data.departmentName}</Text><Text variant="muted">{data.educationStatus} · {data.graduationYear || "—"} · {data.status}</Text><Text>{data.coverLetter}</Text>
        <Text variant="muted">Gönderim: {data.submittedAt ? new Date(data.submittedAt).toLocaleString("tr-TR") : "—"}</Text>
        {data.reviewedAt && <Text variant="muted">İnceleme: {new Date(data.reviewedAt).toLocaleString("tr-TR")} · {data.reviewedBy || "—"}</Text>}
        {!!data.rejectionReason && <Text>Gerekçe: {data.rejectionReason}</Text>}</Card>
      {data.applicantId && <Button label="Kullanıcı detayını aç" variant="secondary" onPress={() => router.push({ pathname: "/manager/users/[id]", params: { id: data.applicantId! } })} />}
      {data.applicantId && <Button label="Başvuru geçmişi" variant="secondary" onPress={() => router.push({ pathname: "/manager/users/[id]/applications", params: { id: data.applicantId! } })} />}
      {data.status === "PENDING" && <View className="flex-row flex-wrap gap-2"><Button label="Onayla" onPress={() => setSelected("APPROVED")} /><Button label="Reddet" variant="danger" onPress={() => setSelected("REJECTED")} /></View>}
      <BottomSheet visible={!!selected} title={selected === "APPROVED" ? "Başvuruyu onayla" : "Başvuruyu reddet"} close={() => { if (!mutation.isPending) setSelected(null); }}>
        <Text>Karar gerekçesi işlem geçmişinde saklanır.</Text><FeatureForm schema={decision} defaults={{ reason: "" }} fields={[{ name: "reason", label: "Gerekçe", multiline: true }]} label="Kararı kaydet" submit={body => mutation.mutateAsync(body)} />
        {mutation.isError && <ErrorState error={mutation.error} />}
      </BottomSheet>
    </>}
  </ManagerPage>;
}
