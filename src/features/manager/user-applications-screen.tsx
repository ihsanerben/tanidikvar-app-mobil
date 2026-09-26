import { useInfiniteQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import { ManagerPage } from "./manager-shell";

const params = z.object({ id: z.uuid() });
export function ManagerUserApplicationsScreen() {
  const parsed = params.safeParse(useLocalSearchParams());
  return parsed.success ? <History id={parsed.data.id} /> : <ManagerPage title="Başvuru geçmişi"><ErrorState error={null} /></ManagerPage>;
}
function History({ id }: { id: string }) {
  const query = useInfiniteQuery({ queryKey: ["manager", "user", id, "applications"], initialPageParam: 0, queryFn: ({ pageParam, signal }) => api.call("get", "/api/manager/users/{id}/applications", { params: { id }, query: { page: pageParam, size: 20 }, authenticated: true, signal }), getNextPageParam: nextPage });
  const items = query.data?.pages.flatMap(page => page.items ?? []) ?? [];
  return <ManagerPage title="Başvuru geçmişi">
    <Button label="← Kullanıcıya dön" variant="secondary" onPress={() => router.push({ pathname: "/manager/users/[id]", params: { id } })} />
    {query.isPending ? <Skeleton /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : !items.length ? <Text variant="muted">Bu kullanıcıya ait başvuru bulunamadı.</Text> : <View className="gap-2">{items.map(item => <Card key={item.id} className="border-[#e0e3ec]">
      <Text variant="heading">{item.firstName} {item.lastName}</Text><Text>{item.universityName} · {item.departmentName}</Text><Text variant="muted">{item.status} · {item.submittedAt ? new Date(item.submittedAt).toLocaleString("tr-TR") : ""}</Text>
      {!!item.rejectionReason && <Text>Gerekçe: {item.rejectionReason}</Text>}
      {item.id && <Button label="Başvuruyu incele" variant="secondary" onPress={() => router.push({ pathname: "/manager/applications/[id]", params: { id: item.id! } })} />}
    </Card>)}</View>}
    {query.hasNextPage && <Button label="Daha fazla göster" variant="secondary" pending={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}
  </ManagerPage>;
}
