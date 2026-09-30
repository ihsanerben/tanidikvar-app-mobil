import { View } from 'react-native';
import { Text } from './text';
export function Metric({ label, value, inset = false, compact = false }: { label: string; value?: string | number | null; inset?: boolean; compact?: boolean }) {
  return <View className={inset ? 'min-w-0 flex-1 gap-1 rounded-control bg-account-summary p-2' : compact ? 'min-w-0 flex-1 rounded-control border border-border bg-surface p-1' : 'min-w-0 flex-1 gap-1 rounded-control border border-border bg-surface p-2.5'}><Text variant="unstyled" numberOfLines={1} className={compact ? "text-[9px] text-muted" : "text-metadata text-muted"}>{label}</Text><Text variant={compact ? "unstyled" : "heading"} className={compact ? "text-[11px] font-semibold text-primary" : undefined}>{typeof value === 'number' ? value.toLocaleString('tr-TR', { maximumFractionDigits: 3 }) : value ?? 'Veri yok'}</Text></View>;
}
