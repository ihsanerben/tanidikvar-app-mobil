import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { myProfile } from '@/features/profile/api';
import { Brand } from './brand';
import { Button } from './button';
import { BottomSheet } from './bottom-sheet';
import { Text } from './text';
const links: { label: string; href: Href }[] = [
  { label: 'Sorular', href: '/(app)/(tabs)' },
  { label: 'Popülerler', href: { pathname: '/(app)/(tabs)', params: { period: 'ALL_TIME' } } },
  { label: 'Üniversiteler', href: '/kesfet' },
  { label: 'Programlar', href: { pathname: '/kesfet', params: { kind: 'programs' } } },
  { label: 'Tanıdıklar', href: '/people' },
  { label: 'Arama', href: '/search' },
  { label: 'Sıralama', href: '/leaderboard' },
  { label: 'İstatistikler', href: '/statistics' },
  { label: 'Karşılaştır', href: '/compare' },
  { label: 'Hakkımızda', href: '/about' },
  { label: 'Sistem durumu', href: '/status' },
];
export function AppHeader() {
  const [open, setOpen] = useState(false);
  const { status } = useAuth();
  const user = useCurrentUser();
  const profile = useQuery({ ...myProfile(), enabled: status === 'authenticated' });
  const name = [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(' ') || user.data?.email || 'Hesabım';
  const education = profile.data?.educationStatus;
  const stars = education === 'MEZUN' ? '★★★' : education === 'UNIVERSITE_OGRENCISI' ? '★★' : '★';
  const roleLabel = education === 'MEZUN' ? 'Mezun' : education === 'UNIVERSITE_OGRENCISI' ? 'Üniversite öğrencisi' : education === 'YKS_ADAYI' ? 'YKS adayı' : 'Üye';
  const touch = Platform.OS === 'android' ? 'min-h-touch-android min-w-touch-android' : 'min-h-touch-ios min-w-touch-ios';
  return <View className="min-h-header-height flex-row items-center gap-3 border-b border-border bg-page px-gutter py-2">
    <Pressable accessibilityRole="link" accessibilityLabel="TanıdıkVar sorular sayfası" className="min-h-11 min-w-11 flex-1 justify-center" onPress={() => router.push('/(app)/(tabs)')}><Brand compact /></Pressable>
    {status === 'authenticated' ? <Pressable accessibilityRole="link" accessibilityLabel={`${name}, ${user.data?.role === 'MANAGER' ? 'Yönetim' : 'Hesabım'}`} onPress={() => router.push(user.data?.role === 'MANAGER' ? '/manager' : '/profil')} className={`${touch} max-w-[155px] justify-center rounded-control border border-border bg-surface px-2 active:opacity-80`}>
      <Text numberOfLines={1} className="text-caption font-semibold text-primary">{name}</Text>
      <Text numberOfLines={1} className="text-metadata text-muted">{user.data?.role === 'MANAGER' ? 'Yönetim · Manager' : user.data?.role === 'TANIDIK' ? `${stars} ${roleLabel} · Hesabım` : `${roleLabel} · Hesabım`}</Text>
    </Pressable> : <Button label="Giriş yap" onPress={() => router.push('/login')} />}
    <Pressable accessibilityRole="button" accessibilityLabel="Ana menüyü aç" onPress={() => setOpen(true)} className={`${touch} items-center justify-center gap-1 rounded-control border border-secondary-border bg-surface px-2 active:opacity-80`}>
      <View className="gap-0.5"><View className="h-0.5 w-4 bg-primary" /><View className="h-0.5 w-4 bg-primary" /><View className="h-0.5 w-4 bg-primary" /></View>
      <Text className="text-metadata text-primary">Menü</Text>
    </Pressable>
    <BottomSheet visible={open} title="Ana menü" close={() => setOpen(false)}>{links.map(link => <Button key={link.label} label={link.label} variant="secondary" fullWidth onPress={() => { setOpen(false); router.push(link.href); }} />)}</BottomSheet>
  </View>;
}
