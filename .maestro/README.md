# Mobil smoke kabulü

Bu akışlar yalnız her koşu için hazırlanmış **izole test API/veritabanında**, e-postası doğrulanmış ve profili tamamlanmış yeni bir MEMBER hesabıyla çalıştırılır. Production'a karşı çalıştırılmaz. Fixture hesabı, üniversite/program kataloğu ve soru aynı izole ortamda oluşturulup koşu sonunda ortam kaldırılmalıdır; bu dosyalar mevcut canlı veriyi temizlemez.

Development build cihaza yüklenmiş, API cihazdan erişilebilir ve sistemin ilk deep link açma onayı verilmiş olmalıdır. Akışlar doğrulanmış katalog UUID'leri kullanır. Test hesabında başlangıçta özel bir Tanıdık rolü veya aktif cevap bulunmaz.

Ortam girdileri: `TEST_EMAIL`, `TEST_PASSWORD`, `UNIVERSITY_QUERY`, `UNIVERSITY_NAME`, `UNIVERSITY_ID`, `PROGRAM_NAME`, `PROGRAM_ID`, `QUESTION_ID`, her koşuda benzersiz `QUESTION_TITLE`. Değerleri yerel test secret yönetiminden Maestro ortamına aktar; gerçek değerleri repoya yazma.

```sh
maestro test .maestro/login.yaml
maestro test .maestro/product-smoke.yaml
```

`login.yaml` giriş ve ana ekranı; `product-smoke.yaml` keşif, katalog detayları, profil, soru/cevap, üniversite takibi, soru kaydı, haftalık sıralama, tercihler ve çıkıştan sonra korumalı deep link davranışını kapsar. `session-and-notifications.yaml` bildirim listesi, kill/relaunch, logout sonrası soru deep linki → login → özgün hedefe dönüş ve geçersiz bağlantı fallback'ini doğrular.

Bu dosyalar 25 Eylül 2026 tarihinde hazırlanmıştır; geliştirme ortamında Maestro, iOS simulator ve Android araçları bulunmadığından **koşulmuş kabul testi değildir**. Büyük font, ekran okuyucu, klavye, arka plan/yeniden açılış, uçak modu ve gerçek cihaz kontrolleri de açık kabul kapılarıdır.

Komut davranışlarının kaynağı: [Maestro runFlow](https://docs.maestro.dev/reference/commands-available/runflow), [openLink](https://docs.maestro.dev/reference/commands-available/openlink), [scrollUntilVisible](https://docs.maestro.dev/reference/commands-available/scrolluntilvisible).

## İzole fixture ile kısa smoke

```sh
SMOKE_DISPOSABLE_DATABASE=true SMOKE_API_URL=http://localhost:18080 SMOKE_MAILPIT_URL=http://localhost:8025 npm run test:smoke
```

Koşucu yalnız loopback origin kabul eder; Maestro eksikse veri oluşturmadan durur. Disposable API ve Mailpit önceden başlatılmış olmalıdır. Her koşuda yeni hesap oluşturur, Mailpit koduyla doğrular, aday profilini ve bir soruyu hazırlar; kimlikleri yalnız child-process environment'ına aktarır. Test sonunda hesabı kapatır. Soft-delete nedeniyle test verisi fiziksel olarak korunur; işi biten izole test ortamı kaldırılır. Katalog gerektiren uzun `product-smoke.yaml` akışı için yukarıdaki katalog fixture'ları ayrıca gerekir.

Bu koşucu otomasyon hazırlığıdır; 25 Eylül 2026 tarihinde Maestro bulunamadığı için native smoke çalıştırılamadı. Development build'in cihazdan eriştiği API ile koşucunun kullandığı yerel API aynı test instance'ı olmalıdır.
