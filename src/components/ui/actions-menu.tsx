import { useState, type PropsWithChildren } from 'react';
import { Button } from './button';
import { View } from 'react-native';
export function ActionsMenu({ children, title = 'İçerik işlemleri' }: PropsWithChildren<{ title?: string }>) {
  const [open, setOpen] = useState(false);
  return <View className="gap-3"><Button label={`⋯ ${title}${open ? ' · Kapat' : ''}`} variant="secondary" onPress={() => setOpen(value => !value)} />{open && <View className="gap-3 rounded-card border border-border bg-surface p-3">{children}</View>}</View>;
}
