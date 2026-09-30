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
import { BrandFooter } from "./brand-footer";
export function PageHeader({
  title,
  eyebrow,
  back = true,
  help,
  action,
  backHref,
  backLabel = "Geri",
}: {
  title: string;
  eyebrow?: string;
  back?: boolean;
  help?: string;
  action?: React.ReactNode;
  backHref?: Href;
  backLabel?: string;
}) {
  return (
    <View className="gap-2 pb-1">
      {back && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={backLabel === "Geri" ? "Önceki sayfaya dön" : backLabel}
          className={Platform.OS === "android" ? "min-h-touch-android min-w-touch-android self-start justify-center" : "min-h-touch-ios min-w-touch-ios self-start justify-center"}
          onPress={() =>
            backHref ? router.push(backHref) : router.canGoBack() ? router.back() : router.replace("/")
          }
        ><Text variant="muted" className="text-primary underline">← {backLabel}</Text></Pressable>
      )}
      {eyebrow && <Text variant="unstyled" className="text-metadata font-semibold uppercase tracking-widest text-muted">{eyebrow}</Text>}
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
  eyebrow,
  children,
  back = true,
  refresh,
  refreshing = false,
  help,
  backHref,
  backLabel,
  scrollRef,
  compact = false,
}: PropsWithChildren<{
  title: string;
  eyebrow?: string;
  back?: boolean;
  refresh?: () => void;
  refreshing?: boolean;
  help?: string;
  backHref?: Href;
  backLabel?: string;
  scrollRef?:React.Ref<ScrollView>;
  compact?: boolean;
}>) {
  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName={compact ? "gap-2.5 pb-8" : "gap-4 pb-10"}
          refreshControl={
            refresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            ) : undefined
          }
        >
          <PageHeader title={title} eyebrow={eyebrow} back={back} help={help} backHref={backHref} backLabel={backLabel} />
          {children}
          <BrandFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
