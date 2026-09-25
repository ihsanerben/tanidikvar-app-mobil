# TanıdıkVar Mobile

TanıdıkVar'ın iOS ve Android için Expo/React Native istemcisidir. Spring Boot API ile konuşur; web arayüzünün kopyası değil, aynı ürün alanını kullanan native bir istemcidir.

## Gereksinimler

- Node.js 22
- npm 10+
- iOS ve Android gerçek cihaz veya simulator/emulator

## Yerel başlangıç

```bash
cp .env.example .env.local
npm install
npm run start
```

Fiziksel cihazdan yerel API'ye erişirken `EXPO_PUBLIC_API_URL`, bilgisayarın cihaz tarafından erişilebilen ağ adresi olmalıdır; `localhost` cihazın kendisini gösterir.

## Kontroller

```bash
npm run lint
npm run typecheck
npm test
npm run doctor
```

Native bağımlılık içeren değişiklikler Expo Go yerine development build ile doğrulanır. `ios/` ve `android/` klasörleri üretilmiş çıktıdır; elle değiştirilmez.

## Uygulanan ürün kapsamı

Tasarım sistemi, ana sayfa/keşif filtreleri, üniversite/program detayları ve topluluk listeleri, soru/cevap/yorum katkıları, profil/eğitim düzenleme, Tanıdık başvuruları ve bildirim tercihleri gerçek API sözleşmesine bağlıdır. Liste sayfalaması FlashList, formlar RHF/Zod, sunucu durumu TanStack Query kullanır.

Tip güvenli API istemcisi `packages/api-client/schema.d.ts` üzerinden üretilmiş sözleşmeyi kullanır. Path/query parametreleri doğrulanır, sürüm çakışmaları taslağı korur ve çevrimdışı yazma eylemleri kapatılır.

Maestro akışları ve izole test verisi gereksinimleri [.maestro/README.md](.maestro/README.md) içindedir. Yerel test/export başarısı native development build veya gerçek cihaz kabulü anlamına gelmez; bu kontroller henüz yapılmamıştır. Takip/kayıt, sıralama, puan, rozet vitrini ve yıllık karne de API’ye bağlıdır. Push ve yayın işleri sonraki aşamalardadır.
