import { View } from 'react-native';
import { Text } from './text';
import { cva } from 'class-variance-authority';
import { tanidikStarCount } from '@/lib/tanidik-stars';
const sizes = cva('relative shrink-0 items-center justify-center', { variants: {
  size: { small: 'h-avatar-question w-avatar-question', ranking: 'h-avatar-ranking w-avatar-ranking', medium: 'h-12 w-12', account: 'h-16 w-16', large: 'h-20 w-20', profile: 'h-avatar-profile w-avatar-profile' },
  tanidik: { true: 'mr-1.5', false: '' },
} });
const initials = cva('text-center font-bold', { variants: {
  education: { YKS_ADAYI: 'text-candidate', UNIVERSITE_OGRENCISI: 'text-profile-student', MEZUN: 'text-graduate', OTHER: 'text-member' },
  size: { small: 'text-[10px] leading-3', ranking: 'text-body', medium: 'text-[15px] leading-5', account: 'text-[17px] leading-6', large: 'text-[22px] leading-7', profile: 'text-[26px] leading-8' },
} });
const profileSurface = { YKS_ADAYI: 'border-candidate bg-candidate-soft', UNIVERSITE_OGRENCISI: 'border-profile-student bg-student-soft', MEZUN: 'border-graduate bg-graduate-soft', OTHER: 'border-primary bg-surface' } as const;
const badge = cva('absolute top-1/2 -translate-y-1/2 items-center justify-center border border-gold bg-surface rounded-r-[4px]', { variants: {
  size: { small: '-right-1', ranking: '-right-1', medium: '-right-1.5', account: '-right-1.5', large: '-right-1.5', profile: '-right-1.5' },
} });
const star = cva('text-center text-gold', { variants: { size: { small: 'text-avatar-star', ranking: 'text-avatar-star-ranking', medium: 'text-avatar-star-admin', account: 'text-avatar-star-account', large: 'text-avatar-star', profile: 'text-avatar-star-account' } } });
const starLineHeight = { small: 7, ranking: 6, medium: 8, account: 9, large: 8, profile: 9 } as const;
const badgeWidth = { small: 11, ranking: 10, medium: 12, account: 14, large: 12, profile: 14 } as const;
export function Avatar({ name = 'Üye', educationStatus, tanidik = false, size = 'medium', anonymous = false }: { anonymous?: boolean; name?: string; educationStatus?: string; tanidik?: boolean; size?: 'small' | 'ranking' | 'medium' | 'account' | 'large' | 'profile' }) {
  const education = educationStatus === 'YKS_ADAYI' || educationStatus === 'UNIVERSITE_OGRENCISI' || educationStatus === 'MEZUN' ? educationStatus : 'OTHER';
  const starCount=tanidikStarCount(educationStatus);
  return <View accessible accessibilityLabel={`${name}${tanidik ? anonymous ? ', Tanıdık' : `, Tanıdık, ${starCount} yıldız` : ''}`} className={sizes({size,tanidik})}>
    {tanidik && <View className="absolute -inset-[3px] rounded-full border-[3px] border-avatar-halo" />}
    <View className={`h-full w-full items-center justify-center rounded-full border-2 ${tanidik ? 'border-gold bg-surface' : size === 'profile' ? profileSurface[education] : 'border-primary bg-surface'}`}>
      <Text variant="unstyled" className={initials({education,size})}>{anonymous ? '?' : name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toLocaleUpperCase('tr')}</Text>
    </View>
    {tanidik && !anonymous && <View className={badge({size})} style={{ width: badgeWidth[size], height: starCount * starLineHeight[size] + 4 }}>
      {Array.from({ length: starCount }, (_, index) => <Text key={index} variant="unstyled" className={star({size})} style={{ lineHeight: starLineHeight[size], includeFontPadding: false }}>★</Text>)}
    </View>}
  </View>;
}
