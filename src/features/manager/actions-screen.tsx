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
import { ManagerPage } from "./manager-shell";

type Filters = { q: string; action: string; targetType: string; dateFrom: string; dateTo: string };
const initial: Filters = { q: "", action: "", targetType: "", dateFrom: "", dateTo: "" };
export function ManagerActionsScreen() {
  const [draft, setDraft] = useState<Filters>(initial);
  const [filters, setFilters] = useState<Filters>(initial);
  const query = useInfiniteQuery({ queryKey: ["manager", "actions", filters], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.call("get", "/api/manager/actions", { query: { q: filters.q || undefined, action: filters.action || undefined, targetType: filters.targetType || undefined, dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined, page: pageParam, size: 20 }, authenticated: true, signal }), getNextPageParam: nextPage });
  const items = query.data?.pages.flatMap(page => page.items ?? []) ?? [];
  return <ManagerPage title="İşlem geçmişi">
    <FormField label="Aktör, hedef veya gerekçe ara" value={draft.q} onChangeText={q => setDraft(old => ({ ...old, q }))} />
    <FormField label="İşlem türü" value={draft.action} onChangeText={action => setDraft(old => ({ ...old, action }))} />
    <FormField label="Hedef türü" value={draft.targetType} onChangeText={targetType => setDraft(old => ({ ...old, targetType }))} />
    <FormField label="Başlangıç (YYYY-MM-DD)" value={draft.dateFrom} onChangeText={dateFrom => setDraft(old => ({ ...old, dateFrom }))} />
    <FormField label="Bitiş (YYYY-MM-DD)" value={draft.dateTo} onChangeText={dateTo => setDraft(old => ({ ...old, dateTo }))} />
    <Button label="Filtrele" onPress={() => setFilters(draft)} /><Text variant="muted">{query.data?.pages[0]?.totalElements ?? 0} işlem</Text>
    {query.isPending ? <Skeleton /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : items.length ? items.map(item => <Card key={item.id} className="gap-2 border-[#e0e3ec]">
      <Text variant="heading">{item.action || "İşlem"}</Text><Text>{item.targetType || "Hedef"} · {item.targetId || "—"}</Text>
      <Text variant="muted">{item.occurredAt ? new Date(item.occurredAt).toLocaleString("tr-TR") : "—"}</Text>
      {item.id && <Button label="İşlem detayını aç" variant="secondary" onPress={() => router.push({ pathname: "/manager/actions/[id]", params: { id: item.id! } })} />}
    </Card>) : <EmptyState title="İşlem bulunamadı" />}
    {query.hasNextPage && <Button label="Daha fazla göster" variant="secondary" pending={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}
  </ManagerPage>;
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
    {query.isPending ? <Skeleton /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : action ? <Card className="gap-2 border-[#e0e3ec]">
      <Text variant="heading">{action.action}</Text><Text>Aktör: {query.data?.actorName || action.actorId || "—"}</Text>
      <Text>Hedef: {action.targetType || "—"} · {action.targetId || "—"}</Text><Text>Gerekçe: {action.reason || "Belirtilmedi"}</Text>
      <Text variant="muted">{action.occurredAt ? new Date(action.occurredAt).toLocaleString("tr-TR") : "—"}</Text>
    </Card> : <EmptyState title="İşlem bulunamadı" />}
  </ManagerPage>;
}
