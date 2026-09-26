import { useState, type PropsWithChildren } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Icon } from './icon';
import { Text } from './text';
export function ActionsMenu({ children, title = 'İçerik işlemleri' }: PropsWithChildren<{ title?: string }>) {
  const [open, setOpen] = useState(false);
  return <View className="gap-2"><Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} className={Platform.OS === 'android' ? 'min-h-touch-android min-w-touch-android self-end items-center justify-center rounded-control active:opacity-80' : 'min-h-touch-ios min-w-touch-ios self-end items-center justify-center rounded-control active:opacity-80'}><Icon name="more" tone="primary" /></Pressable>
    {open && <View className="gap-2 rounded-card border border-border bg-surface p-3"><Text variant="muted">{title}</Text>{children}</View>}
  </View>;
}
