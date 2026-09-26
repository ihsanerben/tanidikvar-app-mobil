import { actionLabels, targetLabels } from "./labels";
import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import { View } from "react-native";
import { Select } from "@/components/ui/select";
import { ManagerList } from "./manager-list";
import { ManagerPage } from "./manager-shell";

type Filters = { q: string; action: string; targetType: string; dateFrom: string; dateTo: string };
const initial: Filters = { q: "", action: "", targetType: "", dateFrom: "", dateTo: "" };
export function ManagerActionsScreen() {
  const [draft, setDraft] = useState<Filters>(initial);
  const [filters, setFilters] = useState<Filters>(initial);
  const query = useInfiniteQuery({ queryKey: ["manager", "actions", filters], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.call("get", "/api/manager/actions", { query: { q: filters.q || undefined, action: filters.action || undefined, targetType: filters.targetType || undefined, dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined, page: pageParam, size: 20 }, authenticated: true, signal }), getNextPageParam: nextPage });
  return <ManagerList title="İşlem geçmişi" query={query} header={<View className="gap-3">    <FormField label="Aktör, hedef veya gerekçe ara" value={draft.q} onChangeText={q => setDraft(old => ({ ...old, q }))} />
    <Select label="İşlem türü" value={draft.action} onChange={action => setDraft(old => ({ ...old, action }))} options={[{value:"",label:"Tümü"},...Object.entries(actionLabels).map(([value,label])=>({value,label}))]} />
    <Select label="Hedef türü" value={draft.targetType} onChange={targetType => setDraft(old => ({ ...old, targetType }))} options={[{value:"",label:"Tümü"},...Object.entries(targetLabels).map(([value,label])=>({value,label}))]} />
    <FormField label="Başlangıç (YYYY-MM-DD)" value={draft.dateFrom} onChangeText={dateFrom => setDraft(old => ({ ...old, dateFrom }))} />
    <FormField label="Bitiş (YYYY-MM-DD)" value={draft.dateTo} onChangeText={dateTo => setDraft(old => ({ ...old, dateTo }))} />
    <Button label="Filtrele" onPress={() => setFilters(draft)} /><Text variant="muted">{query.data?.pages[0]?.totalElements ?? 0} işlem</Text>
</View>} renderItem={({item})=><Card  className="gap-2 border-manager-border">
      <Text variant="heading">{actionLabels[item.action ?? ""] ?? item.action ?? "İşlem"}</Text><Text>{targetLabels[item.targetType ?? ""] ?? item.targetType ?? "Hedef"} · {item.targetId || "—"}</Text>
      <Text variant="muted">{item.occurredAt ? new Date(item.occurredAt).toLocaleString("tr-TR") : "—"}</Text>
      {item.id && <Button label="İşlem detayını aç" variant="secondary" onPress={() => router.push({ pathname: "/manager/actions/[id]", params: { id: item.id! } })} />}
    </Card>} empty={<EmptyState title="İşlem bulunamadı" />} />;
}
const idParams = z.object({ id: z.uuid() });
export function ManagerActionDetailScreen() {
  const parsed = idParams.safeParse(useLocalSearchParams());
  return parsed.success ? <ActionDetail id={parsed.data.id} /> : <ManagerPage title="İşlem detayı"><ErrorState error={null} /></ManagerPage>;
}
function ActionDetail({ id }: { id: string }) {
  const query = useQuery({ queryKey: ["manager", "action", id], queryFn: ({ signal }) => api.call("get", "/api/manager/actions/{id}", { params: { id }, authenticated: true, signal }) });
  const action = query.data?.action;
  return <ManagerPage title="İşlem detayı"><Button label="← İşlem geçmişine dön" variant="secondary" onPress={() => router.push("/manager/actions")} />
    {query.isPending ? <Skeleton /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : action ? <Card className="gap-2 border-manager-border">
      <Text variant="heading">{actionLabels[action.action ?? ""] ?? action.action}</Text><Text>Aktör: {query.data?.actorName || action.actorId || "—"}</Text>
      <Text>Hedef: {targetLabels[action.targetType ?? ""] ?? action.targetType ?? "—"} · {action.targetId || "—"}</Text><Text>Gerekçe: {action.reason || "Belirtilmedi"}</Text>
      <Text variant="muted">{action.occurredAt ? new Date(action.occurredAt).toLocaleString("tr-TR") : "—"}</Text>
    </Card> : <EmptyState title="İşlem bulunamadı" />}
  </ManagerPage>;
}
