import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { Icon } from './icon';
import { BottomSheet } from './bottom-sheet';
export function ActionsMenu({ children, title = 'İçerik işlemleri', popover = false, kind = 'answer' }: { children: ReactNode | ((close: () => Promise<void>) => ReactNode); title?: string; subtle?: boolean; popover?: boolean; kind?: 'question' | 'answer' }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<View>(null);
  const { width, height } = useWindowDimensions();
  const [position, setPosition] = useState({ top: 0, right: 8 });
  const [dismissals] = useState(() => new Set<() => void>());
  const dismissed = () => { dismissals.forEach(resolve => resolve()); dismissals.clear(); };
  const close = () => {
    if (!open) return Promise.resolve();
    const completion = new Promise<void>(resolve => dismissals.add(resolve));
    setOpen(false);
    return completion;
  };
  // iOS must finish dismissing its view controller before presenting Share.
  // Android/web do not provide the native onDismiss lifecycle event.
  useEffect(() => { if (!open && Platform.OS !== 'ios') { dismissals.forEach(resolve => resolve()); dismissals.clear(); } }, [open, dismissals]);
  const content = typeof children === 'function' ? children(close) : children;
  const show = () => {
    if (!popover) { setOpen(true); return; }
    trigger.current?.measureInWindow((x, y, triggerWidth, triggerHeight) => {
      const menuWidth = kind === 'question' ? 124 : 140;
      setPosition({ top: Math.max(8, Math.min(y + triggerHeight + (kind === 'question' ? 8 : 7), height - 190)), right: Math.max(8, Math.min(width - x - triggerWidth, width - menuWidth - 8)) });
      setOpen(true);
    });
  };
  return <View ref={trigger}><Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} onPress={show} className="min-h-touch-ios android:min-h-touch-android min-w-touch-ios android:min-w-touch-android items-center justify-center rounded-full active:bg-menu-hover"><Icon name="more" tone="muted" size={kind === 'question' ? 21 : 23} /></Pressable>
    {popover ? <Modal visible={open} transparent animationType="none" onRequestClose={() => { void close(); }} onDismiss={dismissed}>
      <View className="flex-1"><Pressable accessibilityRole="button" accessibilityLabel="İşlem menüsünü kapat" className="absolute inset-0" onPress={close} />
        <View accessibilityRole="menu" accessibilityLabel={title} style={{ position: 'absolute', top: position.top, right: position.right, width: kind === 'question' ? 124 : 140 }} className="rounded-control border border-menu-border bg-surface p-0.5 shadow-lg">{content}</View>
      </View>
    </Modal> : <BottomSheet visible={open} title={title} close={close} onDismiss={dismissed}>{content}</BottomSheet>}
  </View>;
}
