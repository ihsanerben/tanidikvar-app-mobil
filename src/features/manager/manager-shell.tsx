import { type PropsWithChildren } from "react";
import { Redirect, router } from "expo-router";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { openManagerWebPanel } from "@/lib/navigation/manager-web";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { useCurrentUser } from "@/features/auth/use-current-user";
export function ManagerLayout() {
  const user = useCurrentUser();
  if (user.isPending) return <SafeAreaView className="flex-1 bg-page p-5"><Skeleton /></SafeAreaView>;
  if (user.isError) return <SafeAreaView className="flex-1 bg-page p-5"><ErrorState error={user.error} retry={() => void user.refetch()} /></SafeAreaView>;
  if (user.data.role !== "MANAGER") return <Redirect href="/profil" />;
  return <SafeAreaView className="flex-1 bg-page p-5" edges={["top", "bottom", "left", "right"]}><Card><Text variant="title">Yönetim paneli</Text><Text>Yönetici işlemleri web panelinden yürütülür.</Text><ActionButton label="Web panelini aç ↗" action={openManagerWebPanel} /><Button label="Ana sayfaya dön" variant="secondary" onPress={() => router.replace("/")} /></Card></SafeAreaView>;
}
export function ManagerPage({ title, children }: PropsWithChildren<{ title: string }>) {
  return <ScrollView className="flex-1" contentContainerClassName="gap-4 px-gutter py-5 pb-10"><Text variant="title" className="text-manager-text">{title}</Text>{children}</ScrollView>;
}

// The parent layout owns every legacy target and only offers web access.
export function ManagerLegacyRoute() { return null; }
