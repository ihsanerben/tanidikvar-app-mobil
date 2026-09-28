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
  return <Page title="Yükseköğretim istatistikleri" back={false} eyebrow="Türkiye program kataloğu" refresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <Text>Üniversiteleri, programları ve son yıllardaki yerleşme verilerini tek yerde incele.</Text>
    {query.isPending ? <Skeleton /> : query.isError && !data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : data && <>
      <View className="gap-2"><View className="flex-row gap-2">
        <Metric label="Üniversite" value={data.universityCount} /><Metric label="Program" value={data.programCount} />
      </View><View className="flex-row gap-2"><Metric label="Yerleştirme seçeneği" value={data.optionCount} /><Metric label="Başarı sırası bulunan" value={data.rankedOptionCount} /></View>
      </View>
      <Text variant="heading">Türkiye kataloğunu keşfet</Text>
      <Text variant="muted">Bir görünüm seç; sonuçlar YÖK katalog ve yerleşen verilerinden hesaplanır.</Text>
      <Tabs variant="pills" label="Görünüm" value={selected} options={datasets.map(item => ({ value: item.value, label: item.label }))} onChange={setSelected} />
      <Distribution key={selected} donut title={datasets.find(item => item.value === selected)?.label ?? datasets[0].label} items={datasets.find(item => item.value === selected)?.items} />
      <Distribution title="Üniversite türleri" items={data.institutionTypes} />
      <Distribution title="Program düzeyleri" items={data.degreeLevels} />
      <Distribution title="Puan türleri" items={data.scoreTypes} />
      <Distribution title="En çok üniversite bulunan şehirler" items={data.cities} onItem={city => router.push({ pathname: "/city/[city]", params: { city } })} />
      <Text variant="heading">Yıllara göre görünüm</Text>
      <DataTable label="Yıllara göre kontenjan ve yerleşme istatistikleri" columns={["Yıl", "Seçenek", "Kontenjan", "Yerleşen", "Doluluk", "Tercih"]} rows={[...(data.yearly ?? [])].sort((a,b) => (b.year ?? 0) - (a.year ?? 0)).map(row => [row.year == null ? undefined : String(row.year), row.programCount, row.quota, row.placed, row.fillRate == null ? "—" : `%${row.fillRate.toLocaleString("tr-TR", {maximumFractionDigits: 2})}`, row.preferences])} />
      <Text variant="muted">Kaynak: Resmî YÖK Atlas katalog ve yerleşme verileri{data.lastSynchronizedAt ? ` · Son aktarım ${new Date(data.lastSynchronizedAt).toLocaleDateString("tr-TR")}` : ""}.</Text>
    </>}
  </Page>;
}
