import { Platform, Pressable, View } from 'react-native';
import { cva } from 'class-variance-authority';
import { Text } from './text';

const row = cva('flex-row items-center gap-3 rounded-control border px-3 py-2 active:opacity-80', {
  variants: {
    selected: { true: 'border-primary bg-primary-soft', false: 'border-border bg-surface' },
    platform: { ios: 'min-h-touch-ios', android: 'min-h-touch-android' },
  },
});
export function RadioGroup<T extends string>({ label, value, options, onChange, disabled = false, error }: {
  label: string;
  value: T;
  options: { value: T; label: string; detail?: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  error?: string;
}) {
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} className="gap-2">
    {options.map(option => <Pressable key={option.value} accessibilityRole="radio"
      accessibilityLabel={[option.label, option.detail].filter(Boolean).join(', ')}
      accessibilityState={{ checked: value === option.value, disabled }} disabled={disabled}
      onPress={() => onChange(option.value)}
      className={row({ selected: value === option.value, platform: Platform.OS === 'android' ? 'android' : 'ios' })}>
      <View accessible={false} className="h-4 w-4 items-center justify-center rounded-full border border-primary">
        {value === option.value && <View className="h-2 w-2 rounded-full bg-primary" />}
      </View>
      <Text className="min-w-0 flex-1 text-excerpt">{option.label}</Text>
      {!!option.detail && <Text variant="label">{option.detail}</Text>}
    </Pressable>)}
    {!!error && <Text accessibilityRole="alert" className="text-caption text-danger">{error}</Text>}
  </View>;
}
