import { shareLink } from '@/lib/share';
import { cva } from 'class-variance-authority';
import { Linking, Pressable, View } from 'react-native';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { sharePath } from '@/lib/navigation/params';
import { FeaturedAchievements } from '@/features/retention/achievement-medallion';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { profileBackground } from '@/lib/theme';
import { BottomSheet } from '@/components/ui/bottom-sheet';

export type ContributionSummary = { questionCount: number; commentCount: number; experienceCount: number; pollCount: number };

type Fact = { label: string; value?: string | number | null };
type Link = { label: string; url: string };
const surface = cva('relative gap-[18px] overflow-visible rounded-[20px] border border-profile-border border-t-4 bg-account-summary px-3.5 py-[18px] shadow-sm', {
  variants: { education: {
    YKS_ADAYI: 'border-t-candidate',
    UNIVERSITE_OGRENCISI: 'border-t-profile-student',
    MEZUN: 'border-t-graduate',
    OTHER: 'border-t-primary',
  } },
});

export function ProfileIdentityCard({ name, educationStatus, subtitle, biography, tanidik = false, badgeLabel, facts = [], links = [], profileId, account = false, contributionSummary }: {
  name: string;
  educationStatus?: string | null;
  subtitle: string;
  biography?: string | null;
  tanidik?: boolean;
  badgeLabel?: string;
  facts?: Fact[];
  links?: Link[];
  profileId?: string;
  account?: boolean;
  contributionSummary?: ContributionSummary | null;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const education = educationStatus === 'MEZUN' || educationStatus === 'UNIVERSITE_OGRENCISI' || educationStatus === 'YKS_ADAYI' ? educationStatus : 'OTHER';
  const educationLabel = education === 'MEZUN' ? 'Mezun' : education === 'UNIVERSITE_OGRENCISI' ? 'Üniversite öğrencisi' : education === 'YKS_ADAYI' ? 'YKS adayı' : 'Üye';
  const roleBorderColor = education === 'MEZUN' ? '#C8102E' : education === 'UNIVERSITE_OGRENCISI' ? '#2F8F57' : education === 'YKS_ADAYI' ? '#3F83C5' : '#60756B';
  const safeLinks = links.filter(link => /^https?:\/\//.test(link.url));
  return <View className="pb-6"><Card className={surface({ education })} style={{ borderRadius: 20, borderColor: '#D9E5DA', borderTopColor: roleBorderColor, borderTopWidth: 4 }}>
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden rounded-[20px]"><Svg width="100%" height="100%"><Defs><LinearGradient id="profile-base" x1="0%" y1="100%" x2="100%" y2="0%"><Stop offset="40%" stopColor={profileBackground.start}/><Stop offset="100%" stopColor={profileBackground.end}/></LinearGradient><RadialGradient id="profile-glow" cx="95%" cy="0%" rx="55%" ry="45%"><Stop offset="0%" stopColor={profileBackground.glow}/><Stop offset="100%" stopColor={profileBackground.glow} stopOpacity="0"/></RadialGradient></Defs><Rect width="100%" height="100%" fill="url(#profile-base)"/><Rect width="100%" height="100%" fill="url(#profile-glow)"/></Svg></View>
    {profileId && <Pressable accessibilityRole="button" accessibilityLabel="Profili paylaş" onPress={() => void shareLink(sharePath('profil', profileId))} className="absolute right-3 top-3 z-10 min-h-touch-ios min-w-touch-ios items-center justify-center rounded-full border border-border bg-surface android:min-h-touch-android android:min-w-touch-android"><Icon name="share" tone="primary" size={16} /></Pressable>}
    <View className="min-w-0 flex-row items-center gap-4 pr-10">
      <Avatar name={name} educationStatus={educationStatus ?? undefined} tanidik={tanidik} size="profile" />
      <View className="min-w-0 flex-1 gap-1.5">
        <Text variant="unstyled" className="text-[20px] font-bold leading-6 text-primary">{name}</Text>
        <Text variant="unstyled" className="text-[12px] leading-[17px] text-muted">{subtitle ? `${subtitle} · ` : ''}<Text variant="unstyled" className={education === 'MEZUN' ? 'font-semibold text-graduate' : education === 'UNIVERSITE_OGRENCISI' ? 'font-semibold text-profile-student' : education === 'YKS_ADAYI' ? 'font-semibold text-candidate' : 'font-semibold text-profile-member'}>{educationLabel}</Text></Text>
        {badgeLabel && <Text className="text-[12px] font-semibold text-primary">{badgeLabel}</Text>}
      </View>
    </View>
    <View className="w-full flex-row flex-wrap items-center justify-center gap-2">
      {safeLinks.map(link => <Pressable key={link.label} accessibilityRole="link" accessibilityLabel={`${link.label} bağlantısını aç`} onPress={() => void Linking.openURL(link.url)} className="min-h-touch-ios android:min-h-touch-android flex-row items-center gap-1.5 rounded-full border border-profile-border bg-surface px-3 py-1 shadow-sm active:bg-primary-soft"><Icon name={link.label === 'LinkedIn' ? 'linkedin' : 'globe'} tone="primary" size={16} /><Text variant="unstyled" className="text-[12px] font-semibold text-primary">{link.label === 'LinkedIn' ? 'LinkedIn' : 'Web sitesi'}</Text></Pressable>)}
      {(account || profileId) && <Pressable accessibilityRole="button" accessibilityLabel="Tanıdık Karnesi" onPress={() => setReportOpen(true)} className="min-h-touch-ios items-center justify-center active:opacity-80 android:min-h-touch-android"><View className="min-h-[36px] flex-row items-center justify-center gap-1.5 rounded-full border border-gold bg-surface px-3.5 py-1.5 shadow-sm"><Icon name="book" tone="tanidik" size={15}/><Text variant="unstyled" className="text-[12px] font-semibold leading-[15px] text-[#906b08]">Tanıdık Karnesi</Text></View></Pressable>}
    </View>
    {!!facts.length && <View className="flex-row flex-wrap justify-between gap-y-2">{facts.map(fact => <View key={fact.label} className="w-metric-half min-w-0 gap-1.5 rounded-[11px] border border-profile-fact-border bg-surface p-3"><Text className="text-[11px] text-muted">{fact.label}</Text><Text className="text-[13px] font-semibold leading-[18px] text-primary" numberOfLines={2}>{fact.value === '' ? '—' : fact.value ?? '—'}</Text></View>)}</View>}
    {!!biography && <Text className="text-[13px] leading-5 text-muted">{biography}</Text>}
    {profileId && <FeaturedAchievements id={profileId} />}
    <BottomSheet visible={reportOpen} title="Tanıdık Karnesi" close={() => setReportOpen(false)}><View className="flex-row flex-wrap justify-between gap-y-2">{[
      { label: 'Soru sayısı', value: contributionSummary?.questionCount }, { label: 'Yorum sayısı', value: contributionSummary?.commentCount },
      { label: 'Deneyim paylaşma sayısı', value: contributionSummary?.experienceCount }, { label: 'Anket açma sayısı', value: contributionSummary?.pollCount },
    ].map(item => <View key={item.label} className="w-metric-half rounded-control border border-profile-fact-border bg-surface p-3"><Text className="text-[20px] font-bold text-primary">{item.value ?? '—'}</Text><Text className="text-metadata text-muted">{item.label}</Text></View>)}</View>{!contributionSummary && <Text className="text-caption text-muted">Katkı sayıları şu anda yüklenemiyor.</Text>}</BottomSheet>
  </Card></View>;
}
