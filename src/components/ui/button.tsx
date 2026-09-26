import { Platform, Pressable, View } from "react-native";
import { Text } from "./text";
import { cva } from "class-variance-authority";
const styles = cva(
  "items-center justify-center rounded-control border px-2.5 py-1.5",
  {
    variants: {
      variant: {
        primary: "border-primary bg-primary",
        secondary: "border-secondary-border bg-surface",
        danger: "border-danger-border bg-danger-soft",
      },
      size: { compact: 'min-h-control-compact', standard: 'min-h-control-standard', large: 'min-h-control-large px-3 py-2' },
    },
    defaultVariants: { variant: "primary", size: 'compact' },
  },
);
const target = cva('justify-center active:opacity-80', { variants: {
  fullWidth: { true: 'self-stretch', false: 'self-start' },
  disabled: { true: 'opacity-50', false: '' },
  platform: { ios: 'min-h-touch-ios min-w-touch-ios', android: 'min-h-touch-android min-w-touch-android' },
} });
const labelStyle = cva('text-center font-semibold', { variants: {
  variant: { primary: 'text-primary-foreground', secondary: 'text-primary', danger: 'text-danger-text' },
  size: { compact: 'text-metadata', standard: 'text-metadata', large: 'text-caption' },
} });
export function Button({
  label,
  onPress,
  disabled = false,
  testID,
  variant = "primary",
  pending = false,
  size = 'compact',
  fullWidth = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  variant?: "primary" | "secondary" | "danger";
  pending?: boolean;
  size?: 'compact' | 'standard' | 'large';
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || pending, busy: pending }}
      className={target({ fullWidth, disabled: disabled || pending, platform: Platform.OS === 'android' ? 'android' : 'ios' })}
      disabled={disabled || pending}
      onPress={onPress}
      testID={testID}
    >
      <View pointerEvents="none" className={styles({ variant, size })}>
      <Text className={labelStyle({ variant, size })}>
        {pending ? "İşlem yapılıyor…" : label}
      </Text>
      </View>
    </Pressable>
  );
}
