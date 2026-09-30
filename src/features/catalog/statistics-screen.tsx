import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { router } from "expo-router";
import { Distribution } from "@/components/ui/distribution";
import { Metric } from "@/components/ui/metric";
import { DataTable } from "@/components/ui/data-table";
import { Tabs } from "@/components/ui/tabs";
import { Page } from "@/components/ui/page";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";


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
  return <Page compact title="Yükseköğretim istatistikleri" back={false} help="Üniversite ve program sayılarını, kontenjanları, yerleşen öğrenci sayılarını ve yıllara göre değişimleri inceleyebilirsin. Grafiklerdeki veriler YÖK Atlas kataloğundan alınır." refresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <Text className="text-caption">Üniversiteleri, programları ve son yıllardaki yerleşme verilerini tek yerde incele.</Text>
    {query.isPending ? <Skeleton /> : query.isError && !data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : data && <>
      <View className="flex-row gap-1"><Metric compact label="Üniversite" value={data.universityCount} /><Metric compact label="Program" value={data.programCount} /><Metric compact label="Seçenek" value={data.optionCount} /><Metric compact label="Sıralı" value={data.rankedOptionCount} /></View>
      <Text variant="label">Türkiye kataloğunu keşfet</Text>
      <Text variant="muted" className="text-caption">Bir görünüm seç; sonuçlar YÖK katalog ve yerleşen verilerinden hesaplanır.</Text>
      <Tabs compact variant="pills" label="Görünüm" value={selected} options={datasets.map(item => ({ value: item.value, label: item.label }))} onChange={setSelected} />
      <Distribution compact key={selected} donut title={datasets.find(item => item.value === selected)?.label ?? datasets[0].label} items={datasets.find(item => item.value === selected)?.items} />
      <View className="flex-row items-start gap-2"><View className="min-w-0 flex-1"><Distribution compact title="Üniversite türleri" items={data.institutionTypes} /></View><View className="min-w-0 flex-1"><Distribution compact title="Program düzeyleri" items={data.degreeLevels} /></View></View>
      <Distribution compact columns={2} title="Puan türleri" items={data.scoreTypes} />
      <Distribution compact columns={2} title="En çok üniversite bulunan şehirler" items={data.cities} onItem={city => router.push({ pathname: "/city/[city]", params: { city } })} />
      <Text variant="label">Yıllara göre görünüm</Text>
      <DataTable compact label="Yıllara göre kontenjan ve yerleşme istatistikleri" columns={["Yıl", "Seçenek", "Kontenjan", "Yerleşen", "Doluluk", "Tercih"]} rows={[...(data.yearly ?? [])].sort((a,b) => (b.year ?? 0) - (a.year ?? 0)).map(row => [row.year == null ? undefined : String(row.year), row.programCount, row.quota, row.placed, row.fillRate == null ? "—" : `%${row.fillRate.toLocaleString("tr-TR", {maximumFractionDigits: 2})}`, row.preferences])} />
      <Text variant="muted">Kaynak: Resmî YÖK Atlas katalog ve yerleşme verileri{data.lastSynchronizedAt ? ` · Son aktarım ${new Date(data.lastSynchronizedAt).toLocaleDateString("tr-TR")}` : ""}.</Text>
    </>}
  </Page>;
}
