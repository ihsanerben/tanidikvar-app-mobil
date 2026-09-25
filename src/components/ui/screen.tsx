import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";

cssInterop(SafeAreaView, { className: "style" });

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView className="flex-1 bg-page" edges={["top", "left", "right"]}>
      <View className="flex-1 px-5 py-6">{children}</View>
    </SafeAreaView>
  );
}
