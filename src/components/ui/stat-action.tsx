import { Pressable, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { ErrorState, useOffline } from './states';

export function StatAction({ icon, count, label, selected, disabled, action, onPress }: {
  icon: IconName; count?: number; label: string; selected?: boolean; disabled?: boolean;
  action?: () => Promise<unknown>; onPress?: () => void;
}) {
  const offline = useOffline();
  const mutation = useMutation({ mutationFn: async () => action?.(), retry: 0 });
  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled: !!disabled, busy: mutation.isPending }} disabled={disabled || mutation.isPending || (!!action && offline)} onPress={() => action ? mutation.mutate() : onPress?.()} className="min-h-touch-ios android:min-h-touch-android min-w-touch-ios flex-row items-center justify-center gap-1 active:opacity-70">
      <Icon name={icon} tone={selected ? 'primary' : 'muted'} /><Text variant="unstyled" className={selected ? 'text-metadata font-bold text-primary' : 'text-metadata text-muted'}>{count == null ? '' : count.toLocaleString('tr-TR')}</Text>
    </Pressable>
    {mutation.isError && <ErrorState error={mutation.error} retry={() => mutation.reset()} />}
  </View>;
}
