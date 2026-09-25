import { Pressable, Text } from "react-native";
import { cva } from "class-variance-authority";
const styles = cva(
  "min-h-12 items-center justify-center rounded-control px-5 py-3 active:opacity-80 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary",
        secondary: "bg-primary-soft",
        danger: "bg-danger",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);
export function Button({
  label,
  onPress,
  disabled = false,
  testID,
  variant = "primary",
  pending = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  variant?: "primary" | "secondary" | "danger";
  pending?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || pending, busy: pending }}
      className={styles({ variant })}
      disabled={disabled || pending}
      onPress={onPress}
      testID={testID}
    >
      <Text
        className={
          variant === "secondary"
            ? "text-base font-semibold text-primary"
            : "text-base font-semibold text-primary-foreground"
        }
      >
        {pending ? "İşlem yapılıyor…" : label}
      </Text>
    </Pressable>
  );
}
