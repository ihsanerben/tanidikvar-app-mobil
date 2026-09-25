import type { PropsWithChildren } from "react";
import {
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Screen } from "./screen";
import { Text } from "./text";
import { Button } from "./button";
import { OfflineBanner } from "./states";
export function PageHeader({
  title,
  back = true,
}: {
  title: string;
  back?: boolean;
}) {
  return (
    <View className="gap-3 pb-4">
      {back && (
        <Button
          label="Geri"
          variant="secondary"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
      )}
      <Text variant="title">{title}</Text>
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
}: PropsWithChildren<{
  title: string;
  back?: boolean;
  refresh?: () => void;
  refreshing?: boolean;
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
          <PageHeader title={title} back={back} />
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
