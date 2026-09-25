import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "./text";
import { Button } from "./button";
export function BottomSheet({
  visible,
  title,
  close,
  children,
  scroll = true,
}: PropsWithChildren<{ visible: boolean; title: string; close: () => void; scroll?: boolean }>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-text/40"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pencereyi kapat"
          onPress={close}
          className="flex-1"
        />
        <SafeAreaView
          edges={["bottom"]}
          className="max-h-[85%] rounded-t-surface bg-page"
        >
          <View accessibilityViewIsModal className="shrink gap-4 p-5">
            <Text variant="heading">{title}</Text>
            {scroll ? <ScrollView className="shrink" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4">{children}</ScrollView> : children}
            <Button label="Kapat" onPress={close} variant="secondary" />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
