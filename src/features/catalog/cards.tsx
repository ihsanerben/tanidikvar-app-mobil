import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { Schema } from '@/lib/api/types';
export function UniversityCard({ item }: { item: Schema['UniversityResponse'] }) {
  const open = () => item.id && router.push({ pathname: '/universities/[id]', params: { id: item.id } });
  const institution = item.institutionType === 'DEVLET' ? 'Devlet' : item.institutionType === 'VAKIF' ? 'Vakıf' : item.institutionType === 'KKTC' ? 'KKTC' : item.institutionType === 'YURT_DISI' ? 'Yurt dışı' : null;
  return <Card compact className="h-full gap-1 rounded-control p-2"><Pressable accessibilityRole="link" onPress={open} className="min-h-touch-ios android:min-h-touch-android justify-center"><Text variant="unstyled" className="text-caption font-bold leading-4 text-primary">{item.name}</Text></Pressable><Text variant="unstyled" className="text-metadata text-muted">{[item.city, institution].filter(Boolean).join(' · ')}</Text>
    <View className="mt-1 flex-row gap-1">{([['Program',item.programCount],['Soru',item.questionCount],['Tanıdık',item.tanidikCount]] as const).map(([label,value])=><View key={label} className="min-w-0 flex-1 items-center rounded-control bg-university-stat px-0.5 py-1"><Text variant="unstyled" className="text-[9px] uppercase text-muted">{label}</Text><Text variant="unstyled" className="text-caption font-extrabold text-primary">{value ?? 0}</Text></View>)}</View>
  </Card>;
}
export function ProgramCard({ item, year = '2026', showUniversity = true, tile = false }: { item: Schema['ProgramSummaryResponse']; year?: string; showUniversity?: boolean; tile?: boolean }) {
  const open = () => item.id && router.push({ pathname: '/programs/[id]', params: { id: item.id } });
  const number = (value: number | null | undefined, decimals = 0) => value == null ? 'Veri yok' : value.toLocaleString('tr-TR', { maximumFractionDigits: decimals });
  if (tile) return <Pressable accessibilityRole="link" accessibilityLabel={`${item.name} programını aç`} onPress={open} className="min-h-[152px] gap-1 rounded-control border border-border bg-surface p-2">
    <Text variant="unstyled" className="text-[9px] font-semibold text-muted">{[item.degreeLevel,item.scoreTypes?.join(' / ')].filter(Boolean).join(' · ')}</Text>
    <Text variant="unstyled" className="text-[11px] font-bold leading-[13px] text-primary">{item.name}</Text>
    <Text variant="unstyled" className="text-[9px] leading-[11px] text-muted">{item.universityName} · {item.city ?? 'Şehir belirtilmemiş'}</Text>
    <Text variant="unstyled" className="text-[9px] leading-[11px] text-muted">{item.faculties?.join(' · ') || 'Akademik birim belirtilmemiş'}</Text>
    <View className="mt-1 flex-row gap-1 border-t border-program-rule pt-1">
      {([[`${year} başarı sırası`,number(item.currentBestRank)],['Taban puan',number(item.currentMinimumScore,3)],['Kontenjan',number(item.currentQuota)]] as const).map(([label,value])=><View key={label} className="min-w-0 flex-1 gap-0.5"><Text variant="unstyled" className="text-[8px] text-muted">{label}</Text><Text variant="unstyled" className="text-[9px] font-bold text-primary">{value}</Text></View>)}
    </View>
    <View className="mt-auto self-center rounded-control bg-info-soft px-1.5 py-1"><Text variant="unstyled" className="text-center text-[9px] font-semibold text-info-accent">Programı incele</Text></View>
  </Pressable>;
  return <Card compact className="gap-2.5 rounded-card p-3.5"><Text variant="unstyled" className="text-[11px] font-semibold text-muted">{[item.degreeLevel, item.scoreTypes?.join(' / ')].filter(Boolean).join(' · ')}</Text>
    <Pressable accessibilityRole="link" onPress={open} className="min-h-touch-ios android:min-h-touch-android justify-center"><Text variant="unstyled" className="text-[17px] font-semibold leading-[22px] text-primary">{item.name}</Text></Pressable>
    {showUniversity && <Text variant="muted">{item.universityName} · {item.city ?? 'Şehir belirtilmemiş'}</Text>}<Text variant="muted">{item.faculties?.join(' · ') || 'Akademik birim belirtilmemiş'}</Text>
    <View className="flex-row gap-2">{([[`${year} başarı sırası`,number(item.currentBestRank)],['Taban puan',number(item.currentMinimumScore,3)],['Kontenjan',number(item.currentQuota)]] as const).map(([label,value])=><View key={label} className="min-w-0 flex-1 gap-1 border-t border-program-rule pt-2"><Text variant="unstyled" className="text-[10px] text-muted">{label}</Text><Text variant="unstyled" className="text-[12px] font-bold text-primary">{value}</Text></View>)}</View>
    <View className="self-center pt-2"><Button variant="info" label="Programı incele" onPress={open} /></View>
  </Card>;
}
export function UniversityProgramCard({ item }: { item: Schema['ProgramSummaryResponse'] }) {
  return <ProgramCard item={item} showUniversity={false} tile />;
}
