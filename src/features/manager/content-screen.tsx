import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/ui/choice";
import { FormField } from "@/components/ui/form-field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";

type Filters = { q: string; kind: string; status: string };
const initial: Filters = { q: "", kind: "ALL", status: "ALL" };
export function ManagerContentScreen() {
  const [draft, setDraft] = useState<Filters>(initial);
  const [filters, setFilters] = useState<Filters>(initial);
  const query = useInfiniteQuery({
    queryKey: ["manager", "content", filters], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.call("get", "/api/manager/content", { query: {
      q: filters.q || undefined, kind: filters.kind === "ALL" ? undefined : filters.kind,
      status: filters.status === "ALL" ? undefined : filters.status, page: pageParam, size: 20,
    }, authenticated: true, signal }), getNextPageParam: nextPage,
  });
  const items = query.data?.pages.flatMap(page => page.items ?? []) ?? [];
  return <FlashList data={items} keyExtractor={(item, index) => item.id ?? String(index)} renderItem={({ item }) => <Pressable accessibilityRole="link" onPress={() => { const id = item.questionId || (item.kind === "QUESTION" ? item.id : undefined); if (id) router.push({ pathname: "/manager/questions/[id]", params: { id } }); }} className="mx-gutter mb-2 min-h-16 gap-1 rounded-card border border-[#e0e3ec] bg-surface p-3">
    <View className="flex-row justify-between gap-2"><Text variant="heading" className="min-w-0 flex-1">{item.title || (item.kind === "QUESTION" ? "Soru" : "Yorum")}</Text><Text variant="muted">{item.kind}</Text></View>
    <Text numberOfLines={2}>{item.body}</Text><Text variant="muted">{item.authorName || "Üye"} · {item.deletedAt ? "Silinmiş" : item.moderatedAt ? "Gizlenmiş" : "Görünür"}</Text>
  </Pressable>}
    ListHeaderComponent={<View className="gap-3 px-gutter py-5"><Text variant="title" className="text-[#202638]">İçerik yönetimi</Text>
      <FormField label="İçerikte ara" value={draft.q} onChangeText={q => setDraft(old => ({ ...old, q }))} onSubmitEditing={() => setFilters(draft)} />
      <Choice label="Tür" value={draft.kind} options={[{ value: "ALL", label: "Tümü" }, { value: "QUESTION", label: "Sorular" }, { value: "COMMUNITY", label: "Topluluk yorumları" }, { value: "TANIDIK", label: "Tanıdık yorumları" }]} onChange={kind => setDraft(old => ({ ...old, kind }))} />
      <Choice label="Durum" value={draft.status} options={[{ value: "ALL", label: "Tümü" }, { value: "VISIBLE", label: "Görünür" }, { value: "HIDDEN", label: "Gizli" }]} onChange={status => setDraft(old => ({ ...old, status }))} />
      <Button label="Filtrele" onPress={() => setFilters(draft)} /><Text variant="muted">{query.data?.pages[0]?.totalElements ?? 0} içerik</Text>
    </View>}
    ListEmptyComponent={query.isPending ? <Skeleton /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : <EmptyState title="İçerik bulunamadı" />}
    ListFooterComponent={<View className="px-gutter pb-8">{query.hasNextPage && <Button label="Daha fazla göster" variant="secondary" pending={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}</View>}
    onEndReached={() => { if (query.hasNextPage && !query.isFetching) void query.fetchNextPage(); }} onEndReachedThreshold={0.4}
    refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} />;
}
