import { Platform, View, Pressable } from "react-native";
import { cva } from 'class-variance-authority';
import { Text } from "./text";
const surface = cva('min-h-control-compact justify-center rounded-control border px-2.5 py-1.5', { variants: { selected: { true: 'border-primary bg-primary', false: 'border-border bg-surface' } } });
const labelStyle = cva('text-metadata', { variants: { selected: { true: 'text-primary-foreground', false: 'text-text' } } });
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-2">
      <Text variant="muted">{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row flex-wrap gap-x-2 gap-y-1">
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: option.value === value }}
            onPress={() => onChange(option.value)}
            className={Platform.OS === 'android' ? 'min-h-touch-android min-w-touch-android justify-center active:opacity-80' : 'min-h-touch-ios min-w-touch-ios justify-center active:opacity-80'}
          >
            <View className={surface({ selected: option.value === value })}>
            <Text variant="unstyled" className={labelStyle({ selected: option.value === value })}>
              {option.label}
            </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
