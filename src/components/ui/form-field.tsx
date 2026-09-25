import { Text, TextInput, type TextInputProps, View } from "react-native";

type Props = TextInputProps & { label: string; error?: string };
export function FormField({ label, error, ...input }: Props) {
  return (
    <View className="gap-2">
      <Text className="text-base font-medium text-text">{label}</Text>
      <TextInput
        {...input}
        accessibilityLabel={label}
        className="min-h-12 rounded-control border border-border bg-surface px-4 py-3 text-base text-text"
      />
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
