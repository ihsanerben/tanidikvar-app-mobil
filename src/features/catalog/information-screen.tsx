import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Linking, Pressable, View, ScrollView } from "react-native";
import { z } from "zod";
import { ContactForm } from "./contact-form";
import { PaletteGuide } from "./palette-guide";
import Svg, { Path } from "react-native-svg";
import { iconColors } from "@/lib/design/chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import { ErrorState } from "@/components/ui/states";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api/client";
import guide from "@/data/about-guide.json";

const current = (value: string) => value.replaceAll("Admin", "Tanıdık").replaceAll("admin", "tanıdık");
function GuideItem({ item, index }: { item: typeof guide[number]; index: number }) {
  const [open, setOpen] = useState(false);
  return <Card><Text variant="muted">{String(index + 1).padStart(2, "0")}</Text>
    <Text variant="heading">{current(item.title)}</Text><Text>{current(item.summary)}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} className="min-h-touch-ios android:min-h-touch-android min-w-touch-ios android:min-w-touch-android justify-center"><Text variant="unstyled" className="text-primary underline">{open ? "Ayrıntıları kapat" : "Adımları ve ayrıntıları gör"}</Text></Pressable>
    {open && item.details.map(detail => <Text key={detail} variant="muted">{current(detail)}</Text>)}
  </Card>;
}
export function AboutScreen() {
  const [paletteOpen, setPaletteOpen] = useState(true);
  const scroll=useRef<ScrollView>(null);
  const [contactY,setContactY]=useState<number>();
  const [howY,setHowY]=useState<number>();
  const location=z.object({section:z.enum(['contact']).optional()}).safeParse(useLocalSearchParams());
  const contactRequested=location.success && location.data.section==='contact';
  useEffect(()=>{if(contactRequested && !paletteOpen && contactY!=null)scroll.current?.scrollTo({y:contactY,animated:true});},[contactRequested,paletteOpen,contactY]);
  return <Page title="" back={false} scrollRef={scroll}>
    <View className="gap-4">
      <View className="flex-row items-center gap-2"><View className="h-1.5 w-1.5 rounded-full bg-brand-accent" /><Text variant="unstyled" className="text-metadata font-bold tracking-widest text-primary">HAKKIMIZDA</Text></View>
      <Text variant="unstyled" className="text-hero-title font-bold text-primary">Kariyer yolunda{'\n'}bir <Text variant="unstyled" className="text-hero-title italic text-brand-accent">tanıdığın</Text>{'\n'}olsun.</Text>
      <Text>Bir bölümü en iyi, o sıralardan geçenler anlatır. Üniversite öğrencilerinin ve mezunların deneyimleriyle kendi yolunu bul.</Text>
      <Button label="TanıdıkVar’ı keşfet ↗" onPress={()=>howY!=null && scroll.current?.scrollTo({y:howY,animated:true})} />
      <Text variant="muted">Gerçek insanlar. Birinci elden deneyimler.</Text>
      <View className="relative h-about-art overflow-hidden rounded-t-about-art rounded-b-surface bg-about-art">
        <Svg width="100%" height="100%" style={{position:'absolute'}}><Path d="M0 40H600M0 80H600M0 120H600M0 160H600M0 200H600M0 240H600M40 0V300M80 0V300M120 0V300M160 0V300M200 0V300M240 0V300M280 0V300M320 0V300M360 0V300" stroke={iconColors.primary} strokeOpacity={0.06} /></Svg>
        <View className="absolute inset-6 rounded-full border border-primary/20" /><View className="absolute inset-12 rounded-full border border-primary/20" />
        <Text variant="unstyled" className="absolute left-0 right-0 top-8 text-center text-compact-badge font-bold text-primary">BİR SORU, YENİ BİR BAKIŞ AÇISI.</Text>
        <View className="absolute left-4 top-14 w-3/5 -rotate-6 gap-2 rounded-card bg-page p-4"><Text variant="muted">AKLINDAKİ SORU</Text><Text variant="heading">Benim için{'\n'}doğru bölüm{'\n'}hangisi?</Text><Text variant="unstyled" className="absolute right-3 bottom-3 text-hero-title text-brand-accent">?</Text></View>
        <View className="absolute bottom-10 right-4 w-3/5 rotate-6 gap-2 rounded-card bg-primary p-4"><View className="flex-row gap-1">{['ö','m','+'].map(letter=><View key={letter} className="h-6 w-6 items-center justify-center rounded-full bg-primary-soft"><Text variant="unstyled" className="text-caption font-bold text-primary">{letter}</Text></View>)}</View><Text variant="unstyled" className="text-card-title font-bold text-primary-foreground">Bir de burada{'\n'}okuyanlara sor.</Text><Text variant="unstyled" className="text-metadata text-primary-foreground">ÖĞRENCİLER & MEZUNLAR</Text></View>
        <Text variant="unstyled" className="absolute right-5 top-12 text-hero-title text-brand-accent">✳</Text>
        <Text variant="unstyled" className="absolute bottom-3 left-6 text-metadata text-primary">Senin yolun, onların deneyimi.</Text>
      </View>
    </View>
    <View className="gap-3 border-t border-border pt-5" onLayout={event=>setHowY(event.nativeEvent.layout.y)}>
    <Text variant="unstyled" className="text-metadata font-bold tracking-widest text-primary">TANIDIKVAR NEDİR?</Text>
    <Text variant="title">Broşürlerin ötesinde,{'\n'}kampüsün içinden.</Text>
    <Text>Tercih döneminde aradığın gerçek deneyimleri, öğrenci ve mezun katkılarını tek bir yerde buluşturuyoruz.</Text></View>
    {[["01 / KEŞFET", "Merak ettiğin yeri bul.", "Üniversite, bölüm ve konular üzerinden sana yakın sorulara ve topluluk verilerine ulaş."], ["02 / DİNLE", "Yaşayanlardan öğren.", "Topluluk ve Tanıdık yorumlarını ayrı sekmelerde oku; gerçek deneyimleri karşılaştır."], ["03 / SOR", "Merak ettiklerini sor.", "Sorunu ilgili üniversite veya bölüme yönelt ve doğru kişilerden yanıt al."]].map(([number, title, body]) => <Card key={number} className={number.startsWith("02") ? "bg-primary-soft" : "bg-page"}><Text variant="muted">{number}</Text><Text variant="heading">{title}</Text><Text>{body}</Text></Card>)}
    <View className="gap-3 rounded-card bg-primary p-5"><Text variant="unstyled" className="text-center text-metadata font-bold tracking-widest text-primary-foreground">BİRLİKTE DAHA KOLAY</Text><Text variant="title" className="text-center text-primary-foreground">Birinin deneyimi,{'\n'}senin başlangıcın olabilir.</Text><Text className="text-center text-primary-foreground/80">Soru sormanın, karşılaştırmanın ve deneyim paylaşmanın buluşma noktası.</Text></View>

    <Text variant="heading">Sistem nasıl kullanılır?</Text>
    <Text>TanıdıkVar kullanıcı ve Manager akışlarını aşağıdan inceleyebilirsin.</Text>
    {guide.map((item, index) => <GuideItem key={item.title} item={item} index={index} />)}
    <Card><Text variant="heading">Sistem hakkında bilmen gereken her şey</Text><Text>Profil kartları, sorular, yorumlar, Tanıdık başvuruları, Manager işlemleri, grafikler ve katalog yönetimi bu rehberde birlikte açıklanır.</Text></Card>
    <View className="gap-3 rounded-surface border border-border bg-primary-soft p-3" onLayout={event=>setContactY(event.nativeEvent.layout.y)}><Text variant="unstyled" className="text-metadata font-bold tracking-widest text-primary">İLETİŞİM</Text>
    <Text variant="heading">Bize ulaş</Text>
    <Text>Öneri, hata bildirimi veya iş birliği için formu kullanabilirsin.</Text>
    <Pressable accessibilityRole="link" accessibilityLabel="TanıdıkVar’a e-posta gönder" className="min-h-touch-ios android:min-h-touch-android min-w-touch-ios android:min-w-touch-android justify-center" onPress={()=>void Linking.openURL("mailto:tanidikvar@gmail.com")}><Text variant="unstyled" className="text-primary underline">tanidikvar@gmail.com</Text></Pressable>
    <ContactForm /></View>
    <PaletteGuide visible={paletteOpen} close={() => setPaletteOpen(false)} />
  </Page>;
}
export function StatusScreen() {
  const query = useQuery({ queryKey: ["system", "health"], queryFn: ({ signal }) => api.call("get", "/api/health", { signal }), staleTime: 0, retry: false });
  const ready = query.isSuccess && query.data.status === "ok" && query.data.database === "up";
  return <Page title="Sistem durumu" back={false}>
    <Card className="flex-row items-start gap-3"><View accessibilityElementsHidden className={`mt-1 h-2.5 w-2.5 rounded-full ${query.isPending ? "bg-warning" : ready ? "bg-success" : "bg-danger"}`} />
      <View className="min-w-0 flex-1 gap-1">{query.isPending ? <Text>Bağlantı kontrol ediliyor…</Text> : ready ? <><Text variant="heading">Bağlantı hazır</Text><Text>Uygulama ve veritabanı yanıt veriyor.</Text></> : <><Text variant="heading">Şu anda bağlantı kurulamıyor</Text><Text>Biraz sonra tekrar deneyebilirsin.</Text></>}</View>
    </Card>
    {query.isError && <ErrorState error={query.error} retry={() => void query.refetch()} />}
    <View className="flex-row flex-wrap gap-2"><Button label="Tekrar kontrol et" disabled={query.isFetching} onPress={() => void query.refetch()} />
    <Button label="Ana sayfaya dön →" variant="secondary" onPress={() => router.push("/")} /></View>
  </Page>;
}
