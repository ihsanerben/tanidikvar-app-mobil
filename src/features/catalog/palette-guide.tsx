import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export function PaletteGuide({visible,close}: {visible:boolean;close:()=>void}) {
  return <BottomSheet visible={visible} title="Renkler ne anlatıyor?" close={close}>
    <Text variant="muted" className="font-semibold">1 — Kullanıcı rolleri</Text>
    <View className="flex-row gap-2">{[
      {letter:'Y',title:'YKS adayı',color:'Mavi',tone:'text-candidate'},
      {letter:'Ü',title:'Üniversite öğrencisi',color:'Yeşil',tone:'text-profile-student'},
      {letter:'M',title:'Mezun',color:'Kırmızı',tone:'text-graduate'},
    ].map(role=><View key={role.letter} className="min-w-0 flex-1 items-center gap-1 rounded-card border border-border bg-account-summary px-1 py-2"><View className="h-8 w-8 items-center justify-center rounded-full bg-primary-soft"><Text variant="unstyled" className={`text-metadata font-bold ${role.tone}`}>{role.letter}</Text></View><Text variant="unstyled" className="text-center text-palette font-semibold text-primary">{role.title}</Text><Text variant="unstyled" className={`text-palette font-semibold ${role.tone}`}>({role.color})</Text></View>)}</View>
    <Text variant="muted" className="font-semibold">2 — Soru kapsamı</Text>
    <View className="flex-row flex-wrap gap-1.5">{[
      {label:'Genel',surface:'bg-scope-general',tone:'text-scope-general-text'},
      {label:'Üniversite',surface:'bg-scope-university',tone:'text-scope-university-text'},
      {label:'Üniversite + Bölüm',surface:'bg-scope-program',tone:'text-scope-program-text'},
    ].map(scope=><View key={scope.label} className={`rounded-control px-2 py-1.5 ${scope.surface}`}><Text variant="unstyled" className={`text-compact-badge font-bold ${scope.tone}`}>● {scope.label}</Text></View>)}</View>
    <Text variant="muted" className="font-semibold">3 — Tanıdık rozeti</Text>
    <View className="flex-row items-center gap-3 rounded-card border border-gold bg-scope-general/40 p-3"><Avatar name="M" educationStatus="MEZUN" tanidik size="small" /><Text className="min-w-0 flex-1 text-caption text-scope-general-text">Altın çerçeve ve yıldızlar, sistemdeki Tanıdık gösterimidir.</Text></View>
    <Button fullWidth size="large" label="Anladım, devam et" onPress={close} />
  </BottomSheet>;
}
