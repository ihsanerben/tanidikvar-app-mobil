import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { AppFooter } from "@/components/ui/app-footer";

type Item = { id?: string; title?: string; subtitle?: string; open: () => void };
function Group({ title, count, items, pending, error, retry }: { title: string; count?: number; items?: Item[]; pending: boolean; error: boolean; retry: () => void }) {
  return <View className="gap-2"><Text variant="heading">{title}{count === undefined ? "" : ` (${count})`}</Text>
    {pending ? <Text variant="muted">Yükleniyor…</Text> : error ? <Button label="Tekrar dene" variant="secondary" onPress={retry} /> : !items?.length ? <Text variant="muted">Sonuç bulunamadı.</Text> : items.map(item => <Card key={item.id}>
      <Pressable accessibilityRole="link" accessibilityLabel={item.title} onPress={item.open} className="min-h-11 justify-center"><Text variant="heading">{item.title}</Text></Pressable>
      {!!item.subtitle && <Text variant="muted">{item.subtitle}</Text>}
    </Card>)}
  </View>;
}
export function SearchOverview({ q, header }: { q: string; header: React.ReactElement }) {
  const enabled = !!q.trim();
  const universities = useQuery({ queryKey: ["search", q, "universities"], enabled, queryFn: ({ signal }) => api.call("get", "/api/universities", { query: { q, page: 0, size: 8 }, signal }) });
  const programs = useQuery({ queryKey: ["search", q, "programs"], enabled, queryFn: ({ signal }) => api.call("get", "/api/catalog-programs", { query: { q, page: 0, size: 8 }, signal }) });
  const questions = useQuery({ queryKey: ["search", q, "questions"], enabled, queryFn: ({ signal }) => api.call("get", "/api/questions", { query: { q, page: 0, size: 8 }, signal }) });
  const people = useQuery({ queryKey: ["search", q, "people"], enabled, queryFn: ({ signal }) => api.call("get", "/api/tanidiklar", { query: { q, page: 0, size: 8 }, signal }) });
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 pb-10">{header}
    {enabled && <>
      <Group title="Üniversiteler" count={universities.data?.totalElements} pending={universities.isPending} error={universities.isError} retry={() => void universities.refetch()} items={universities.data?.items?.map(item => ({ id: item.id, title: item.name, subtitle: item.city, open: () => item.id && router.push({ pathname: "/universities/[id]", params: { id: item.id } }) }))} />
      <Group title="Programlar" count={programs.data?.totalElements} pending={programs.isPending} error={programs.isError} retry={() => void programs.refetch()} items={programs.data?.items?.map(item => ({ id: item.id, title: item.name, subtitle: [item.universityName, item.city].filter(Boolean).join(" · "), open: () => item.id && router.push({ pathname: "/programs/[id]", params: { id: item.id } }) }))} />
      <Group title="Sorular" count={questions.data?.totalElements} pending={questions.isPending} error={questions.isError} retry={() => void questions.refetch()} items={questions.data?.items?.map(item => ({ id: item.id, title: item.title, open: () => item.id && router.push({ pathname: "/questions/[id]", params: { id: item.id } }) }))} />
      <Group title="Tanıdıklar" count={people.data?.totalElements} pending={people.isPending} error={people.isError} retry={() => void people.refetch()} items={people.data?.items?.map(item => ({ id: item.id, title: item.name, subtitle: [item.universityName, item.departmentName].filter(Boolean).join(" · "), open: () => item.id && router.push({ pathname: "/profiles/[id]", params: { id: item.id } }) }))} />
    </>}
    <AppFooter />
  </ScrollView>;
}
