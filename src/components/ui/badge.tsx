import { View } from "react-native";
import { Text } from "./text";
export function Badge({ label }: { label: string }) {
  return (
    <View className="self-start rounded-full bg-primary-soft px-3 py-1">
      <Text variant="muted" className="font-semibold text-primary">
        {label}
      </Text>
    </View>
  );
}
