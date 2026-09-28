import { View } from "react-native";
import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";
import { ApiError } from "../../../packages/api-client/errors";
import { Text } from "./text";
import { Button } from "./button";
import { Card } from "./card";
export function Skeleton({variant='list'}: {variant?:'list'|'profile'|'form'|'detail'|'metrics'}) {
  return <View accessibilityLabel="İçerik yükleniyor" accessibilityState={{busy:true}} className="gap-3 py-4"><View className="h-6 w-2/3 rounded-control bg-border" />
    {variant==='profile' ? <><View className="flex-row items-center gap-3"><View className="h-20 w-20 rounded-full bg-border" /><View className="min-w-0 flex-1 gap-2"><View className="h-4 rounded-control bg-border" /><View className="h-4 w-2/3 rounded-control bg-border" /></View></View><View className="h-24 rounded-card bg-border" /></> : variant==='form' ? <>{[0,1,2,3].map(index=><View key={index} className="gap-2"><View className="h-3 w-1/3 rounded-control bg-border" /><View className="h-control-large rounded-control bg-border" /></View>)}</> : variant==='metrics' ? <View className="flex-row gap-2">{[0,1,2].map(index=><View key={index} className="h-20 min-w-0 flex-1 rounded-card bg-border" />)}</View> : <><View className={variant==='detail'?'h-40 rounded-card bg-border':'h-24 rounded-card bg-border'} /><View className="h-24 rounded-card bg-border" /></>}
  </View>;
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
        Bağlantı yok. Daha önce yüklenen içerik varsa görüntüleyebilirsin. Yeni içerik ve işlemler için yeniden bağlan.
      </Text>
    </View>
  ) : null;
}
