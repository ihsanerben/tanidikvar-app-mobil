import { Platform, Pressable, View } from "react-native";
import { Text } from "./text";
import { cva } from "class-variance-authority";
import { Icon, type IconName } from './icon';
const styles = cva(
  "items-center justify-center rounded-control border",
  {
    variants: {
      variant: {
        primary: "border-primary bg-primary",
        info: "border-info-accent/30 bg-info-soft",
        suggestion: "border-info/20 bg-info/5",
        secondary: "border-secondary-border bg-surface",
        danger: "border-danger-border bg-danger-soft",
        menu: "rounded-[6px] border-transparent bg-transparent",
      },
      size: { small: 'min-h-control-small px-2 py-1', compact: 'min-h-control-compact px-2.5 py-1.5', standard: 'min-h-control-standard px-2.5 py-1.5', large: 'min-h-control-large px-3 py-2' },
    },
    defaultVariants: { variant: "primary", size: 'compact' },
  },
);
const target = cva('justify-center active:opacity-80', { variants: {
  fullWidth: { true: 'self-stretch', false: 'self-start' },
  disabled: { true: 'opacity-50', false: '' },
  platform: { ios: 'min-h-touch-ios min-w-touch-ios', android: 'min-h-touch-android min-w-touch-android' },
} });
const labelStyle = cva('text-center', { variants: {
  variant: { primary: 'text-primary-foreground', info: 'text-info-accent', suggestion: 'text-info', secondary: 'text-primary', danger: 'text-danger-text', menu: 'text-menu-text' },
  size: { small: 'text-metadata', compact: 'text-metadata', standard: 'text-metadata', large: 'text-caption' },
} });
export function Button({
  label,
  onPress,
  disabled = false,
  selected,
  testID,
  variant = "primary",
  pending = false,
  size = 'compact',
  fullWidth = false,
  icon,
  regularWeight = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  testID?: string;
  variant?: "primary" | "secondary" | "danger" | "info" | "suggestion" | "menu";
  icon?: IconName;
  regularWeight?: boolean;
  pending?: boolean;
  size?: 'small' | 'compact' | 'standard' | 'large';
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || pending, busy: pending, selected }}
      className={target({ fullWidth: variant === 'menu' || fullWidth, disabled: disabled || pending, platform: Platform.OS === 'android' ? 'android' : 'ios', className: variant === 'menu' ? 'rounded-[6px] active:bg-menu-hover' : undefined })}
      disabled={disabled || pending}
      onPress={onPress}
      testID={testID}
    >
      <View pointerEvents="none" style={variant === 'menu' ? { width: '100%', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 2 } : undefined} className={styles({ variant, size, className: variant === 'menu' ? 'min-h-[38px] flex-row gap-1.5 py-1.5 px-1' : undefined })}>
      {icon && <Icon name={icon} tone="muted" size={19} />}
      <Text variant="unstyled" style={variant === 'menu' ? { textAlign: 'left' } : undefined} className={labelStyle({ variant, size, className: regularWeight ? 'font-normal' : variant === 'menu' ? 'text-[13px] font-bold' : 'font-semibold' })}>
        {pending ? "İşlem yapılıyor…" : label}
      </Text>
      </View>
    </Pressable>
  );
}
