import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { router, usePathname, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { myProfile } from '@/features/profile/api';
import { openManagerWebPanel } from '@/lib/navigation/manager-web';
import { ActionButton } from './action-button';
import { Brand } from './brand';
import { Button } from './button';
import { BottomSheet } from './bottom-sheet';
import { Text } from './text';
const accountTone=cva('min-h-touch-android max-w-header-account shrink flex-row items-center gap-2 rounded-card border px-2 py-1.5 active:opacity-80', {variants:{education:{YKS_ADAYI:'bg-candidate',UNIVERSITE_OGRENCISI:'bg-profile-student',MEZUN:'bg-graduate',OTHER:'bg-primary'}}});
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
];
export function AppHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dense = useWindowDimensions().width < 375;
  const { status } = useAuth();
  const user = useCurrentUser();
  const profile = useQuery({ ...myProfile(), enabled: status === 'authenticated' });
  const name = [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(' ') || user.data?.email || 'Hesabım';
  const education = profile.data?.educationStatus;
  const tone=education==='YKS_ADAYI'||education==='UNIVERSITE_OGRENCISI'||education==='MEZUN'?education:'OTHER';
  const roleLabel = education === 'MEZUN' ? 'Mezun' : education === 'UNIVERSITE_OGRENCISI' ? 'Öğrenci' : education === 'YKS_ADAYI' ? 'YKS adayı' : 'Üye';
  const stars = education === 'MEZUN' ? '★★★' : education === 'UNIVERSITE_OGRENCISI' ? '★★' : '★';
  const touch = Platform.OS === 'android' ? 'min-h-touch-android min-w-touch-android' : 'min-h-touch-ios min-w-touch-ios';
  return <View className={`min-h-header-height flex-row items-center border-b border-border bg-page px-gutter py-2 ${dense ? "gap-1" : "gap-2"}`}>
    <Pressable accessibilityRole="link" accessibilityLabel="TanıdıkVar sorular sayfası" className="min-h-11 min-w-0 flex-1 justify-center" onPress={() => router.push('/(app)/(tabs)')}><Brand dense={dense} /></Pressable>
    {status === 'authenticated' ? user.data?.role === 'MANAGER' ? <ActionButton label="Yönetim ↗" action={openManagerWebPanel} /> : <Pressable accessibilityRole="link" accessibilityLabel={`${name}, Hesabım`} onPress={() => router.push('/profil')} className={accountTone({education:tone,className:user.data?.role==='TANIDIK' ? 'border-gold ml-3' : 'border-gold'})}>
      {user.data?.role === 'TANIDIK' && <View className="absolute -left-3 top-0 bottom-0 items-center justify-center"><View className="w-3 items-center justify-center gap-0.5 rounded-l-control border border-gold bg-surface py-1.5">{stars.split('').map((star,index)=><Text key={index} variant="unstyled" className="text-avatar-star-admin text-center text-gold">{star}</Text>)}</View></View>}
      <View className="min-w-0 shrink items-center"><Text variant="unstyled" numberOfLines={1} className="text-metadata font-bold text-primary-foreground">{profile.data?.firstName || name}</Text>{!!profile.data?.lastName && <Text variant="unstyled" numberOfLines={1} className="text-metadata font-bold text-primary-foreground">{profile.data.lastName}</Text>}</View>
      <View className="h-7 w-px bg-primary-foreground/30" />
      <View className="shrink-0 items-center gap-0.5"><Text variant="unstyled" className="text-metadata font-bold text-primary-foreground">Hesabım</Text><Text variant="unstyled" className="rounded-full bg-primary-foreground/10 px-1.5 text-compact-badge text-primary-foreground">{roleLabel}</Text></View>
    </Pressable> : <Button label="Giriş yap" onPress={() => router.push('/login')} />}
    <Pressable accessibilityRole="button" accessibilityLabel="Ana menüyü aç" onPress={() => setOpen(true)} className={`${touch} items-center justify-center rounded-card border border-primary bg-primary px-2 active:opacity-80`}>
      <View className="gap-0.5"><View className="h-0.5 w-4 bg-primary-foreground" /><View className="h-0.5 w-4 bg-primary-foreground" /><View className="h-0.5 w-4 bg-primary-foreground" /></View>
    </Pressable>
    <BottomSheet visible={open} title="Menü" placement="menu" close={() => setOpen(false)}>
      <View className="gap-1">{links.map((link, index) => {
        const target = typeof link.href === 'string' ? link.href : link.href.pathname;
        const active = target === pathname && typeof link.href === 'string';
        return <View key={link.label}>{(index === 6 || index === 9) && <View className="my-2 h-px bg-border" />}<Pressable accessibilityRole="link" accessibilityLabel={link.label} accessibilityState={{ selected: active }} className={`min-h-touch-android flex-row items-center justify-between rounded-control px-3 py-2 active:bg-primary-soft ${active ? 'bg-primary-soft' : ''}`} onPress={() => { setOpen(false); router.push(link.href); }}><View className="flex-row items-center gap-3"><View className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary' : 'bg-border'}`} /><Text variant="unstyled" className="text-body font-semibold text-primary">{link.label}</Text></View><Text variant="unstyled" accessible={false} className="text-caption text-muted">↗</Text></Pressable></View>;
      })}</View>
    </BottomSheet>
  </View>;
}
