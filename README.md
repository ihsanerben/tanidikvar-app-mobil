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

`npm run start` Expo Go hedefini ve LAN bağlantısını seçer. Bilgisayar ile telefonu aynı Wi-Fi ağına bağla; SDK 57 ile uyumlu Expo Go kullan. iPhone'da Kamera ile, Android'de Expo Go içindeki QR tarayıcı ile terminaldeki kodu okut. iPhone'da Expo Go ve bilgisayardaki Expo CLI aynı Expo hesabıyla açık olmalıdır. iOS yerel ağ izni isterse izin ver.

Önce API reposunda `./run.sh --docker` çalıştır; API, PostgreSQL ve Mailpit Docker'da açılır. Backend değişikliklerinden sonra aynı komut imajı yeniden derleyip API'yi günceller. Yerel Compose API portu LAN erişimine açıktır. Alternatif olarak `./run.sh` API'yi hostta çalıştırır; iki mod aynı portta birlikte çalıştırılmaz. Expo Go development ortamında `.env.local` içindeki `http://localhost:8080` adresinin hostname'i otomatik olarak Metro'nun özel LAN IPv4 adresiyle değiştirilir; port korunur. Açıkça verilmiş uzak API adresleri değiştirilmez. Farklı ağ/VPN veya Metro tunnel kullanılıyorsa telefondan erişilebilen API origin'ini `EXPO_PUBLIC_API_URL` ile açıkça ayarla; Metro tunnel API'yi tünellemez. `localhost` telefonun kendisini gösterir.

Expo Go ile giriş ve temel ürün ekranları önizlenebilir. Uzaktan push kaydı/dinleyicileri ve native Sentry kapalıdır; uygulama içi bildirim listesi kullanılabilir. Native push, imzalı universal/app links ve OTA kabulü development/preview build ile yapılır. Development build için `npm run start:dev` kullan. `npm run ios` bilgisayardaki simulatorü açar; fiziksel iPhone'da QR kullanılır.

QR yalnız Metro sunucusu açıkken çalışır; bilgisayarın ağ adresi değişirse yeni QR okut. Bağlantı sorunu varsa telefondan `http://BILGISAYAR_LAN_IP:8080/api/health` adresini dene ve ağın cihazlar arası iletişimi engellemediğini kontrol et.

Kaynaklar: [Expo CLI hedef seçimi](https://docs.expo.dev/more/expo-cli/#launch-target), [Expo Go başlangıcı](https://docs.expo.dev/get-started/start-developing/).

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

Maestro akışları ve izole test verisi gereksinimleri [.maestro/README.md](.maestro/README.md) içindedir. Yerel test/export başarısı native development build veya gerçek cihaz kabulü anlamına gelmez; bu kontroller henüz yapılmamıştır. Takip/kayıt, sıralama, puan, rozet vitrini ve yıllık karne de API’ye bağlıdır. Bildirim listesi, oturuma bağlı push kaydı, doğrulanmış deep link, gizlilik ekranı ve release altyapısı da uygulanmıştır; EAS/FCM/APNs, gerçek cihaz, Sentry ve OTA kabulü açıktır.

## Platform ve yayın kontrolleri

```sh
npm run release:preflight -- preview
npm run release:preflight -- preview ios
npm run release:services -- preview all
npm run test:release
npm run check:bundle
npm run test:smoke
```

Preflight kabuktaki EAS/HTTPS/Sentry/FCM ayarlarını değerlerini yazdırmadan kontrol eder; son argüman `ios`, `android` veya `all` olabilir. FCM dosyası yalnız Android'de zorunludur ve seçilen uygulama kimliğiyle eşleşmelidir. Preview/production EAS build'lerinde aynı kontrol `eas-build-pre-install` ile otomatik çalışır; development profilleri muaf tutulur. Source map yüklemesini kapatan veya hatasını yok sayan release ayarları reddedilir.

`release:services` HTTPS API sağlık ve yönlendirmesiz JSON domain association kontrollerini yapar; `EXPO_PUBLIC_API_URL`, `APP_LINK_HOST`, iOS için `MOBILE_APPLE_TEAM_ID`, Android için virgülle ayrılmış `MOBILE_ANDROID_SHA256` ister. Bunlar kullanılan build'in signing kimlikleri olmalıdır. Bu kontrol cihaz deep link testinin yerini tutmaz.

Bundle kontrolü Expo export sonrasında çalışır. Smoke yalnız açıkça işaretlenmiş disposable yerel API/Mailpit ve kurulu Maestro ile fixture üretir; ayrıntılar `.maestro/README.md` içindedir. Türkçe mağaza metni `store/listing.tr-TR.json` içinde taslaktır. Android gönderimi `internal` kanalına `draft` olarak hazırlanır; dağıtım mağaza konsolunda ayrıca başlatılır.

Development scheme `tanidikvar-dev://`, preview `tanidikvar-preview://`, production `tanidikvar://` kullanır. Preview/production build için matching `APP_VARIANT`/`EXPO_PUBLIC_APP_VARIANT`, `EAS_PROJECT_ID` ve HTTPS `EXPO_PUBLIC_API_URL` gerekir. Domain association için `APP_LINK_HOST`, webde gerçek Apple Team ID/bundle ID/Android SHA-256 yapılandırılır. Gönderici API'de `EXPO_PUSH_ENABLED` ile açılır; default kapalıdır. Native config değişikliği yeni build gerektirir.
