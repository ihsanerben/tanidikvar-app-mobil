import { View } from "react-native";
import { Text } from "./text";
export function Avatar({ name = "Üye" }: { name?: string }) {
  return (
    <View
      accessibilityLabel={name}
      className="min-h-12 min-w-12 items-center justify-center rounded-full bg-primary-soft p-3"
    >
      <Text className="font-bold text-primary">
        {name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toLocaleUpperCase("tr")}
      </Text>
    </View>
  );
}
