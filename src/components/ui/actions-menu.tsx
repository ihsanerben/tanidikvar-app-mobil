import { useState, type PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from './icon';
import { BottomSheet } from './bottom-sheet';
export function ActionsMenu({ children, title = 'İçerik işlemleri' }: PropsWithChildren<{ title?: string }>) {
  const [open, setOpen] = useState(false);
  return <View><Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} className="min-h-touch-ios android:min-h-touch-android min-w-touch-ios android:min-w-touch-android items-center justify-center rounded-control active:opacity-80"><Icon name="more" tone="primary" /></Pressable>
    <BottomSheet visible={open} title={title} close={() => setOpen(false)}>{children}</BottomSheet>
  </View>;
}
