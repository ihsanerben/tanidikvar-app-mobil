import { View, Pressable } from "react-native";
import { Text } from "./text";
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
      <Text variant="label">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: option.value === value }}
            onPress={() => onChange(option.value)}
            className={
              option.value === value
                ? "min-h-12 justify-center rounded-control bg-primary px-4 py-3"
                : "min-h-12 justify-center rounded-control border border-border bg-surface px-4 py-3"
            }
          >
            <Text
              className={
                option.value === value ? "text-primary-foreground" : "text-text"
              }
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
