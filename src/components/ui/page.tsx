import type { PropsWithChildren } from "react";
import {
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Screen } from "./screen";
import { Text } from "./text";
import { OfflineBanner } from "./states";
import { Help } from "./help";
import { AppFooter } from "./app-footer";
export function PageHeader({
  title,
  back = true,
  help,
  action,
}: {
  title: string;
  back?: boolean;
  help?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="gap-3 pb-4">
      {back && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Önceki sayfaya dön"
          className="min-h-11 self-start justify-center"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        ><Text variant="muted" className="text-primary underline">← Geri</Text></Pressable>
      )}
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-1">
          <Text variant="title" className="shrink">{title}</Text>
          {help && <Help title={title} description={help} />}
        </View>
        {action}
      </View>
      <OfflineBanner />
    </View>
  );
}
export function Page({
  title,
  children,
  back = true,
  refresh,
  refreshing = false,
  help,
}: PropsWithChildren<{
  title: string;
  back?: boolean;
  refresh?: () => void;
  refreshing?: boolean;
  help?: string;
}>) {
  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 pb-10"
          refreshControl={
            refresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            ) : undefined
          }
        >
          <PageHeader title={title} back={back} help={help} />
          {children}
          <AppFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
