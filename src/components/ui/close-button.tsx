import { Platform, Pressable, View } from 'react-native';
import { Icon } from './icon';

export function CloseButton({onPress,label='Pencereyi kapat'}:{onPress:()=>void;label?:string}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    className={`${Platform.OS==='android' ? 'min-h-touch-android min-w-touch-android' : 'min-h-touch-ios min-w-touch-ios'} shrink-0 items-center justify-center self-start active:opacity-70`}>
    <View className="h-7 w-7 items-center justify-center rounded-full border border-border bg-primary-soft"><Icon name="close" tone="primary" /></View>
  </Pressable>;
}
