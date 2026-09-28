import { Switch as NativeSwitch, Platform, type SwitchProps } from "react-native";
import { theme } from "@/lib/theme";

export function Switch(props: SwitchProps) {
  const webProps = Platform.OS === "web" ? { activeThumbColor: theme.surface } : {};
  return <NativeSwitch {...webProps} trackColor={{ false: "#DDE4DD", true: theme.primary }} thumbColor={theme.surface} ios_backgroundColor="#DDE4DD" {...props} />;
}
