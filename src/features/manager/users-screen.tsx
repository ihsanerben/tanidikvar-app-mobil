import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { nextPage } from "@/lib/query/pagination";
import type { Schema } from "@/lib/api/types";

type Filters = { q: string; status: string; authority: string; educationStatus: string; sort: string };
const empty: Filters = { q: "", status: "ALL", authority: "ALL", educationStatus: "ALL", sort: "CREATED_DESC" };
function UserRow({ user }: { user: Schema["ManagedUserResponse"] }) {
  return <Pressable accessibilityRole="link" onPress={() => user.id && router.push({ pathname: "/manager/users/[id]", params: { id: user.id } })} className="mx-gutter mb-2 min-h-16 gap-1 rounded-card border border-manager-border bg-surface p-3 active:opacity-80">
    <View className="flex-row items-start justify-between gap-2"><Text variant="heading" className="min-w-0 flex-1 text-manager-text">{user.name || user.email}</Text><Text className="text-metadata text-[#6a499e]">⋯</Text></View>
    <Text variant="muted">{user.email}</Text><Text variant="muted">{user.authority || "Üye"} · {user.educationStatus || "Eğitim yok"} · {user.deletedAt ? "Pasif" : "Aktif"}</Text>
  </Pressable>;
}
export function ManagerUsersScreen() {
  const [draft, setDraft] = useState<Filters>(empty);
  const [filters, setFilters] = useState<Filters>(empty);
  const query = useInfiniteQuery({
    queryKey: ["manager", "users", filters], initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.call("get", "/api/manager/users", { query: {
      q: filters.q || undefined, status: filters.status === "ALL" ? undefined : filters.status,
      authority: filters.authority === "ALL" ? undefined : filters.authority,
      educationStatus: filters.educationStatus === "ALL" ? undefined : filters.educationStatus,
      sort: filters.sort, page: pageParam, size: 20,
    }, authenticated: true, signal }), getNextPageParam: nextPage,
  });
  const items = query.data?.pages.flatMap(page => page.items ?? []) ?? [];
  return <FlashList showsVerticalScrollIndicator={false} data={items} keyExtractor={item => item.id!} renderItem={({ item }) => <UserRow user={item} />}
    ListHeaderComponent={<View className="gap-3 px-gutter py-5"><Text variant="title" className="text-manager-text">Kullanıcı yönetimi</Text>
      <FormField label="Kullanıcı ara" value={draft.q} onChangeText={q => setDraft(old => ({ ...old, q }))} onSubmitEditing={() => setFilters(draft)} />
      <Select label="Durum" value={draft.status} options={[{ value: "ALL", label: "Tümü" }, { value: "VISIBLE", label: "Aktif" }, { value: "HIDDEN", label: "Pasif" }]} onChange={status => setDraft(old => ({ ...old, status }))} />
      <Select label="Yetki" value={draft.authority} options={[{ value: "ALL", label: "Tümü" }, { value: "MEMBER", label: "Üye" }, { value: "TANIDIK", label: "Tanıdık" }, { value: "MANAGER", label: "Manager" }]} onChange={authority => setDraft(old => ({ ...old, authority }))} />
      <Select label="Eğitim" value={draft.educationStatus} options={[{ value: "ALL", label: "Tümü" }, { value: "YKS_ADAYI", label: "YKS adayı" }, { value: "UNIVERSITE_OGRENCISI", label: "Öğrenci" }, { value: "MEZUN", label: "Mezun" }]} onChange={educationStatus => setDraft(old => ({ ...old, educationStatus }))} />
      <Select label="Sırala" value={draft.sort} options={[{ value: "CREATED_DESC", label: "Kayıt: yeniden eskiye" }, { value: "CREATED_ASC", label: "Kayıt: eskiden yeniye" }, { value: "LAST_LOGIN_DESC", label: "Son giriş: yeniden eskiye" }, { value: "LAST_LOGIN_ASC", label: "Son giriş: eskiden yeniye" }]} onChange={sort => setDraft(old => ({ ...old, sort }))} />
      <Button label="Filtrele" onPress={() => setFilters(draft)} /><Text variant="muted">{query.data?.pages[0]?.totalElements ?? 0} kullanıcı</Text>
    </View>}
    ListEmptyComponent={query.isPending ? <Skeleton /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : <EmptyState title="Kullanıcı bulunamadı" />}
    ListFooterComponent={<View className="px-gutter pb-8">{query.hasNextPage && <Button label="Daha fazla göster" variant="secondary" pending={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}</View>}
    onEndReached={() => { if (query.hasNextPage && !query.isFetching) void query.fetchNextPage(); }} onEndReachedThreshold={0.4}
    refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} />;
}
