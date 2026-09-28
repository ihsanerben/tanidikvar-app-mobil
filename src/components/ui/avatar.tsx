import { View } from 'react-native';
import { Text } from './text';
import { cva } from 'class-variance-authority';
const sizes = cva('relative shrink-0 items-center justify-center', { variants: {
  size: { small: 'h-avatar-question w-avatar-question', ranking: 'h-avatar-ranking w-avatar-ranking', medium: 'h-12 w-12', account: 'h-16 w-16', large: 'h-20 w-20' },
  tanidik: { true: 'mr-3', false: '' },
} });
const initials = cva('text-center font-bold', { variants: {
  education: { YKS_ADAYI: 'text-candidate', UNIVERSITE_OGRENCISI: 'text-profile-student', MEZUN: 'text-graduate', OTHER: 'text-member' },
  size: { small: 'text-[10px] leading-3', ranking: 'text-body', medium: 'text-[15px] leading-5', account: 'text-[17px] leading-6', large: 'text-[22px] leading-7' },
} });
const badge = cva('absolute top-1/2 -translate-y-1/2 items-center justify-center border border-gold bg-surface rounded-r-[4px]', { variants: {
  size: { small: '-right-2.5 w-avatar-badge h-avatar-badge-small-height', ranking: '-right-2 w-avatar-badge-ranking h-avatar-badge-ranking-height', medium: '-right-[11px] w-avatar-badge-admin h-avatar-badge-admin-height', account: '-right-3 w-avatar-badge-account h-avatar-badge-account-height', large: '-right-2.5 w-avatar-badge-profile h-avatar-badge-profile-height' },
} });
const star = cva('text-center text-gold', { variants: { size: { small: 'text-avatar-star', ranking: 'text-avatar-star-ranking', medium: 'text-avatar-star-admin', account: 'text-avatar-star-account', large: 'text-avatar-star' } } });
export function Avatar({ name = 'Üye', educationStatus, tanidik = false, size = 'medium' }: { name?: string; educationStatus?: string; tanidik?: boolean; size?: 'small' | 'ranking' | 'medium' | 'account' | 'large' }) {
  const education = educationStatus === 'YKS_ADAYI' || educationStatus === 'UNIVERSITE_OGRENCISI' || educationStatus === 'MEZUN' ? educationStatus : 'OTHER';
  return <View accessible accessibilityLabel={`${name}${tanidik ? ', Tanıdık, 3 yıldız' : ''}`} className={sizes({size,tanidik})}>
    {tanidik && <View className="absolute -inset-[3px] rounded-full border-[3px] border-avatar-halo" />}
    <View className={`h-full w-full items-center justify-center rounded-full border-2 bg-surface ${tanidik ? 'border-gold' : 'border-primary'}`}>
      <Text variant="unstyled" className={initials({education,size})}>{name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toLocaleUpperCase('tr')}</Text>
    </View>
    {tanidik && <View className={badge({size})}><Text variant="unstyled" className={star({size})}>{'★\n★\n★'}</Text></View>}
  </View>;
}
