import { View } from 'react-native';
import { Text } from './text';
export function Metric({ label, value }: { label: string; value?: string | number | null }) {
  return <View className="min-w-0 flex-1 gap-1 rounded-control border border-border bg-surface p-3"><Text variant="muted">{label}</Text><Text variant="heading">{typeof value === 'number' ? value.toLocaleString('tr-TR', { maximumFractionDigits: 3 }) : value ?? 'Veri yok'}</Text></View>;
}
