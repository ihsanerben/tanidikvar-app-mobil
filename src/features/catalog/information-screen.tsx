import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { z } from "zod";
import { Avatar } from "@/components/ui/avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FeatureForm } from "@/components/ui/feature-form";
import { Page } from "@/components/ui/page";
import { ErrorState } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import guide from "@/data/about-guide.json";

const contact = z.object({ name: z.string().trim().min(1).max(120), email: z.email().max(254), subject: z.string().trim().min(1).max(160), message: z.string().trim().min(10).max(5000) });
const current = (value: string) => value.replaceAll("Admin", "Tanıdık").replaceAll("admin", "tanıdık");
function GuideItem({ item, index }: { item: typeof guide[number]; index: number }) {
  const [open, setOpen] = useState(false);
  return <Card><Text variant="muted">{String(index + 1).padStart(2, "0")}</Text>
    <Text variant="heading">{current(item.title)}</Text><Text>{current(item.summary)}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} className="min-h-11 justify-center"><Text className="text-primary underline">{open ? "Ayrıntıları kapat" : "Adımları ve ayrıntıları gör"}</Text></Pressable>
    {open && item.details.map(detail => <Text key={detail} variant="muted">{current(detail)}</Text>)}
  </Card>;
}
export function AboutScreen() {
  const [paletteOpen, setPaletteOpen] = useState(true);
  return <Page title="Hakkımızda">
    <Card className="overflow-hidden border-primary bg-primary-soft p-5">
      <Text className="text-metadata font-bold tracking-widest text-primary">HAKKIMIZDA</Text>
      <Text className="text-[32px] font-bold leading-9 text-primary">Kariyer yolunda bir tanıdığın olsun.</Text>
      <Text>Bir bölümü en iyi, o sıralardan geçenler anlatır. Üniversite öğrencilerinin ve mezunların deneyimleriyle kendi yolunu bul.</Text>
      <Text variant="muted">Gerçek insanlar. Birinci elden deneyimler.</Text>
      <View className="gap-3 rounded-card border border-primary bg-surface p-4">
        <Text className="text-metadata font-bold text-primary">BİR SORU, YENİ BİR BAKIŞ AÇISI.</Text>
        <View className="self-start rounded-card bg-scope-general p-3"><Text variant="muted">AKLINDAKİ SORU</Text><Text variant="heading">Benim için doğru bölüm hangisi?</Text></View>
        <View className="self-end rounded-card bg-student-soft p-3"><Text variant="heading">Bir de burada okuyanlara sor.</Text><Text variant="muted">ÖĞRENCİLER & MEZUNLAR</Text></View>
        <Text variant="muted">Senin yolun, onların deneyimi.</Text>
      </View>
    </Card>
    <Text className="text-metadata font-bold tracking-widest text-primary">TANIDIKVAR NEDİR?</Text>
    <Text variant="title">Broşürlerin ötesinde, kampüsün içinden.</Text>
    <Text>Tercih döneminde aradığın gerçek deneyimleri, öğrenci ve mezun katkılarını tek bir yerde buluşturuyoruz.</Text>
    {[["01 / KEŞFET", "Merak ettiğin yeri bul.", "Üniversite, bölüm ve konular üzerinden sana yakın sorulara ve topluluk verilerine ulaş."], ["02 / DİNLE", "Yaşayanlardan öğren.", "Topluluk ve Tanıdık yorumlarını ayrı sekmelerde oku; gerçek deneyimleri karşılaştır."], ["03 / SOR", "Merak ettiklerini sor.", "Sorunu ilgili üniversite veya bölüme yönelt ve doğru kişilerden yanıt al."]].map(([number, title, body]) => <Card key={number}><Text variant="muted">{number}</Text><Text variant="heading">{title}</Text><Text>{body}</Text></Card>)}
    <Text className="text-metadata font-bold tracking-widest text-primary">BİRLİKTE DAHA KOLAY</Text>
    <Text variant="title">Birinin deneyimi, senin başlangıcın olabilir.</Text>
    <Text>Soru sormanın, karşılaştırmanın ve deneyim paylaşmanın buluşma noktası.</Text>
    <Button label="Üniversiteleri keşfet" onPress={() => router.push("/kesfet")} />
    <Text variant="heading">Sistem nasıl kullanılır?</Text>
    <Text>TanıdıkVar kullanıcı ve Manager akışlarını aşağıdan inceleyebilirsin.</Text>
    {guide.map((item, index) => <GuideItem key={item.title} item={item} index={index} />)}
    <Card><Text variant="heading">Sistem hakkında bilmen gereken her şey</Text><Text>Profil kartları, sorular, yorumlar, Tanıdık başvuruları, Manager işlemleri, grafikler ve katalog yönetimi bu rehberde birlikte açıklanır.</Text></Card>
    <Text className="text-metadata font-bold tracking-widest text-primary">İLETİŞİM</Text>
    <Text variant="heading">Bize ulaş</Text>
    <Text>Öneri, hata bildirimi veya iş birliği için formu kullanabilirsin.</Text>
    <Text selectable className="text-primary">tanidikvar@gmail.com</Text>
    <FeatureForm schema={contact} defaults={{ name: "", email: "", subject: "", message: "" }} fields={[{ name: "name", label: "Adın" }, { name: "email", label: "E-posta adresin" }, { name: "subject", label: "Konu" }, { name: "message", label: "Mesajın", multiline: true }]} label="Mesajı gönder" submit={body => api.call("post", "/api/contact", { body })} />
    <Button label="Renkler ne anlatıyor?" variant="secondary" onPress={() => setPaletteOpen(true)} />
    <BottomSheet visible={paletteOpen} title="Renkler ne anlatıyor?" close={() => setPaletteOpen(false)}>
      <Text variant="heading">1 — Kullanıcı rolleri</Text>
      <View className="flex-row flex-wrap gap-3"><Avatar name="YKS adayı" educationStatus="YKS_ADAYI" /><Avatar name="Üniversite öğrencisi" educationStatus="UNIVERSITE_OGRENCISI" /><Avatar name="Mezun" educationStatus="MEZUN" /></View>
      <Text>YKS adayı mavi, üniversite öğrencisi yeşil, mezun kırmızı renkle gösterilir.</Text>
      <Text variant="heading">2 — Soru kapsamı</Text><Text>Genel · Üniversite · Üniversite + Bölüm</Text>
      <Text variant="heading">3 — Tanıdık rozeti</Text><Avatar name="Tanıdık" educationStatus="MEZUN" tanidik /><Text>Altın çerçeve ve yıldızlar, sistemdeki Tanıdık gösterimidir.</Text>
      <Button label="Anladım, devam et" onPress={() => setPaletteOpen(false)} />
    </BottomSheet>
  </Page>;
}
export function StatusScreen() {
  const query = useQuery({ queryKey: ["system", "health"], queryFn: ({ signal }) => api.call("get", "/api/health", { signal }), staleTime: 0, retry: false });
  const ready = query.isSuccess && query.data.status === "ok" && query.data.database === "up";
  return <Page title="Sistem durumu">
    <Card className="flex-row items-start gap-3"><View accessibilityElementsHidden className={`mt-1 h-2.5 w-2.5 rounded-full ${query.isPending ? "bg-warning" : ready ? "bg-success" : "bg-danger"}`} />
      <View className="min-w-0 flex-1 gap-1">{query.isPending ? <Text>Bağlantı kontrol ediliyor…</Text> : ready ? <><Text variant="heading">Bağlantı hazır</Text><Text>Uygulama ve veritabanı yanıt veriyor.</Text></> : <><Text variant="heading">Şu anda bağlantı kurulamıyor</Text><Text>Biraz sonra tekrar deneyebilirsin.</Text></>}</View>
    </Card>
    {query.isError && <ErrorState error={query.error} retry={() => void query.refetch()} />}
    <Button label="Tekrar kontrol et" disabled={query.isFetching} onPress={() => void query.refetch()} />
    <Button label="Ana sayfaya dön →" variant="secondary" onPress={() => router.push("/")} />
  </Page>;
}
