import { View } from 'react-native';
import { Brand } from './brand';
import { Text } from './text';

export function BrandFooter() {
  return <View className="items-center gap-2 border-t border-border py-5">
    <Brand dense />
    <Text variant="muted">Kariyer yolunda bir tanıdığın olsun.</Text>
  </View>;
}
