import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import type { Schema } from "@/lib/api/types";
import { ManagerPage } from "./manager-shell";

type Metric = keyof Schema["ManagementAnalyticsTotalsResponse"];
const groups: { title: string; metrics: Metric[] }[] = [
  { title: "Büyüme", metrics: ["users", "questions"] },
  { title: "Katkılar", metrics: ["communityAnswers", "adminAnswers"] },
  { title: "Etkileşim", metrics: ["views", "likes"] },
  { title: "Tanıdık başvuruları", metrics: ["applications", "approvedApplications", "rejectedApplications"] },
];
const labels: Record<Metric, string> = { users: "Yeni kullanıcı", questions: "Yeni soru", communityAnswers: "Topluluk yorumu", adminAnswers: "Tanıdık yorumu", views: "Görüntülenme", likes: "Beğeni", applications: "Başvuru", approvedApplications: "Onay", rejectedApplications: "Ret" };
const colors: Record<Metric, string> = { users: "#3f83c5", questions: "#7957a8", communityAnswers: "#2f8f57", adminAnswers: "#d4a72c", views: "#3f6b61", likes: "#c02f62", applications: "#687386", approvedApplications: "#2f8f57", rejectedApplications: "#bd3e4d" };
function istanbulToday() { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const get = (key: string) => parts.find(part => part.type === key)?.value; return `${get("year")}-${get("month")}-${get("day")}`; }
function minusDays(date: string, days: number) { const result = new Date(`${date}T12:00:00Z`); result.setUTCDate(result.getUTCDate() - days); return result.toISOString().slice(0, 10); }
function Trend({ points, metric }: { points: Schema["ManagementAnalyticsPointResponse"][]; metric: Metric }) {
  const max = Math.max(1, ...points.map(point => point[metric] ?? 0));
  return <View accessibilityLabel={`${labels[metric]} günlük değerleri`} className="flex-row items-end gap-0.5 h-9">{points.map((point, index) => <View key={`${point.date}-${index}`} style={{ flex: 1, height: `${Math.max(8, ((point[metric] ?? 0) / max) * 100)}%`, backgroundColor: colors[metric], borderRadius: 2 }} />)}</View>;
}
export function ManagerAnalyticsScreen() {
  const today = istanbulToday();
  const [from, setFrom] = useState(minusDays(today, 29));
  const [to, setTo] = useState(today);
  const [applied, setApplied] = useState({ from, to });
  const query = useQuery({ queryKey: ["manager", "analytics", applied], queryFn: ({ signal }) => api.call("get", "/api/manager/analytics", { query: { dateFrom: applied.from, dateTo: applied.to }, authenticated: true, signal }) });
  const data = query.data;
  return <ManagerPage title="Grafikler"><Text>Platform hareketlerini İstanbul gün sınırlarıyla karşılaştır.</Text>
    <View className="flex-row flex-wrap gap-2">{[7, 30, 90].map(days => <Button key={days} label={`Son ${days} gün`} variant="secondary" onPress={() => { const start = minusDays(today, days - 1); setFrom(start); setTo(today); setApplied({ from: start, to: today }); }} />)}</View>
    <FormField label="Başlangıç (YYYY-MM-DD)" value={from} onChangeText={setFrom} /><FormField label="Bitiş (YYYY-MM-DD)" value={to} onChangeText={setTo} />
    <Button label="Grafikleri getir" onPress={() => { if (/^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to) setApplied({ from, to }); }} />
    {query.isPending ? <Skeleton /> : query.isError && !data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : data && <>
      <Text variant="muted">{data.dateFrom} – {data.dateTo} · {data.points?.length ?? 0} gün · {data.timezone}</Text>
      {groups.map(group => <Card key={group.title} className="gap-3 border-[#e0e3ec]"><Text variant="heading">{group.title}</Text>
        {group.metrics.map(metric => <View key={metric} className="gap-1"><View className="flex-row justify-between"><Text>{labels[metric]}</Text><Text>{(data.totals?.[metric] ?? 0).toLocaleString("tr-TR")}</Text></View><Trend points={data.points ?? []} metric={metric} /></View>)}
      </Card>)}
    </>}
  </ManagerPage>;
}
