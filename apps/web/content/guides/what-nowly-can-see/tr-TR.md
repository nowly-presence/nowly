---
title: Nowly neleri görebilir ve verilerin nereye gider?
description: Etkinliğinin web sayfasından Discord'a izlediği yol, bir varlığın okudukları, bilgisayarında kalanlar ve isteğe bağlı olarak Nowly'ye ulaşan az sayıdaki bilgi.
category: privacy
order: 2
updated: 2026-10-09
related: control-what-discord-shows, allow-user-scripts, what-is-discord-rich-presence
---

Ne izlediğini bilen bir araç, basit bir soruya açık yanıt vermelidir: bu bilgiler nereye gidiyor? Bu rehber etkinliğinin izlediği yolu adım adım gösterir, cihazında kalanları sıralar ve Nowly sunucularıyla iletişim kuran az sayıdaki isteğe bağlı özelliği açıkça anlatır. Esas başvuru kaynağı olan [gizlilik politikasını](/privacy) sade bir dille tamamlar.

## Kısaca

Etkinliğin web sayfasından kendi bilgisayarındaki Discord uygulamasına gider; başka bir yere gitmez. nowly.me'den veya Nowly API'sinden geçmez. Kullanım istatistikleri sen açmadıkça kapalıdır, hesap açmak da isteğe bağlıdır.

## Etkinliğinin izlediği yol

Desteklenen bir sitede oynat düğmesine bastığında şunlar olur:

1. **Varlık sayfayı okur.** O sitenin varlığı tarayıcı sekmende çalışır ve ihtiyaç duyduklarını okur: başlık, bölüm numarası, kanal adı, videonun oynatılıp oynatılmadığı.
2. **Uzantı etkinliği hazırlar.** Ayarlarını (duraklatma, zamanlamalar, gizlilik modları, dil) uygular ve Rich Presence'ı oluşturur.
3. **Masaüstü uygulaması etkinliği alır.** Uzantı, tarayıcıyla aynı bilgisayardaki program arasında bir iletişim kanalı olan yerel mesajlaşma yoluyla bilgileri Nowly masaüstü uygulamasına gönderir.
4. **Discord'a yerel olarak ulaşır.** Masaüstü uygulaması, etkinliği Discord'un yerel bağlantısından Discord uygulamasına iletir.
5. **Discord etkinliği paylaşır.** Discord uygulaması, kendi gizlilik politikası kapsamında arkadaşlarının görebilmesi için etkinliği Discord sunucularına gönderir.

İlk dört adımın tamamı bilgisayarında gerçekleşir. Nowly sunucuları bu yolun parçası değildir.

## Bir varlık neleri okur?

Bir varlık yalnızca yazıldığı sayfayı ve durumun için ihtiyaç duyduğu bilgileri okur. YouTube varlığı videonun adını, kanalını, küçük resminin adresini ve oynatma konumunu okur. Spotify varlığı tarayıcında çalan parçayı okur. Bir varlık diğer sekmeleri, gezinme geçmişini, form alanlarını veya parolaları okumaz.

Bazı siteler ayrıntıları yalnızca kendi verileri üzerinden sunar. Örneğin Netflix varlığı, Netflix sekmesinin içinden, tıpkı Netflix sayfasının yaptığı gibi, oynayan içeriğin adını ve bölümünü Netflix'in kendi sitesinden ister.

## Görseller ve görsel aracısı

Discord, durumunda gösterilen görselleri indirmek zorundadır. Çoğu platformun görselleri herkese açıktır ve Discord bunları doğrudan yükler. Netflix afişleri gibi bazı görselleri ise Discord bu hâlleriyle yükleyemez. Böyle durumlarda varlık Nowly'nin görsel aracısını kullanır: görselin adresi Nowly API'sinden geçer; API görseli alır ve Discord'un görüntüleyebilmesini sağlar.

Bu adres izlediğin içerikle ilişkili olabilir; bunu bilmen önemlidir. Aracı yalnızca bu amaçla kullanılır, reklam profili oluşturmak için asla kullanılmaz; günlükleri de yalnızca hizmetin çalışması ve güvenliği için gerekli süre boyunca tutulur.

## Bilgisayarında kalanlar

- Yüklü varlıkların, ayarları ve açık olup olmadıkları.
- Mevcut etkinliğin: başlık, platform, süre ve görsel adresi.
- Bir sorun olduğunda yardımcı olan, son işlemleri ve ziyaret ettiğin desteklenen sayfaların adreslerini içeren hata ayıklama günlüğü.
- Masaüstü uygulamasının önbellek klasöründeki `nowly-host.log` günlüğü.
- Uzantıda gösterilmek üzere Discord uygulamasından alınan Discord adının ve avatarının yerel kopyası.

Uzantıyı sıfırladığında veya kaldırdığında bunların tümü silinir; masaüstü uygulamasının günlüğünü de istediğin zaman silebilirsin.

## İzinler, sade bir dille

- **Sitelere erişim**: Hafif bir betik açtığın sayfanın desteklenen bir platforma ait olup olmadığını kontrol eder; böylece yan panel doğru varlığı önerebilir. Gezinme geçmişini hiçbir yere göndermez.
- **Kullanıcı betikleri**: Yüklü varlıkların kendi sitelerinde çalışmasını sağlar. Bkz. [Nowly neden kullanıcı betiklerine izin ister?](/guides/allow-user-scripts).
- **Yerel mesajlaşma**: Uzantının bilgisayarındaki masaüstü uygulamasıyla konuşmasını sağlar.
- **Depolama**: Ayarlarını ve varlıklarını tarayıcıda tutar.

## Nowly'ye yalnızca sen seçersen ulaşabilecekler

- **Kullanım istatistikleri** varsayılan olarak kapalıdır. Açarsan Nowly API'si rastgele bir cihaz kimliği, tarayıcı, sistem, dil ve sürüm bilgilerini ve yükleme gibi olayları alır. Sayfalarını, başlıklarını, aramalarını veya Discord kimliğini asla almaz.
- **Hesap** isteğe bağlıdır. Discord ile giriş yaparsan ayarların ve yüklü varlıklarının listesi tarayıcıların arasında eşitlenir. Mevcut etkinliğin, sekmelerin ve geçmişin asla eşitlenmez.
- Bir varlık sayfasından gönderdiğin **beğeniler ve raporlar**, rapora yazdıklarınla birlikte Nowly API'sine ulaşır.
- Kitaplıktan **varlık indirirken**, her indirme işleminde olduğu gibi Nowly sunucuları ve CDN ile bağlantı kurulur.

## Verilerin senin kontrolünde

- [Verilerin](/consent) sayfasında istatistikleri açıp kapatabilir, cihazın için saklanan her şeyi dışa aktarabilir veya silebilirsin.
- [Hesap sayfasında](/account) hesap verilerini indirebilir veya hesabını silebilirsin.
- Uzantıyı kaldırmak, yerel olarak sakladığı her şeyi siler.

## Discord bunlarla ne yapar?

Etkinliğin Discord'a ulaştığında, Discord bunu profilini görmesine izin verdiğin kişilere gösterir ve kendi gizlilik politikası kapsamında işler. Nowly bu kısmı değiştiremez; ancak en başta nelerin gönderileceğine sen karar verebilirsin. Bkz. [Discord'un hakkında tam olarak ne göstereceğini seç](/guides/control-what-discord-shows).
