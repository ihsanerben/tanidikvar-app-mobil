import { router } from "expo-router";
import { Page } from "@/components/ui/page";
import { EmptyState } from "@/components/ui/states";

export default function NotFoundScreen() {
  return <Page title="Sayfa bulunamadı"><EmptyState title="Bu sayfa bulunamadı" description="İçerik kaldırılmış veya adres değişmiş olabilir." label="Sorulara dön" action={() => router.replace("/")} /></Page>;
}
