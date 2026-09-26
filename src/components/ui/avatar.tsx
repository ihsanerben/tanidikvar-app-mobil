import { View } from "react-native";
import { Text } from "./text";
import { cva } from 'class-variance-authority';
const avatar = cva('items-center justify-center rounded-full', { variants: { tanidik: { true: 'border-2 border-gold', false: '' }, education: { YKS_ADAYI: 'bg-candidate-soft', UNIVERSITE_OGRENCISI: 'bg-student-soft', MEZUN: 'bg-graduate-soft', OTHER: 'bg-primary-soft' }, size: { small: 'h-8 w-8', medium: 'h-12 w-12', account: 'h-16 w-16', large: 'h-20 w-20' } }, defaultVariants: { size: 'medium' } });
const initials = cva('font-bold', { variants: { education: { YKS_ADAYI: 'text-candidate', UNIVERSITE_OGRENCISI: 'text-student', MEZUN: 'text-graduate', OTHER: 'text-primary' } } });
export function Avatar({ name = "Üye", educationStatus, tanidik = false, size = 'medium' }: { name?: string; educationStatus?: string; tanidik?: boolean; size?: 'small' | 'medium' | 'account' | 'large' }) {
  const education = educationStatus === 'YKS_ADAYI' || educationStatus === 'UNIVERSITE_OGRENCISI' || educationStatus === 'MEZUN' ? educationStatus : 'OTHER';
  const stars = education === 'MEZUN' ? 3 : education === 'UNIVERSITE_OGRENCISI' ? 2 : 1;
  return (
    <View
      accessibilityLabel={name}
      className={avatar({ tanidik, size, education })}
    >
      <Text className={initials({ education, className: size === 'small' ? 'text-metadata' : size === 'large' ? 'text-xl' : 'text-body' })}>
        {name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toLocaleUpperCase("tr")}
      </Text>
      {tanidik && <View className="absolute -right-2 top-1 rounded-control border border-gold bg-surface px-0.5"><Text className="text-[7px] text-gold" accessibilityLabel={`Tanıdık, ${stars} yıldız`}>{Array.from({ length: stars }, () => '★').join('\n')}</Text></View>}
    </View>
  );
}
