import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Choice } from "@/components/ui/choice";
import { Page } from "@/components/ui/page";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import type { Schema } from "@/lib/api/types";

type Counts = Schema["LabelCountResponse"][];
const number = (value?: number | null) => value == null ? "—" : value.toLocaleString("tr-TR");
function Distribution({ title, items, onItem }: { title: string; items?: Counts; onItem?: (label: string) => void }) {
  const rows = (items ?? []).slice(0, 12);
  const max = Math.max(1, ...rows.map(item => item.count ?? 0));
  return <Card><Text variant="heading">{title}</Text>{rows.length ? rows.map(item => <Pressable key={item.label} disabled={!onItem || !item.label} accessibilityRole={onItem ? "link" : undefined} onPress={() => item.label && onItem?.(item.label)} className="min-h-11 justify-center gap-1 py-1">
    <View className="flex-row justify-between gap-2"><Text className="min-w-0 flex-1 text-caption">{item.label}</Text><Text className="text-caption font-semibold">{number(item.count)}</Text></View>
    <View className="h-2 rounded-full bg-primary-soft"><View style={{ width: `${Math.max(2, (item.count ?? 0) / max * 100)}%` }} className="h-2 rounded-full bg-primary" /></View>
  </Pressable>) : <Text variant="muted">Veri bulunamadı.</Text>}</Card>;
}
function Metric({ label, value }: { label: string; value?: number }) {
  return <View className="w-[48%] gap-1 rounded-control border border-border bg-surface p-3"><Text variant="muted">{label}</Text><Text variant="heading">{number(value)}</Text></View>;
}
export function StatisticsScreen() {
  const query = useQuery({ queryKey: ["catalog", "statistics", "overview"], queryFn: ({ signal }) => api.call("get", "/api/statistics/overview", { signal }), staleTime: 60_000 });
  const [selected, setSelected] = useState("undergraduate");
  const data = query.data;
  const datasets = [
    { value: "undergraduate", label: "En popüler 10 lisans programı", items: data?.topUndergraduatePrograms },
    { value: "associate", label: "En popüler 10 ön lisans programı", items: data?.topAssociatePrograms },
    { value: "placed", label: "En çok öğrenci yerleşen 10 üniversite", items: data?.universitiesByPlaced },
    { value: "programs", label: "En fazla programı olan 10 üniversite", items: data?.universitiesByProgramCount },
  ];
  return <Page title="Yükseköğretim istatistikleri" refresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <Text>Üniversiteleri, programları ve son yıllardaki yerleşme verilerini tek yerde incele.</Text>
    {query.isPending ? <Skeleton /> : query.isError && !data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : data && <>
      <View className="flex-row flex-wrap justify-between gap-y-2">
        <Metric label="Üniversite" value={data.universityCount} /><Metric label="Program" value={data.programCount} />
        <Metric label="Yerleştirme seçeneği" value={data.optionCount} /><Metric label="Başarı sırası bulunan" value={data.rankedOptionCount} />
      </View>
      <Text variant="heading">Türkiye kataloğunu keşfet</Text>
      <Text variant="muted">Bir görünüm seç; sonuçlar YÖK katalog ve yerleşen verilerinden hesaplanır.</Text>
      <Choice label="Görünüm" value={selected} options={datasets.map(item => ({ value: item.value, label: item.label }))} onChange={setSelected} />
      <Distribution title={datasets.find(item => item.value === selected)?.label ?? datasets[0].label} items={datasets.find(item => item.value === selected)?.items} />
      <Distribution title="Üniversite türleri" items={data.institutionTypes} />
      <Distribution title="Program düzeyleri" items={data.degreeLevels} />
      <Distribution title="Puan türleri" items={data.scoreTypes} />
      <Distribution title="En çok üniversite bulunan şehirler" items={data.cities} onItem={city => router.push({ pathname: "/city/[city]", params: { city } })} />
      <Text variant="heading">Yıllara göre görünüm</Text>
      <ScrollView horizontal accessibilityLabel="Yıllara göre kontenjan ve yerleşme istatistikleri"><View className="gap-2">
        <View className="flex-row gap-2 border-b border-border pb-2">{["Yıl", "Seçenek", "Kontenjan", "Yerleşen", "Doluluk", "Tercih"].map(label => <Text key={label} className="w-20 text-caption font-semibold">{label}</Text>)}</View>
        {[...(data.yearly ?? [])].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).map(row => <View key={row.year} className="flex-row gap-2 border-b border-border pb-2">{[row.year, row.programCount, row.quota, row.placed, row.fillRate == null ? "—" : `%${number(row.fillRate)}`, row.preferences].map((value, index) => <Text key={index} className="w-20 text-caption">{typeof value === "number" ? number(value) : value}</Text>)}</View>)}
      </View></ScrollView>
      <Text variant="muted">Kaynak: Resmî YÖK Atlas katalog ve yerleşme verileri{data.lastSynchronizedAt ? ` · Son aktarım ${new Date(data.lastSynchronizedAt).toLocaleDateString("tr-TR")}` : ""}.</Text>
    </>}
  </Page>;
}
