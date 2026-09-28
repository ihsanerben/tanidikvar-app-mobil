import { View } from "react-native";
import { Text } from "./text";
const tones = {
  success: { surface: "bg-primary-soft", text: "text-primary" },
  warning: { surface: "bg-account-summary", text: "text-warning" },
  danger: { surface: "bg-danger-soft", text: "text-danger-text" },
  neutral: { surface: "bg-account-summary", text: "text-muted" },
};
export function Badge({ label, tone = "success" }: { label: string; tone?: keyof typeof tones }) {
  return <View className={"self-start rounded-full px-2.5 py-1 " + tones[tone].surface}>
    <Text variant="unstyled" className={"text-metadata font-semibold " + tones[tone].text}>{label}</Text>
  </View>;
}
