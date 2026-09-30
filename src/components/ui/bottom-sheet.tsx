import { createContext, useContext, useRef, type PropsWithChildren } from "react";
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
import { CloseButton } from "./close-button";
import { Text } from "./text";
export const DialogContentContext = createContext(false);
// Kept as a compatibility name: public web overlays are centered dialogs,
// not bottom drawers. All callers share this single surface.
export function BottomSheet({
  visible,
  title,
  close,
  children,
  scroll = true,
  onDismiss,
  placement = "center",
}: PropsWithChildren<{ visible: boolean; title: string; close: () => void; scroll?: boolean; onDismiss?: () => void; placement?: "center" | "menu" }>) {
  const titleRef = useRef<View>(null);
  const insideDialog = useContext(DialogContentContext);
  // Pickers and confirmations opened from a dialog stay in its native modal.
  if (insideDialog) return visible ? <View className="gap-3 rounded-card border border-border bg-surface p-3"><View className="flex-row items-center justify-between gap-2"><Text variant="heading" className="min-w-0 flex-1">{title}</Text><CloseButton onPress={close} /></View>{children}</View> : null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      onDismiss={onDismiss}
      onShow={() => { if (titleRef.current) AccessibilityInfo.sendAccessibilityEvent?.(titleRef.current, "focus"); }}
    >
      <SafeAreaView className="flex-1 bg-overlay/60" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className={placement === "menu" ? "flex-1 items-end justify-start px-gutter pb-4 pt-header-height" : "flex-1 items-center justify-center p-4"}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pencerenin dışına dokunarak kapat"
          onPress={close}
          className="absolute inset-0"
        />
        <View
          className={placement === "menu" ? "max-h-[85%] w-full max-w-menu rounded-dialog border border-border bg-surface" : "max-h-[85%] w-full max-w-dialog rounded-dialog border border-border bg-surface"}
        >
          <View accessibilityViewIsModal className="shrink gap-3 px-dialog-x py-dialog-y">
            <View className="relative min-h-7 shrink-0 justify-center pr-9">
              <View ref={titleRef} accessible={!!title} accessibilityRole={title ? "header" : undefined} accessibilityLabel={title || undefined} className="min-w-0 flex-1">{!!title && <Text variant="heading" className="text-dialog-title">{title}</Text>}</View>
              <View className="absolute -right-1 -top-2"><CloseButton onPress={close} /></View>
            </View>
            <DialogContentContext.Provider value={true}>
            {scroll ? <ScrollView showsVerticalScrollIndicator={false} className="shrink" keyboardShouldPersistTaps="handled" contentContainerClassName={placement === "menu" ? "gap-1" : "gap-3"}>{children}</ScrollView> : children}
            </DialogContentContext.Provider>
          </View>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
