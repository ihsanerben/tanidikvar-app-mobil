import type { PropsWithChildren } from "react";
import {
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Pressable,
} from "react-native";
import { router, type Href } from "expo-router";
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
  backHref,
  backLabel = "Geri",
}: {
  title: string;
  back?: boolean;
  help?: string;
  action?: React.ReactNode;
  backHref?: Href;
  backLabel?: string;
}) {
  return (
    <View className="gap-3 pb-4">
      {back && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={backLabel === "Geri" ? "Önceki sayfaya dön" : backLabel}
          className="min-h-11 self-start justify-center"
          onPress={() =>
            backHref ? router.push(backHref) : router.canGoBack() ? router.back() : router.replace("/")
          }
        ><Text variant="muted" className="text-primary underline">← {backLabel}</Text></Pressable>
      )}
      {!!(title || action || help) && <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-1">
          <Text variant="title" className="shrink">{title}</Text>
          {help && <Help title={title} description={help} />}
        </View>
        {action}
      </View>}
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
  backHref,
  backLabel,
  scrollRef,
}: PropsWithChildren<{
  title: string;
  back?: boolean;
  refresh?: () => void;
  refreshing?: boolean;
  help?: string;
  backHref?: Href;
  backLabel?: string;
  scrollRef?:React.Ref<ScrollView>;
}>) {
  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 pb-10"
          refreshControl={
            refresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            ) : undefined
          }
        >
          <PageHeader title={title} back={back} help={help} backHref={backHref} backLabel={backLabel} />
          {children}
          <AppFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
