import { Pressable, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { ErrorState, useOffline } from './states';

export function StatAction({ icon, count, label, selected, disabled, action, onPress, compact = false }: {
  icon: IconName; count?: number; label: string; selected?: boolean; disabled?: boolean;
  action?: () => Promise<unknown>; onPress?: () => void; compact?: boolean;
}) {
  const offline = useOffline();
  const mutation = useMutation({ mutationFn: async () => action?.(), retry: 0 });
  return <View style={compact ? { marginHorizontal: -2 } : undefined}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled: !!disabled, busy: mutation.isPending }} disabled={disabled || mutation.isPending || (!!action && offline)} onPress={() => action ? mutation.mutate() : onPress?.()} hitSlop={compact ? { left: 6, right: 6 } : undefined} className={`min-h-touch-ios android:min-h-touch-android ${compact ? 'min-w-[30px] gap-0.5' : 'min-w-touch-ios gap-1'} flex-row items-center justify-center active:opacity-70`}>
      <Icon name={icon} tone={selected ? (icon === 'heart' ? 'liked' : 'primary') : 'muted'} /><Text variant="unstyled" className={selected ? 'text-metadata font-bold text-primary' : 'text-metadata text-muted'}>{count == null ? '' : count.toLocaleString('tr-TR')}</Text>
    </Pressable>
    {mutation.isError && <ErrorState error={mutation.error} retry={() => mutation.reset()} />}
  </View>;
}
