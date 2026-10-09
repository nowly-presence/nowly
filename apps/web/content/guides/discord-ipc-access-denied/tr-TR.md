---
title: "discord-ipc-0 üzerindeki 'Erişim reddedildi' hatasını düzeltme (Windows)"
description: Discord yönetici olarak çalışırken Windows'un Nowly ile Discord arasındaki bağlantıyı neden engellediği ve sorunu kalıcı olarak çözen beş adım.
category: troubleshooting
order: 2
updated: 2026-10-09
related: rich-presence-not-showing, what-is-discord-rich-presence, set-up-nowly
---

Windows'ta Nowly bazen **Nowly Desktop algılandı** satırını yeşil, **Discord bağlandı** satırını kırmızı gösterir; günlüklerde de şöyle bir satır bulunur:

```text
open \\.\pipe\discord-ipc-0: Access is denied.
```

Nowly, Discord'un bağlantıyı engellediğini açıklayan bir mesaj da gösterebilir; masaüstü uygulaması da Windows bildirimi gönderebilir. Nedeni hemen her zaman aynıdır ve ne Nowly'nin ne de Discord'un hatasıdır: Discord yönetici yetkileriyle, tarayıcın ise normal yetkilerle çalışıyordur.

## discord-ipc-0 nedir?

Oyunlar dahil, Discord etkinliğini ayarlamak isteyen programlar, Discord uygulamasıyla adlandırılmış kanal denen yerel bir kanal üzerinden konuşur. Windows'ta ilk kanalın adı `\\.\pipe\discord-ipc-0`'dır. Discord açılışta onu oluşturur, Nowly masaüstü uygulaması da etkinliğini göndermek için açar.

Bu aşamada internete hiçbir şey gitmez. Aynı bilgisayardaki iki program birbiriyle konuşur.

## Windows neden "Erişim reddedildi" diyor?

Windows, yönetici olarak çalışan programlarla normal yetkilerle çalışanları birbirinden ayırır. **Yönetici olarak çalıştır** ile başlatılan program daha yüksek bir bütünlük düzeyinde çalışır; oluşturduğu nesneler, Discord'un adlandırılmış kanalı dahil, normal düzeyde çalışan programlardan korunur.

Tarayıcın normal düzeyde çalışır; onun başlattığı Nowly masaüstü uygulaması da normal düzeyde çalışır. Discord yönetici olarak başlatılmışsa Windows, normal yetkili uygulamanın yükseltilmiş kanalı açmasına izin vermez ve bağlantı **Erişim reddedildi** hatasıyla başarısız olur.

Oyunlar ve diğer Rich Presence araçları da aynı engelle karşılaşır; bu yüzden "Discord oyunumu göstermiyor" sorunu ile bu hata sık sık birlikte görülür.

## Çözüm, adım adım

1. **Discord'dan tamamen çık.** Pencereyi kapatmak yetmez: saatin yanındaki bildirim alanında Discord simgesine sağ tıkla ve **Discord'dan çık**'ı seç.
2. **Açık Discord işlemi kalmadığından emin ol.** **Ctrl+Shift+Esc** ile Görev Yöneticisi'ni aç ve kalan `Discord.exe` işlemlerini sonlandır.
3. **Yönetici ayarını kaldır.** Kullandığın Discord kısayoluna sağ tıkla, **Özellikler**'i seç, **Uyumluluk** sekmesini aç ve **Bu programı yönetici olarak çalıştır** işaretini kaldır. Yine **Özellikler** içinde, **Kısayol** sekmesindeki **Gelişmiş**'e tıkla ve **Yönetici olarak çalıştır** seçeneğinin de işaretsiz olduğundan emin ol. **Tüm kullanıcıların ayarlarını değiştir** düğmesinde seçenek işaretliyse oradan da kaldır.
4. **Discord'u normal şekilde başlat**; sıradan bir çift tıklama yeterli.
5. **Nowly'yi yeniden bağla.** Nowly yan panelinde **Yeniden bağlan**'a tıkla veya tarayıcını yeniden başlat.

**Discord bağlandı** satırı artık yeşil olmalı ve etkinliğin birkaç saniye içinde görünmelidir.

## Discord yönetici olarak açılmaya devam ediyorsa

- Kullandığın her kısayolu kontrol et: masaüstü, Başlat menüsü, görev çubuğu. Her birinin ayarı ayrıdır.
- Discord Windows ile birlikte başlıyorsa en yüksek ayrıcalıkları kullanacak şekilde ayarlanmış bir zamanlanmış görev veya üçüncü taraf başlangıç yöneticisi tarafından açılıyor olabilir. Bu seçeneği kaldır veya girdiyi bu ayar olmadan yeniden oluştur.
- Bazı kişiler, yönetici olarak çalışan oyunlarda bas-konuş özelliğinin çalışması için Discord'u yönetici olarak açar. Bu durumda seçim yapmalısın: Discord ve oyun ya normal yetkilerle çalışır ya da tarayıcından gelen Rich Presence Discord'a ulaşamaz.

## Yapmaman gerekenler

Sorunu dolanmak için tarayıcını veya Nowly masaüstü uygulamasını zorla yönetici olarak çalıştırma. Tarayıcılar masaüstü uygulamasını yerel mesajlaşma denen yöntemle kendileri başlatır; tarayıcıyı tam yönetici yetkisiyle çalıştırmak, bir web sayfasında ters giden herhangi bir şeyin tüm sistemini etkilemesine yol açabilir. Doğru çözüm her zaman Discord'u normal yetki düzeyine geri döndürmektir.

## Discord PTB ve Canary

Windows'ta Nowly masaüstü uygulaması ilk Discord kanalı olan `discord-ipc-0`'a bağlanır. Discord Stable ile PTB veya Canary'yi aynı anda çalıştırırsan ilk başlatılan uygulama o kanala sahip olur; etkinliğin yalnızca onda görünür. Sürpriz yaşamamak için tek bir Discord uygulamasını açık tut.

## Hâlâ engelleniyor musun?

Hata kaybolduğu hâlde durumun boşsa sorun zincirin sonraki bir halkasındadır. [Sorun giderme kontrol listesine](/guides/rich-presence-not-showing) dön ve **Kullanıcı betiklerine izin verildi** adımından devam et. Yukarıdaki adımlardan sonra günlüklerde hâlâ **Access is denied** yazıyorsa Windows sürümünü ve Discord'u nasıl başlattığını belirterek Nowly Discord sunucusunda bir destek talebi aç.
