---
title: Discord Rich Presence görünmüyor mu? İşe yarayan bir kontrol listesi
description: İzlerken veya dinlerken Discord durumun boş mu kalıyor? Discord'un kendi ayarlarından bulunduğun sayfaya kadar bu kontrolleri sırayla yap.
category: troubleshooting
order: 1
updated: 2026-10-09
related: discord-ipc-access-denied, nowly-on-linux, allow-user-scripts
---

Rich Presence beş halkalı bir zincirden geçer: bulunduğun sayfa, o sitenin varlığı, tarayıcı uzantısı, masaüstü uygulaması ve Discord uygulaması. Durumun boş kalıyorsa bu halkalardan biri kopmuştur. Her şeyi yeniden yüklemek yerine hangi halkada sorun olduğunu bulmak en hızlı çözümdür. Aşağıdaki kontrolleri sırayla yap. Sorunların çoğu ilk dört adımda çözülür.

## Nowly tanısıyla başla

Paylaşmak istediğin sekmede Nowly yan panelini aç (**Ctrl+Shift+Y** veya Mac'te **Cmd+Shift+Y**). Tanıda altı satır görünür: **Uzantı yüklü**, **Kullanıcı betiklerine izin verildi**, **Nowly Desktop algılandı**, **Discord bağlandı**, **Bir varlık yüklü** ve **Etkinlik algılandı**.

Yukarıdan aşağıya oku ve yeşil olmayan ilk satırda dur. Aşağıdaki bölümlerin her biri bu satırlardan birine veya tanının tarayıcından göremediği birkaç duruma karşılık gelir.

## 1. Discord masaüstü uygulamasını kullanıyorsun

Rich Presence yalnızca bilgisayarında kurulu Discord uygulamasıyla çalışır. Aynı hesapla giriş yapmış olsan bile tarayıcı sekmesindeki, telefonundaki veya başka bilgisayardaki Discord hiçbir şey göstermez.

İkisini birden kullanıyorsan Discord'un tarayıcı sürümünü kapat: masaüstü uygulaması etkinliği başkalarına gösterirken tarayıcı sürümü durumunun boş olduğunu düşünmene neden olabilir.

## 2. Discord'un etkinliğini göstermesine izin veriliyor

Discord etkinliğini alsa bile gizleyebilir:

- **Kullanıcı Ayarları**'nı, ardından **Etkinlik Gizliliği**'ni aç ve mevcut etkinliğini paylaşan seçeneği etkinleştir.
- Durumunu kontrol et. **Görünmez** durumu etkinliğini herkesten gizler.
- Bazı sunucularda, sunucunun gizlilik ayarlarından yalnızca o sunucu için etkinlik paylaşımını kapatabilirsin. Bir sunucudaki arkadaşın etkinliğini göremiyor ama başkaları görebiliyorsa oraya bak.

Aradaki farkı anlamanın kolay yolu şudur: kendi profilinde etkinlik görünüyorsa ama arkadaşın göremiyorsa sorun Nowly'de değil, Discord'un gizlilik ayarlarındadır.

## 3. Masaüstü uygulaması yüklü ve çalışıyor

**Nowly Desktop algılandı** kırmızıysa uzantı masaüstü uygulamasına ulaşamıyor demektir.

- Henüz yüklemediysen [masaüstü uygulaması sayfasından](/desktop) yükle, sonra yan panelde **Bağlantıyı kontrol et**'e tıkla.
- Yeni yüklediysen yan paneli kapatıp yeniden aç veya tarayıcıyı yeniden başlat ki yeni uygulamayı algılasın.
- Uygulamayı tarayıcıyla aynı bilgisayara yükle. Farklı bilgisayarlar arasında çalışmaz.
- Linux'ta en yaygın nedenler, aslında hiç yüklenmemiş bir `.deb` paketi veya Flatpak ya da Snap üzerinden yüklenmiş tarayıcıdır. Bkz. [Linux'ta Nowly](/guides/nowly-on-linux).

## 4. Discord bağlandı

**Nowly Desktop algılandı** yeşil, **Discord bağlandı** kırmızıysa masaüstü uygulaması Discord ile konuşamıyor demektir.

- Discord masaüstü uygulamasını başlat, tamamen açılmasını bekle, sonra **Bağlantıyı kontrol et**'e tıkla.
- Windows'ta en yaygın neden Discord'un yönetici olarak çalışmasıdır. Çözümü bir dakika sürer: [discord-ipc-0 üzerindeki "Erişim reddedildi" hatasını düzelt](/guides/discord-ipc-access-denied).
- Normal Discord ile birlikte Discord PTB veya Canary kullanıyorsan biri hariç hepsinden çık.

## 5. Kullanıcı betiklerine izin verildi

**Kullanıcı betiklerine izin verildi** kırmızıysa tarayıcı varlıkları engelliyordur. Nowly ayrıntıları sayfasındaki **Kullanıcı betiklerine izin ver** seçeneğini (veya eski Chrome sürümlerinde **Geliştirici modu**'nu) aç, ardından sekmeyi yenile. Her tarayıcı için ayrıntılı adımlar [Nowly neden kullanıcı betiklerine izin ister?](/guides/allow-user-scripts) rehberinde.

## 6. Doğru varlık yüklü ve açık

Her site için ayrı varlık gerekir. **Bir varlık yüklü** yeşil olduğu hâlde bir sitede hiçbir şey olmuyorsa o sitenin [kitaplık](/library) sayfasını açıp **Yüklendi** yazdığını kontrol et. Ardından yan panelde:

- Varlığın açık olduğundan emin ol.
- Paylaşımın duraklatılmadığını kontrol et. Duraklatılmışsa yan panelde **Paylaşım duraklatıldı** yazar. Duraklat düğmesiyle veya **Ctrl+Shift+U** ile devam et.
- Varlığın ertelenmediğinden ve paylaşım saatleri belirlediysen **Zamanlama dışında** olmadığından emin ol.
- Sekmenin **Bu sekmeyi gizle** ile gizlenmediğini kontrol et.

## 7. Sayfa, varlığın desteklediği bir sayfa

Varlığın mevcut sayfada gösterecek bir şeyi yoksa **Etkinlik algılandı** kırmızı kalır. Neredeyse her durumda iki açıklama vardır:

- **İzlemek yerine geziniyorsun.** Çoğu varlık yalnızca gerçekten oynattığın video, bölüm, parça veya canlı yayını paylaşır. Çoğunda **Gezinme etkinliğini göster**'i açmadıkça ana sayfalar, arama ve kataloglar hiçbir şey göstermez. Her varlığın kitaplık sayfası varsayılan olarak ne gösterdiğini açıklar.
- **Adres desteklenmiyor.** Her varlığın çalıştığı adresler kitaplık sayfasında **Desteklenen siteler** altında listelenir. Örneğin Prime Video `primevideo.com` adresinde çalışır. Site yeni bir adrese taşındıysa veya tasarımını değiştirdiyse varlık sayfasındaki **Sorun bildir**'i kullan.

Bir varlık yükledikten veya ayar değiştirdikten sonra sekmeyi bir kez yenile. Varlık yüklenmeden önce açılmış bir sayfada varlık henüz çalışmaz.

## 8. Başka bir Rich Presence aracı karışmıyor

PreMiD veya kendi Rich Presence özelliği olan bir müzik çalar gibi Discord etkinliğini ayarlayan başka araçlar, Nowly'nin gönderdiğini değiştirebilir veya silebilir. Deneme sırasında bunları kapat. Oynadığın bir oyun da profilinde görünen etkinliğin yerini alabilir.

## 9. Hâlâ hiçbir şey yok mu?

- Sekmeyi yenile, ardından tarayıcıyı ve Discord'u yeniden başlat. Basit gelebilir ama zincirdeki bütün bağlantıları yeniden kurar.
- Uzantıyı, masaüstü uygulamasını ve Discord'u güncelle.
- Uzantının çalışma günlüklerini aç, **Günlükleri kopyala**'ya tıklayıp bir destek talebine yapıştır. Günlükler ziyaret ettiğin desteklenen sayfaların adreslerini içerebilir; paylaşmadan önce oku.
- Nowly Discord sunucusunda destek talebi aç veya yalnızca tek bir site etkileniyorsa varlığı kitaplık sayfasından bildir.

## Tek cümlede bağlantı zinciri

Sayfa desteklenmeli, varlık yüklü ve çalışır durumda olmalı, kullanıcı betiklerine izin verilmeli, masaüstü uygulamasına ulaşılabilmeli, Discord açık olmalı ve etkinliğini göstermesine izin verilmelidir. Başarısız olan ilk halkayı bulup düzelt; gerisi genellikle kendiliğinden çalışır.
