import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { cva } from "class-variance-authority";
import { Text } from "@/components/ui/text";
import { ErrorState, useOffline } from "@/components/ui/states";
import { destinationHref } from "@/lib/navigation/destination";
import { notificationKeys, readNotification, type Notification } from "./api";
import { notificationDestination } from "./destination";

const row = cva('rounded-card border border-notification-border', {
  variants: { unread: { true: 'border-notification-unread-border border-l-4 bg-notification-unread', false: 'bg-surface' } },
});
export function NotificationRow({ item }: { item: Notification }) {
  return <NotificationContent key={item.id} item={item} />;
}
function NotificationContent({ item }: { item: Notification }) {
  const client = useQueryClient();
  const target = notificationDestination(item);
  const offline = useOffline();
  const read = useMutation({ mutationFn: () => readNotification(item.id!), retry: 0,
    onSuccess: () => client.invalidateQueries({ queryKey: notificationKeys.all }) });
  return <View className="gap-2"><View className={row({ unread: !item.readAt })}>
    <Pressable accessibilityRole={target ? 'link' : 'button'}
      accessibilityLabel={`${item.readAt ? '' : 'Okunmamış: '}${item.title ?? 'Bildirim'}`}
      testID={`notification-open-${item.id}`} className="min-h-touch-android flex-row items-center gap-2.5 p-3 active:opacity-80"
      disabled={read.isPending || offline || !item.id || (!target && !!item.readAt)}
      onPress={async () => {
        if (offline || read.isPending || !item.id) return;
        try {
          if (!item.readAt) await read.mutateAsync();
          if (target) router.push(destinationHref(target));
        } catch { /* The mutation error is displayed below the card. */ }
      }}>
      <View accessible={false} className={`h-2.5 w-2.5 rounded-full border-2 ${item.readAt ? 'border-border' : 'border-notification-indicator bg-notification-indicator'}`} />
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-excerpt font-semibold text-primary">{item.title}</Text>
        <Text variant="muted">{item.body}</Text>
        <Text className="text-metadata text-muted">{item.createdAt ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt)) : ''}</Text>
      </View>
      {target && <Text accessible={false} className="text-muted">→</Text>}
    </Pressable>
  </View>
    {read.isError && <ErrorState error={read.error} retry={() => read.mutate()} />}
  </View>;
}
