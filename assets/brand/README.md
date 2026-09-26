# Mobil marka çıktıları

`logo-mark.svg`, TanıdıkVar web reposunun `public/logo-mark.svg` işaretinden alınmıştır. Yeni bir marka tasarımı değildir; mevcut `t.` işareti ve renkleri korunur.

`assets/images/icon.png` 1024×1024, opak ve köşeleri maskelenmemiştir. iOS ve genel uygulama ikonu bunu kullanır. Android foreground/monochrome 1024×1024 şeffaf katmanlardır; işaret 64 birimlik tuvalin merkezindeki 38 birimlik alanda tutulur. Arka plan `app.config.ts` içindeki marka rengidir. Splash 1024×1024, favicon 64×64 PNG'dir.

PNG'ler mevcut SVG'nin Sharp ile rasterize edilmesiyle üretildi; ikon için kaynak zemin köşe yarıçapı kaldırıldı. Tipografi kaynak SVG'deki Avenir Next/Avenir/Arial sırasını kullanır. PNG çıktıları sürümlenir; yeniden üretildiğinde görsel karşılaştırma yapılır. Expo başlangıç `.icon` dizini artık yapılandırmadan referans edilmez.

Native ikon ve splash değişikliği yeni build gerektirir. Expo Go ekranı native splash kabulü sayılmaz.
