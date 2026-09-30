import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Button } from './button';
import { BottomSheet } from './bottom-sheet';
import { Text } from './text';
export function Help({ title, description }: { title: string; description: string }) {
  const [open, setOpen] = useState(false);
  return <><Pressable accessibilityRole="button" accessibilityLabel={`${title} hakkında bilgi`} className={Platform.OS === 'android' ? 'min-h-touch-android min-w-touch-android items-center justify-center active:opacity-80' : 'min-h-touch-ios min-w-touch-ios items-center justify-center active:opacity-80'} onPress={() => setOpen(true)}><View className="h-[21px] w-[21px] items-center justify-center rounded-full border border-secondary-border bg-surface"><Text className="text-[11px] font-semibold text-primary">?</Text></View></Pressable><BottomSheet visible={open} title={title} close={() => setOpen(false)}><Text variant="muted">{description}</Text><Button label="Anladım" onPress={() => setOpen(false)} /></BottomSheet></>;
}
