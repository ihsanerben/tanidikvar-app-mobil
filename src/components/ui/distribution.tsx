import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Schema } from '@/lib/api/types';
import { chartColors } from '@/lib/design/chart';
import { Card } from './card';
import { Text } from './text';
export function Distribution({ title, items, onItem, donut = false, compact = false, columns = 1 }: { title: string; items?: Schema['LabelCountResponse'][]; onItem?: (label: string) => void; donut?: boolean; compact?: boolean; columns?: 1 | 2 }) {
  const [selected, setSelected] = useState<number | null>(null);
  const rows = items ?? [];
  const total = rows.reduce((sum, row) => sum + Math.max(0, row.count ?? 0), 0);
  const active = selected == null ? undefined : rows[selected];
  if (!donut) {
    const max=Math.max(1,...rows.map(row=>row.count ?? 0));
    return <Card compact={compact} className={compact ? 'gap-1 p-2' : undefined}><Text variant={compact ? "unstyled" : "heading"} className={compact ? 'text-[12px] font-semibold text-primary' : undefined}>{title}</Text><View className={columns === 2 ? 'flex-row flex-wrap' : undefined}>{rows.slice(0,12).map(row=><View key={row.label} className={columns === 2 ? 'w-1/2 pr-2' : undefined}><Pressable accessibilityRole={onItem ? 'link' : undefined} accessibilityLabel={onItem ? `${row.label}: ${(row.count ?? 0).toLocaleString('tr-TR')}` : undefined} disabled={!onItem} onPress={()=>row.label && onItem?.(row.label)} className={`${compact ? onItem ? 'min-h-touch-ios' : 'min-h-[22px]' : 'min-h-touch-ios'} gap-0.5 justify-center`}><View className="flex-row gap-1"><Text numberOfLines={1} className={compact ? 'min-w-0 flex-1 text-[10px]' : 'min-w-0 flex-1 text-caption'}>{row.label}</Text><Text variant="muted" className={compact ? 'text-[10px]' : undefined}>{(row.count ?? 0).toLocaleString('tr-TR')}</Text></View><View className="h-1 rounded-full bg-primary-soft"><View className="h-1 rounded-full bg-primary" style={{width:`${Math.max(2,(row.count ?? 0)/max*100)}%`}} /></View></Pressable></View>)}{!rows.length && <Text variant="muted">Veri bulunamadı.</Text>}</View></Card>;
  }
  const radius = 72, circumference = 2 * Math.PI * radius;
  return <Card compact={compact} className={compact ? 'gap-1 p-2' : undefined}><Text variant={compact ? "unstyled" : "heading"} className={compact ? 'text-[12px] font-semibold text-primary' : undefined}>{title}</Text><View className="gap-1"><View className={compact ? "self-center h-[60px] w-[60px] items-center justify-center" : "self-center items-center justify-center h-chart w-chart"}>
    <Svg width="100%" height="100%" viewBox="0 0 180 180" accessible={false}>
      <Circle cx={90} cy={90} r={radius} stroke={chartColors[9]} strokeWidth={28} fill="none" />
      {rows.map((row, index) => { const length = total ? Math.max(0, row.count ?? 0) / total * circumference : 0; const start = total ? rows.slice(0,index).reduce((sum,item)=>sum+Math.max(0,item.count ?? 0),0)/total*circumference : 0; return <Circle key={`${row.label}-${index}`} cx={90} cy={90} r={radius} fill="none" stroke={chartColors[index % chartColors.length]} strokeWidth={selected === index ? 32 : 28} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-start} rotation={-90} origin="90,90" onPress={() => setSelected(index)} />; })}
    </Svg>
    <View pointerEvents="none" className="absolute items-center px-2"><Text variant={compact ? 'unstyled' : 'heading'} className={compact ? 'text-[12px] font-bold text-primary' : undefined}>{(active?.count ?? total).toLocaleString('tr-TR')}</Text><Text variant="muted" className={compact ? 'text-center text-[10px]' : 'text-center'} numberOfLines={2}>{active?.label ?? 'Toplam'}</Text></View>
  </View>
  <View className={compact ? 'flex-row flex-wrap' : undefined}>{rows.length ? rows.map((row, index) => <Pressable key={`${row.label}-${index}`} accessibilityRole="button" accessibilityState={{ selected: selected === index }} accessibilityLabel={`${row.label}: ${(row.count ?? 0).toLocaleString('tr-TR')}`} onPress={() => { setSelected(index); if (row.label) onItem?.(row.label); }} className={`${compact ? 'min-h-[24px] w-1/2 pr-2' : 'min-h-touch-android'} flex-row items-center gap-1 rounded-control px-1`}>
    <View className={compact ? 'h-2 w-2 shrink-0 rounded-full' : 'h-3 w-3 rounded-full'} style={{ backgroundColor: chartColors[index % chartColors.length] }} /><Text numberOfLines={compact ? 1 : undefined} className={compact ? 'min-w-0 flex-1 text-[10px]' : 'min-w-0 flex-1 text-caption'}>{row.label}</Text><Text className={compact ? 'text-[10px] font-semibold' : 'text-caption font-semibold'}>{(row.count ?? 0).toLocaleString('tr-TR')}</Text>
  </Pressable>) : <Text variant="muted">Bu istatistik veri aktarımı tamamlandığında gösterilecek.</Text>}</View></View>
  </Card>;
}
