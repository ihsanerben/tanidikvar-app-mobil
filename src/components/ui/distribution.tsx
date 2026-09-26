import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Schema } from '@/lib/api/types';
import { chartColors } from '@/lib/design/chart';
import { Card } from './card';
import { Text } from './text';
export function Distribution({ title, items, onItem, donut = false }: { title: string; items?: Schema['LabelCountResponse'][]; onItem?: (label: string) => void; donut?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const rows = items ?? [];
  const total = rows.reduce((sum, row) => sum + Math.max(0, row.count ?? 0), 0);
  const active = selected == null ? undefined : rows[selected];
  if (!donut) {
    const max=Math.max(1,...rows.map(row=>row.count ?? 0));
    return <Card><Text variant="heading">{title}</Text>{rows.slice(0,12).map(row=><Pressable key={row.label} accessibilityRole={onItem ? 'link' : undefined} disabled={!onItem} onPress={()=>row.label && onItem?.(row.label)} className="min-h-touch-ios gap-1 justify-center"><View className="flex-row gap-2"><Text className="min-w-0 flex-1 text-caption">{row.label}</Text><Text variant="muted">{(row.count ?? 0).toLocaleString('tr-TR')}</Text></View><View className="h-2 rounded-full bg-primary-soft"><View className="h-2 rounded-full bg-primary" style={{width:`${Math.max(2,(row.count ?? 0)/max*100)}%`}} /></View></Pressable>)}{!rows.length && <Text variant="muted">Veri bulunamadı.</Text>}</Card>;
  }
  const radius = 72, circumference = 2 * Math.PI * radius;
  return <Card><Text variant="heading">{title}</Text><View className="self-center items-center justify-center h-chart w-chart">
    <Svg width="100%" height="100%" viewBox="0 0 180 180" accessible={false}>
      <Circle cx={90} cy={90} r={radius} stroke={chartColors[9]} strokeWidth={28} fill="none" />
      {rows.map((row, index) => { const length = total ? Math.max(0, row.count ?? 0) / total * circumference : 0; const start = total ? rows.slice(0,index).reduce((sum,item)=>sum+Math.max(0,item.count ?? 0),0)/total*circumference : 0; return <Circle key={`${row.label}-${index}`} cx={90} cy={90} r={radius} fill="none" stroke={chartColors[index % chartColors.length]} strokeWidth={selected === index ? 32 : 28} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-start} rotation={-90} origin="90,90" onPress={() => setSelected(index)} />; })}
    </Svg>
    <View pointerEvents="none" className="absolute items-center px-5"><Text variant="heading">{(active?.count ?? total).toLocaleString('tr-TR')}</Text><Text variant="muted" className="text-center" numberOfLines={2}>{active?.label ?? 'Toplam'}</Text></View>
  </View>
  {rows.length ? rows.map((row, index) => <Pressable key={`${row.label}-${index}`} accessibilityRole="button" accessibilityState={{ selected: selected === index }} accessibilityLabel={`${row.label}: ${(row.count ?? 0).toLocaleString('tr-TR')}`} onPress={() => { setSelected(index); if (row.label) onItem?.(row.label); }} className="min-h-touch-android flex-row items-center gap-2 rounded-control px-1">
    <View className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><Text className="min-w-0 flex-1 text-caption">{row.label}</Text><Text className="text-caption font-semibold">{(row.count ?? 0).toLocaleString('tr-TR')}</Text>
  </Pressable>) : <Text variant="muted">Bu istatistik veri aktarımı tamamlandığında gösterilecek.</Text>}
  </Card>;
}
