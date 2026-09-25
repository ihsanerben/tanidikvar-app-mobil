import { View } from "react-native";
import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";
import { ApiError } from "../../../packages/api-client/errors";
import { Text } from "./text";
import { Button } from "./button";
import { Card } from "./card";
export function Skeleton() {
  return (
    <View
      accessibilityLabel="İçerik yükleniyor"
      accessibilityState={{ busy: true }}
      className="gap-4 py-4"
    >
      <View className="h-6 w-2/3 rounded-control bg-border" />
      <View className="h-24 rounded-card bg-border" />
      <View className="h-24 rounded-card bg-border" />
    </View>
  );
}
export function EmptyState({
  title = "Henüz içerik yok",
  description = "Farklı bir arama veya filtre deneyebilirsin.",
  action,
  label = "Yenile",
}: {
  title?: string;
  description?: string;
  action?: () => void;
  label?: string;
}) {
  return (
    <Card>
      <Text variant="heading">{title}</Text>
      <Text variant="muted">{description}</Text>
      {action && <Button label={label} onPress={action} variant="secondary" />}
    </Card>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <Card>
      <Text accessibilityRole="alert" className="text-danger">
        {error instanceof ApiError
          ? error.message
          : "İşlem tamamlanamadı. Lütfen tekrar dene."}
      </Text>
      {error instanceof ApiError && error.requestId && (
        <Text variant="muted">Destek kodu: {error.requestId}</Text>
      )}
      {retry && (
        <Button label="Tekrar dene" onPress={retry} variant="secondary" />
      )}
    </Card>
  );
}
export function useOffline() {
  return !useSyncExternalStore(onlineManager.subscribe, () => onlineManager.isOnline(), () => true);
}
export function OfflineBanner() {
  return useOffline() ? (
    <View testID="offline-banner" className="rounded-control bg-surface p-3">
      <Text accessibilityRole="alert" className="text-warning">
        Bağlantı yok. Son görülen içerik gösteriliyor; işlemler için yeniden
        bağlan.
      </Text>
    </View>
  ) : null;
}
