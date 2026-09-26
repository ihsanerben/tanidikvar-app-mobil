import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Brand } from "./brand";
import { Text } from "./text";

const links = [
  { label: "Üniversiteler", open: () => router.push("/kesfet") },
  { label: "Programlar", open: () => router.push({ pathname: "/kesfet", params: { kind: "programs" } }) },
  { label: "İstatistikler", open: () => router.push("/statistics") },
  { label: "İletişim", open: () => router.push("/about") },
  { label: "Sistem durumu ↗", open: () => router.push("/status") },
];
export function AppFooter() {
  return <View className="mt-6 gap-3 border-t border-border py-5">
    <Pressable accessibilityRole="link" accessibilityLabel="TanıdıkVar sorular sayfası" onPress={() => router.push("/")} className="min-h-11 self-start justify-center"><Brand /></Pressable>
    <Text variant="muted">Kariyer yolunda bir tanıdığın olsun.</Text>
    <View className="flex-row flex-wrap gap-x-4 gap-y-1">{links.map(link => <Pressable key={link.label} accessibilityRole="link" onPress={link.open} className="min-h-11 justify-center"><Text className="text-caption text-primary">{link.label}</Text></Pressable>)}</View>
  </View>;
}
