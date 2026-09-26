import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { ManagerPage } from "./manager-shell";

const metrics = [
  ["activeUsers", "Aktif kullanıcılar"], ["disabledUsers", "Pasif kullanıcılar"], ["activeAdmins", "Aktif Tanıdıklar"],
  ["pendingApplications", "Bekleyen başvurular"], ["activeQuestions", "Aktif sorular"], ["archivedQuestions", "Arşivlenmiş sorular"],
  ["hiddenQuestions", "Gizlenen sorular"], ["communityAnswers", "Topluluk yorumları"], ["adminAnswers", "Tanıdık yorumları"],
  ["likes", "Faydalı oylar"], ["views", "Görüntülenmeler"],
] as const;
const destinations = {
  activeUsers: "/manager/users", disabledUsers: "/manager/users", activeAdmins: "/manager/users",
  pendingApplications: "/manager/applications", activeQuestions: "/manager/content", archivedQuestions: "/manager/content",
  hiddenQuestions: "/manager/content", communityAnswers: "/manager/content", adminAnswers: "/manager/content",
  likes: "/manager/analytics", views: "/manager/analytics",
} as const;
export function ManagerDashboardScreen() {
  const query = useQuery({ queryKey: ["manager", "statistics"], queryFn: ({ signal }) => api.call("get", "/api/manager/statistics", { authenticated: true, signal }), staleTime: 30_000 });
  const actions = useQuery({ queryKey: ["manager", "actions", "recent"], queryFn: ({ signal }) => api.call("get", "/api/manager/actions", { query: { page: 0, size: 5 }, authenticated: true, signal }), staleTime: 30_000 });
  return <ManagerPage title="Platforma genel bakış">
    {query.isPending ? <Skeleton /> : query.isError && !query.data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : <View className="flex-row flex-wrap justify-between gap-y-2">
      {metrics.map(([key, label]) => <Pressable key={key} accessibilityRole="link" onPress={() => router.push(destinations[key])} className="min-h-28 w-[48%] justify-between gap-2 rounded-card border border-[#e0e3ec] bg-surface p-4">
        <Text className="text-caption font-semibold text-[#50546a]">{label}</Text><Text className="text-[24px] font-bold text-[#202638]">{(query.data?.[key] ?? 0).toLocaleString("tr-TR")}</Text>
      </Pressable>)}
    </View>}
    <Text variant="heading">Son işlemler</Text>
    {(actions.data?.items ?? []).map(item => <Card key={item.id} className="gap-1 border-[#e0e3ec]"><Text>{item.action || "İşlem"}</Text><Text variant="muted">{item.targetType || "—"} · {item.occurredAt ? new Date(item.occurredAt).toLocaleString("tr-TR") : "—"}</Text></Card>)}
    {actions.isError && <ErrorState error={actions.error} retry={() => void actions.refetch()} />}
    <Button label="Tüm işlemler" variant="secondary" onPress={() => router.push("/manager/actions")} />
    <Button label="İstatistikleri yenile" variant="secondary" onPress={() => void query.refetch()} />
  </ManagerPage>;
}
