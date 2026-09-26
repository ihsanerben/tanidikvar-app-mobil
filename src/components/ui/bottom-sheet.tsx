import { useRef, type PropsWithChildren } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "./text";
// Kept as a compatibility name: public web overlays are centered dialogs,
// not bottom drawers. All callers share this single surface.
export function BottomSheet({
  visible,
  title,
  close,
  children,
  scroll = true,
}: PropsWithChildren<{ visible: boolean; title: string; close: () => void; scroll?: boolean }>) {
  const titleRef = useRef<View>(null);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      onShow={() => { if (titleRef.current) AccessibilityInfo.sendAccessibilityEvent(titleRef.current, "focus"); }}
    >
      <SafeAreaView className="flex-1 bg-overlay/60" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center p-4"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pencereyi kapat"
          onPress={close}
          className="absolute inset-0"
        />
        <View
          className="max-h-[85%] w-full max-w-dialog rounded-dialog border border-border bg-surface"
        >
          <View accessibilityViewIsModal className="shrink gap-3 px-dialog-x py-dialog-y">
            <View className="flex-row items-center justify-between gap-2">
              <View ref={titleRef} accessible accessibilityRole="header" accessibilityLabel={title} className="min-w-0 flex-1"><Text variant="heading" className="text-dialog-title">{title}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Pencereyi kapat" onPress={close} className={Platform.OS === 'android' ? 'min-h-touch-android min-w-touch-android items-center justify-center active:opacity-80' : 'min-h-touch-ios min-w-touch-ios items-center justify-center active:opacity-80'}><Text className="text-dialog-title text-muted">×</Text></Pressable>
            </View>
            {scroll ? <ScrollView className="shrink" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4">{children}</ScrollView> : children}
          </View>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
