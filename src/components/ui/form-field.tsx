import { TextInput, type TextInputProps, View } from "react-native";
import { Text } from "./text";
import { theme, fontFamily } from '@/lib/theme';

type Props = TextInputProps & { label: string; error?: string };
export function FormField({ label, error, ...input }: Props) {
  return (
    <View className="gap-2">
      <Text className="text-caption font-semibold text-text">{label}</Text>
      <TextInput
        {...input}
        style={[{fontFamily},input.style]}
        accessibilityLabel={label}
        placeholderTextColor={theme.muted}
        textAlignVertical={input.multiline ? 'top' : 'center'}
        className={`min-h-control-large rounded-control border border-border bg-surface px-2.5 py-2 text-base text-text focus:border-primary ${input.multiline ? 'min-h-28' : ''}`}
      />
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
