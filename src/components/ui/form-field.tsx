import type { Ref } from "react";
import { cva } from "class-variance-authority";
import { TextInput, type TextInputProps, View } from "react-native";
import { Text } from "./text";
import { theme, fontFamily } from '@/lib/theme';

const fieldStyle = cva('rounded-control border px-2.5 text-text', {
  variants: {
    compact: { true: 'min-h-control-compact py-1.5 text-caption', false: 'min-h-control-large py-2 text-body' },
    invalid: { true: 'border-danger focus:border-danger', false: 'border-border focus:border-primary' },
    multiline: { true: 'min-h-28', false: '' },
    disabled: { true: 'bg-account-summary', false: '' },
  },
});
type Props = TextInputProps & { label: string; error?: string; hideLabel?: boolean; compact?: boolean; ref?: Ref<TextInput> };
export function FormField({ label, error, hideLabel = false, compact = false, ...input }: Props) {
  return (
    <View className={compact ? "gap-1" : "gap-2"}>
      {!hideLabel && <Text className="text-caption font-semibold text-muted">{label}</Text>}
      <TextInput
        {...input}
        style={[{fontFamily},input.style]}
        accessibilityLabel={input.accessibilityLabel ?? label}
        accessibilityHint={[input.accessibilityHint, error].filter(Boolean).join(". ") || undefined}
        placeholderTextColor={theme.muted}
        textAlignVertical={input.multiline ? 'top' : 'center'}
        className={fieldStyle({ compact, invalid: !!error, multiline: !!input.multiline, disabled: input.editable === false, className: input.editable === false ? undefined : compact ? "bg-filter-field" : "bg-surface" })}
      />
      {error ? (
        <Text accessibilityRole="alert" className="text-caption text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
