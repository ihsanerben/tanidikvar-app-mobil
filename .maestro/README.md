# Mobil smoke kabulü

Bu akışlar yalnız her koşu için hazırlanmış **izole test API/veritabanında**, e-postası doğrulanmış ve profili tamamlanmış yeni bir MEMBER hesabıyla çalıştırılır. Production'a karşı çalıştırılmaz. Fixture hesabı, üniversite/program kataloğu ve soru aynı izole ortamda oluşturulup koşu sonunda ortam kaldırılmalıdır; bu dosyalar mevcut canlı veriyi temizlemez.

Development build cihaza yüklenmiş, API cihazdan erişilebilir ve sistemin ilk deep link açma onayı verilmiş olmalıdır. Akışlar doğrulanmış katalog UUID'leri kullanır. Test hesabında başlangıçta özel bir Tanıdık rolü veya aktif cevap bulunmaz.

Ortam girdileri: `TEST_EMAIL`, `TEST_PASSWORD`, `UNIVERSITY_QUERY`, `UNIVERSITY_NAME`, `UNIVERSITY_ID`, `PROGRAM_NAME`, `PROGRAM_ID`, `QUESTION_ID`, her koşuda benzersiz `QUESTION_TITLE`. Değerleri yerel test secret yönetiminden Maestro ortamına aktar; gerçek değerleri repoya yazma.

```sh
maestro test .maestro/login.yaml
maestro test .maestro/product-smoke.yaml
```

`login.yaml` giriş ve ana ekranı; `product-smoke.yaml` keşif, katalog detayları, profil, soru/cevap, üniversite takibi, soru kaydı, haftalık sıralama, tercihler ve çıkıştan sonra korumalı deep link davranışını kapsar. Giriş sonrasında hedefe dönüş ayrıca `QUESTION_ID` deep linki üzerinden yeniden giriş yapılarak kontrol edilmelidir.

Bu dosyalar 25 Eylül 2026 tarihinde hazırlanmıştır; geliştirme ortamında Maestro, iOS simulator ve Android araçları bulunmadığından **koşulmuş kabul testi değildir**. Büyük font, ekran okuyucu, klavye, arka plan/yeniden açılış, uçak modu ve gerçek cihaz kontrolleri de açık kabul kapılarıdır.

Komut davranışlarının kaynağı: [Maestro runFlow](https://docs.maestro.dev/reference/commands-available/runflow), [openLink](https://docs.maestro.dev/reference/commands-available/openlink), [scrollUntilVisible](https://docs.maestro.dev/reference/commands-available/scrolluntilvisible).
