import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Page } from "@/components/ui/page";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import { ProgramCard, UniversityCard } from "./cards";

const params = z.object({ city: z.string().trim().min(1).max(100) });
export function CityScreen() {
  const parsed = params.safeParse(useLocalSearchParams());
  return parsed.success ? <City city={parsed.data.city} /> : <Page title="Şehir kataloğu"><ErrorState error={null} /></Page>;
}
function City({ city }: { city: string }) {
  const universities = useQuery({ queryKey: ["catalog", "city", city, "universities"], queryFn: ({ signal }) => api.call("get", "/api/universities", { query: { city, page: 0, size: 100 }, signal }) });
  const programs = useQuery({ queryKey: ["catalog", "city", city, "programs"], queryFn: ({ signal }) => api.call("get", "/api/catalog-programs", { query: { city, page: 0, size: 24 }, signal }) });
  return <Page title={`${city} üniversiteleri ve programları`} refresh={() => { void universities.refetch(); void programs.refetch(); }} refreshing={universities.isRefetching || programs.isRefetching}>
    <Text variant="muted">Şehir kataloğu</Text>
    <Text>{universities.data?.totalElements ?? 0} üniversite · {programs.data?.totalElements ?? 0} program</Text>
    <Text variant="heading">Üniversiteler</Text>
    {universities.isPending ? <Skeleton /> : universities.isError && !universities.data ? <ErrorState error={universities.error} retry={() => void universities.refetch()} /> : universities.data?.items?.length ? <View className="gap-list-gap">{universities.data.items.map(item => <UniversityCard key={item.id} item={item} />)}</View> : <Text variant="muted">Bu şehirde üniversite bulunamadı.</Text>}
    <Text variant="heading">Programlar</Text>
    {programs.isPending ? <Skeleton /> : programs.isError && !programs.data ? <ErrorState error={programs.error} retry={() => void programs.refetch()} /> : programs.data?.items?.length ? <View className="gap-list-gap">{programs.data.items.map(item => <ProgramCard key={item.id} item={item} />)}</View> : <Text variant="muted">Bu şehirde program bulunamadı.</Text>}
    <Button label="Tüm programları filtrele" variant="secondary" onPress={() => router.push({ pathname: "/kesfet", params: { kind: "programs", city } })} />
  </Page>;
}
