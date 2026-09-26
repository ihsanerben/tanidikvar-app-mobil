import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";
import { AppHeader } from './app-header';

cssInterop(SafeAreaView, { className: "style" });

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView className="flex-1 bg-page" edges={["top", "bottom", "left", "right"]}>
      <AppHeader />
      <View className="flex-1 px-gutter pt-page-top pb-3">{children}</View>
    </SafeAreaView>
  );
}
