import { View } from 'react-native';
import { Text } from './text';
import { Image } from 'expo-image';
export function Brand({ compact = false }: { compact?: boolean }) { return <View className="flex-row items-center gap-2"><Image source={require('../../../assets/brand/logo-mark.svg')} style={{ width: 32, height: 32 }} contentFit="contain" accessibilityLabel="TanıdıkVar logosu" />{!compact && <Text variant="heading" className="text-primary">TanıdıkVar</Text>}</View>; }
