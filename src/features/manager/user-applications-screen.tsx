import { statusLabels } from "./labels";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import { ManagerList } from "./manager-list";
import { ManagerPage } from "./manager-shell";

const params = z.object({ id: z.uuid() });
export function ManagerUserApplicationsScreen() {
  const parsed = params.safeParse(useLocalSearchParams());
  return parsed.success ? <History id={parsed.data.id} /> : <ManagerPage title="Başvuru geçmişi"><ErrorState error={null} /></ManagerPage>;
}
function History({ id }: { id: string }) {
  const query = useInfiniteQuery({ queryKey: ["manager", "user", id, "applications"], initialPageParam: 0, queryFn: ({ pageParam, signal }) => api.call("get", "/api/manager/users/{id}/applications", { params: { id }, query: { page: pageParam, size: 20 }, authenticated: true, signal }), getNextPageParam: nextPage });
  return <ManagerList title="Başvuru geçmişi" query={query} header={<Button label="← Kullanıcıya dön" variant="secondary" onPress={() => router.push({ pathname: "/manager/users/[id]", params: { id } })} />} renderItem={({item})=><Card  className="border-manager-border">
      <Text variant="heading">{item.firstName} {item.lastName}</Text><Text>{item.universityName} · {item.departmentName}</Text><Text variant="muted">{statusLabels[item.status ?? ""] ?? item.status} · {item.submittedAt ? new Date(item.submittedAt).toLocaleString("tr-TR") : ""}</Text>
      {!!item.rejectionReason && <Text>Gerekçe: {item.rejectionReason}</Text>}
      {item.id && <Button label="Başvuruyu incele" variant="secondary" onPress={() => router.push({ pathname: "/manager/applications/[id]", params: { id: item.id! } })} />}
    </Card>} />;
}
