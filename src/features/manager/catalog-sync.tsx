import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { View } from "react-native";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";

const running = new Set(["STARTED", "PENDING", "RUNNING"]);
export function ManagerCatalogSync() {
  const client = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [action, setAction] = useState<"preview" | "apply" | null>(null);
  const history = useQuery({ queryKey: ["manager", "catalog-sync", "history"], queryFn: ({ signal }) => api.call("get", "/api/manager/catalog/dataset-sync", { authenticated: true, signal }) });
  const pollingId = activeId ?? (running.has(history.data?.[0]?.status ?? "") ? history.data?.[0]?.id : null);
  const current = useQuery({ queryKey: ["manager", "catalog-sync", pollingId], enabled: !!pollingId,
    queryFn: ({ signal }) => api.call("get", "/api/manager/catalog/dataset-sync/{id}", { params: { id: pollingId! }, authenticated: true, signal }),
    refetchInterval: query => running.has(query.state.data?.status ?? "") ? 2000 : false });
  const mutation = useMutation({ mutationFn: (kind: "preview" | "apply") => kind === "preview"
    ? api.call("post", "/api/manager/catalog/dataset-sync/preview", { authenticated: true })
    : api.call("post", "/api/manager/catalog/dataset-sync", { authenticated: true }),
    onSuccess: async response => { setAction(null); if (response.id) setActiveId(response.id); await client.invalidateQueries({ queryKey: ["manager", "catalog-sync", "history"] }); } });
  const run = current.data ?? history.data?.[0];
  return <Card className="gap-3 border-manager-border"><Text variant="heading">YÖK katalog senkronizasyonu</Text>
    <Text variant="muted">Önizleme kaynak veriyi denetler. Aktarım doğrulanan veriyi kataloğa uygular.</Text>
    <View className="flex-row flex-wrap gap-2"><Button label="Önizleme başlat" variant="secondary" disabled={mutation.isPending || running.has(run?.status ?? "")} onPress={() => setAction("preview")} /><Button label="Aktarımı başlat" disabled={mutation.isPending || running.has(run?.status ?? "")} onPress={() => setAction("apply")} /></View>
    {history.isPending && <Skeleton />}{history.isError && <ErrorState error={history.error} retry={() => void history.refetch()} />}
    {run && <View className="gap-1"><Text>{run.operation || "Senkronizasyon"} · {run.status || "Bilinmiyor"}</Text>
      <Text variant="muted">{run.universitiesSeen ?? 0} üniversite · {run.programsSeen ?? 0} program · {run.optionsSeen ?? 0} tercih seçeneği</Text>
      {run.qualityReport && <Card className="gap-1 border-manager-border"><Text variant="heading">Kalite raporu</Text>
        <Text>{run.qualityReport.cityCount ?? 0} şehir · {run.qualityReport.programFamilyCount ?? 0} program ailesi · {run.qualityReport.optionCount ?? 0} seçenek</Text>
        <Text variant="muted">Akademik birimi olmayan: {run.qualityReport.optionsWithoutAcademicUnit ?? 0} · Başarı sırası olmayan: {run.qualityReport.optionsWithoutCurrentSuccessRank ?? 0}</Text>
        <Text variant="muted">Yeni üniversite: {run.qualityReport.newUniversityCount ?? 0} · Ad çakışması: {run.qualityReport.manualNameCollisionCount ?? 0}</Text>
      </Card>}
      {!!run.failureReason && <Text accessibilityRole="alert">{run.failureReason}</Text>}
      {!!run.snapshotChecksum && <Text variant="muted">Snapshot: {run.snapshotChecksum}</Text>}
    </View>}
    {current.isError && <ErrorState error={current.error} retry={() => void current.refetch()} />}
    {!!history.data?.length && <><Text variant="heading">Geçmiş çalışmalar</Text>{history.data.map(item => <View key={item.id} className="gap-1 border-b border-manager-border py-2"><Text>{item.operation || "Senkronizasyon"} · {item.status || "—"}</Text><Text variant="muted">{item.startedAt ? new Date(item.startedAt).toLocaleString("tr-TR") : "—"} · {item.universitiesSeen ?? 0} üniversite · {item.optionsSeen ?? 0} seçenek</Text></View>)}</>}
    <BottomSheet visible={!!action} title={action === "preview" ? "Katalog önizlemesi" : "Katalog aktarımı"} close={() => { if (!mutation.isPending) setAction(null); }}>
      <Text>{action === "preview" ? "YÖK kaynağı kontrol edilerek önizleme çalıştırılır." : "YÖK kaynağındaki güncel veri doğrulandıktan sonra canlı kataloğa uygulanır."}</Text>
      <Button label={action === "preview" ? "Önizlemeyi başlat" : "Aktarımı başlat"} pending={mutation.isPending} onPress={() => action && mutation.mutate(action)} />
      {mutation.isError && <ErrorState error={mutation.error} />}
    </BottomSheet>
  </Card>;
}
