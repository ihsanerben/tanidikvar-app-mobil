import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Image } from '@/components/ui/image';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Metric } from '@/components/ui/metric';
import type { Schema } from '@/lib/api/types';
export function UniversityCard({ item }: { item: Schema['UniversityResponse'] }) {
  const open = () => item.id && router.push({ pathname: '/universities/[id]', params: { id: item.id } });
  return <Card><View className="flex-row items-center gap-3">{item.logoUrl && <Image source={{ uri: item.logoUrl }} contentFit="contain" accessibilityLabel={`${item.name} logosu`} className="h-12 w-12" />}<View className="min-w-0 flex-1 gap-1"><Text variant="muted">{[item.city, item.institutionType].filter(Boolean).join(' · ')}</Text><Pressable accessibilityRole="link" onPress={open} className="min-h-touch-ios justify-center"><Text variant="heading">{item.name}</Text></Pressable></View></View>
    <Text variant="muted">{item.programCount ?? 0} program · {item.questionCount ?? 0} soru · {item.tanidikCount ?? 0} Tanıdık</Text>
    <Pressable accessibilityRole="link" onPress={open} className="min-h-touch-ios justify-center"><Text className="text-caption font-semibold text-primary">Üniversiteyi keşfet →</Text></Pressable>
  </Card>;
}
export function ProgramCard({ item }: { item: Schema['ProgramSummaryResponse'] }) {
  const open = () => item.id && router.push({ pathname: '/programs/[id]', params: { id: item.id } });
  return <Card><Text className="text-metadata font-semibold text-muted">{[item.degreeLevel, item.scoreTypes?.join(' / ')].filter(Boolean).join(' · ')}</Text>
    <Pressable accessibilityRole="link" onPress={open} className="min-h-touch-ios justify-center"><Text variant="heading">{item.name}</Text></Pressable>
    <Text variant="muted">{item.universityName} · {item.city ?? 'Şehir belirtilmemiş'}</Text><Text variant="muted">{item.faculties?.join(' · ') || 'Akademik birim belirtilmemiş'}</Text>
    <View className="flex-row gap-2"><Metric label="2026 başarı sırası" value={item.currentBestRank} /><Metric label="Taban puan" value={item.currentMinimumScore} /><Metric label="Kontenjan" value={item.currentQuota} /></View>
    <Pressable accessibilityRole="link" onPress={open} className="min-h-touch-ios justify-center"><Text className="text-caption font-semibold text-primary">Programı incele →</Text></Pressable>
  </Card>;
}
