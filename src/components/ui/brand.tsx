import { View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from './text';

export function Brand({ compact = false, dense = false }: { compact?: boolean; dense?: boolean }) {
  return <View className="flex-row items-center gap-1" accessible accessibilityLabel="TanıdıkVar">
    <Image source={require('../../../assets/brand/logo-mark.svg')} style={{ width: dense ? 22 : 28, height: dense ? 22 : 28 }} contentFit="contain" />
    {!compact && <Text variant="unstyled" numberOfLines={1} className={dense ? "text-brand-small font-extrabold text-primary" : "text-brand-word font-extrabold text-primary"}>tanıdık<Text variant="unstyled" className={dense ? "text-brand-small font-extrabold text-brand-accent" : "text-brand-word font-extrabold text-brand-accent"}>var</Text></Text>}
  </View>;
}
