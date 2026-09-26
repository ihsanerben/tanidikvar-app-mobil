import { vars } from "nativewind";
import { useState, type PropsWithChildren } from "react";
import { Redirect, router, Slot } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { useCurrentUser } from "@/features/auth/use-current-user";

const managerTheme = vars({ '--color-primary':'#6A499E','--color-primary-soft':'#F3ECFA','--color-secondary-border':'#DDD7EB','--color-text':'#202638','--color-muted':'#50546A','--color-border':'#E0E3EC','--color-page':'#F4F5F9' });
const links = [
  { title: "Özet", path: "/manager" as const },
  { title: "Kullanıcılar", path: "/manager/users" as const },
  { title: "Başvurular", path: "/manager/applications" as const },
  { title: "İçerik", path: "/manager/content" as const },
  { title: "Raporlar", path: "/manager/reports" as const },
  { title: "İşlem geçmişi", path: "/manager/actions" as const },
  { title: "Grafikler", path: "/manager/analytics" as const },
  { title: "Katalog", path: "/manager/catalog" as const },
  { title: "Tagler", path: "/manager/tags" as const },
  { title: "Hesabım", path: "/manager/account" as const },
];
export function ManagerLayout() {
  const user = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  if (user.isPending) return <SafeAreaView className="flex-1 bg-manager-page p-5"><Skeleton /></SafeAreaView>;
  if (user.isError) return <SafeAreaView className="flex-1 bg-manager-page p-5"><ErrorState error={user.error} retry={() => void user.refetch()} /></SafeAreaView>;
  if (user.data.role !== "MANAGER") return <Redirect href="/profil" />;
  return <SafeAreaView style={managerTheme} className="flex-1 bg-manager-page" edges={["top", "bottom", "left", "right"]}>
    <View className="min-h-[66px] flex-row items-center gap-3 border-b border-manager-border bg-surface px-gutter">
      <Pressable accessibilityRole="button" accessibilityLabel="Yönetim menüsünü aç" onPress={() => setMenuOpen(true)} className="min-h-12 justify-center rounded-control border border-manager-border px-2.5"><Text className="text-caption text-manager-heading">Menü</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push("/manager")} className="min-h-12 min-w-0 flex-1 flex-row items-center gap-2"><Brand compact /><Text className="text-caption font-bold text-manager-heading">Yönetim</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push("/manager/account")} className="min-h-12 justify-center"><Text className="text-metadata text-manager-muted">Hesabım</Text></Pressable>
    </View>
    <View className="flex-1"><Slot /></View>
    <BottomSheet visible={menuOpen} title="Yönetim paneli" close={() => setMenuOpen(false)}>{links.map(link => <Button key={link.path} label={link.title} fullWidth variant="secondary" onPress={() => { setMenuOpen(false); router.push(link.path); }} />)}</BottomSheet>
  </SafeAreaView>;
}
export function ManagerPage({ title, children }: PropsWithChildren<{ title: string }>) {
  return <ScrollView className="flex-1" contentContainerClassName="gap-4 px-gutter py-5 pb-10"><Text variant="title" className="text-manager-text">{title}</Text>{children}</ScrollView>;
}
