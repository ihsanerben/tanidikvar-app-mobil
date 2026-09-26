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
import Svg, { Polyline, Line, Circle } from "react-native-svg";
import { analyticsColors } from "@/lib/design/chart";
import { DataTable } from "@/components/ui/data-table";
import { Metric as MetricCard } from "@/components/ui/metric";
import { ManagerPage } from "./manager-shell";

type Metric = keyof Schema["ManagementAnalyticsTotalsResponse"];
const groups: { title: string; metrics: Metric[] }[] = [
  { title: "Büyüme", metrics: ["users", "questions"] },
  { title: "Katkılar", metrics: ["communityAnswers", "adminAnswers"] },
  { title: "Etkileşim", metrics: ["views", "likes"] },
  { title: "Tanıdık başvuruları", metrics: ["applications", "approvedApplications", "rejectedApplications"] },
];
const labels: Record<Metric, string> = { users: "Yeni kullanıcı", questions: "Yeni soru", communityAnswers: "Topluluk yorumu", adminAnswers: "Tanıdık yorumu", views: "Görüntülenme", likes: "Beğeni", applications: "Başvuru", approvedApplications: "Onay", rejectedApplications: "Ret" };
const colors=analyticsColors;
function istanbulToday() { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const get = (key: string) => parts.find(part => part.type === key)?.value; return `${get("year")}-${get("month")}-${get("day")}`; }
function minusDays(date: string, days: number) { const result = new Date(`${date}T12:00:00Z`); result.setUTCDate(result.getUTCDate() - days); return result.toISOString().slice(0, 10); }
function Trend({points,metrics,title}: {points:Schema["ManagementAnalyticsPointResponse"][];metrics:Metric[];title:string}) {
  const max=Math.max(1,...points.flatMap(point=>metrics.map(metric=>point[metric] ?? 0)));
  const x=(index:number)=>34+(points.length<2?326:index*652/(points.length-1));const y=(value:number)=>196-value*162/max;
  return <View className="gap-2"><View accessible accessibilityLabel={`${title} grafiği; en yüksek günlük değer ${max}`} className="h-chart"><Svg width="100%" height="100%" viewBox="0 0 720 230" accessible={false}>
    {[0,.25,.5,.75,1].map(value=><Line key={value} x1={34} x2={686} y1={y(max*value)} y2={y(max*value)} stroke={colors.applications} strokeOpacity={0.2} />)}
    {metrics.map((metric,index)=><Polyline key={metric} strokeDasharray={index===1?'8 5':index===2?'2 5':undefined} points={points.map((point,i)=>`${x(i)},${y(point[metric] ?? 0)}`).join(' ')} fill="none" stroke={colors[metric]} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />)}
    {points.length===1 && metrics.map(metric=><Circle key={metric} cx={x(0)} cy={y(points[0][metric] ?? 0)} r={4} fill={colors[metric]} />)}
  </Svg></View><View className="flex-row justify-between gap-2"><Text variant="muted">{points[0]?.date ?? '—'}</Text><Text variant="muted">En yüksek {max.toLocaleString('tr-TR')}</Text><Text variant="muted">{points.at(-1)?.date ?? '—'}</Text></View></View>;
}
export function ManagerAnalyticsScreen() {
  const today = istanbulToday();
  const [from, setFrom] = useState(minusDays(today, 29));
  const [to, setTo] = useState(today);
  const [applied, setApplied] = useState({ from, to });
  const query = useQuery({ queryKey: ["manager", "analytics", applied], queryFn: ({ signal }) => api.call("get", "/api/manager/analytics", { query: { dateFrom: applied.from, dateTo: applied.to }, authenticated: true, signal }) });
  const data = query.data;
  const [showDaily,setShowDaily]=useState(false);
  return <ManagerPage title="Grafikler"><Text>Platform hareketlerini İstanbul gün sınırlarıyla karşılaştır.</Text>
    <View className="flex-row flex-wrap gap-2">{[7, 30, 90].map(days => <Button key={days} label={`Son ${days} gün`} variant="secondary" onPress={() => { const start = minusDays(today, days - 1); setFrom(start); setTo(today); setApplied({ from: start, to: today }); }} />)}</View>
    <FormField label="Başlangıç (YYYY-MM-DD)" value={from} onChangeText={setFrom} /><FormField label="Bitiş (YYYY-MM-DD)" value={to} onChangeText={setTo} />
    <Button label="Grafikleri getir" onPress={() => { if (/^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to) setApplied({ from, to }); }} />
    {query.isPending ? <Skeleton /> : query.isError && !data ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : data && <>
      <Text variant="muted">{data.dateFrom} – {data.dateTo} · {data.points?.length ?? 0} gün · {data.timezone}</Text>
      <View className="flex-row flex-wrap gap-2">{(['users','questions','communityAnswers','adminAnswers','views','likes'] as Metric[]).map(metric=><View key={metric} className="w-metric-half"><MetricCard label={labels[metric]} value={data.totals?.[metric] ?? 0} /></View>)}</View>
      {groups.map(group=><Card key={group.title} className="border-manager-border"><Text variant="heading">{group.title}</Text><View className="flex-row flex-wrap gap-3">{group.metrics.map(metric=><View key={metric} className="flex-row items-center gap-2"><View className="h-2 w-2 rounded-full" style={{backgroundColor:colors[metric]}} /><Text variant="muted">{labels[metric]} · {(data.totals?.[metric] ?? 0).toLocaleString('tr-TR')}</Text></View>)}</View><Trend points={data.points ?? []} metrics={group.metrics} title={group.title} /></Card>)}
      <Button label={showDaily ? "Günlük verileri kapat" : "Günlük verileri tablo olarak göster"} variant="secondary" onPress={()=>setShowDaily(value=>!value)} />
      {showDaily && <DataTable label="Seçili dönemde günlük hareketler" columns={['Tarih',...Object.values(labels)]} rows={(data.points ?? []).map(point=>[point.date,...(Object.keys(labels) as Metric[]).map(metric=>point[metric])])} />}
    </>}
  </ManagerPage>;
}
