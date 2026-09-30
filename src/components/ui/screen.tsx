import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";
import { AppHeader } from './app-header';

cssInterop(SafeAreaView, { className: "style" });

export function Screen({ children, wide = false }: PropsWithChildren<{wide?:boolean}>) {
  return (
    <SafeAreaView className="flex-1 bg-page" edges={["top", "bottom", "left", "right"]}>
      <AppHeader />
      <View className={wide ? "w-full max-w-profile flex-1 self-center px-2 pt-page-top pb-3" : "w-full max-w-content flex-1 self-center px-gutter pt-page-top pb-3"}>{children}</View>
    </SafeAreaView>
  );
}
