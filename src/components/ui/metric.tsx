import { View } from 'react-native';
import { Text } from './text';
export function Metric({ label, value, inset = false }: { label: string; value?: string | number | null; inset?: boolean }) {
  return <View className={inset ? 'min-w-0 flex-1 gap-1 rounded-control bg-account-summary p-2' : 'min-w-0 flex-1 gap-1 rounded-control border border-border bg-surface p-2.5'}><Text variant="unstyled" className="text-metadata text-muted">{label}</Text><Text variant="heading">{typeof value === 'number' ? value.toLocaleString('tr-TR', { maximumFractionDigits: 3 }) : value ?? 'Veri yok'}</Text></View>;
}
