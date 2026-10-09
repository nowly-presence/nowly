---
title: Discord Rich Presence nedir? Nasıl çalışır ve neler gösterebilir?
description: Discord adının altındaki kartın açıklaması; etkinlik türlerinden ve alanlarından programların onu güncellemek için kullandığı yerel bağlantıya, sitelerin neden bir yardımcıya ihtiyaç duyduğuna kadar.
category: discord
order: 1
updated: 2026-10-09
related: discord-connections-vs-nowly, set-up-nowly, what-nowly-can-see
---

Bir arkadaşının Discord profilinde, resim, sayaç ve **Katıl** düğmesiyle birlikte **Oynuyor** yazdığını gördüysen Rich Presence'ı görmüşsün demektir. Bu özellik, bir programın yalnızca adını değil, ne yaptığını ayrıntılı biçimde anlatmasını sağlar. Bu rehber bir Rich Presence'ın neler içerdiğini, programların bunu Discord'a nasıl gönderdiğini ve bir siteyi göstermenin neden Nowly gibi bir araç gerektirdiğini açıklar.

## Oyun adından ayrıntılı etkinliğe

Discord başlangıçta açık olan oyunu algılayıp adını seninkinin altına yazıyordu. Oyun geliştiricileri için sunulan Rich Presence bir adım ileri gider: program, örneğin haritayı, skoru veya grubundaki oyuncu sayısını Discord'a kendisi bildirir ve bunlar değiştikçe günceller.

Aynı mekanizma yalnızca oyunlarda değil, her şeyde çalışır. Müzik çalarlar, kod düzenleyicileri ve yayın araçları bunu kullanır; Nowly de siteler için kullanır.

## Rich Presence kartında neler bulunur?

Rich Presence az sayıda alandan oluşur. Her program hepsini doldurmaz.

| Alan | Gösterdiği bilgi | YouTube örneği |
| --- | --- | --- |
| Etkinlik türü | Adın önündeki eylem | İzliyor |
| Ad | Uygulama | YouTube |
| Ayrıntılar | İlk satır | Videonun başlığı |
| Durum | İkinci satır | Kanalın adı |
| Büyük görsel | İpucu metniyle birlikte ana resim | Videonun küçük resmi |
| Küçük görsel | Resmin köşesindeki simge | Oynat veya duraklat simgesi |
| Zaman damgaları | Geçen süre veya başlangıç ve bitişi gösteren ilerleme çubuğu | 26:48'in 14:10'u |
| Düğmeler | Başkalarının açabileceği en fazla iki bağlantı | Videoyu izle |

Etkinlik türü **Oynuyor**, **Dinliyor**, **İzliyor** veya **Yarışıyor** olabilir. Bu nedenle müzik varlığında **Spotify dinliyor**, video varlığında **Netflix izliyor** yazar.

## Programlar Discord ile nasıl konuşur?

Rich Presence önce internete gitmez. Discord masaüstü uygulaması açıldığında bilgisayarında yerel bir kanal açar: Windows'ta `discord-ipc-0` adlı bir adlandırılmış kanal, macOS ve Linux'ta aynı adlı bir soket dosyası. Etkinliğini ayarlamak isteyen bir program:

1. bu kanala bağlanır,
2. Discord'da kayıtlı bir uygulama kimliğiyle kendini tanıtır; bu kimlik etkinliğin adını ve görsellerini belirler,
3. etkinlik alanlarını gönderir,
4. bir şey değiştiğinde güncellemeleri gönderir veya durduğunda etkinliği temizler.

Ardından Discord uygulaması etkinliği Discord sunucuları üzerinden profiline yayımlar; böylece arkadaşların her cihazda görebilir.

Kanal yerel olduğu için yalnızca Discord masaüstü uygulamasıyla aynı bilgisayarda çalışan programlar kullanabilir. Tarayıcı sekmesindeki veya telefondaki Discord bu kanalı açmaz.

## Siteler neden bir yardımcıya ihtiyaç duyar?

Bir site bu yerel kanalı açamaz. Tarayıcılar web sayfalarını bilinçli olarak sisteminden uzak tutar; uzantılar da yalıtılmış ortamda çalışır. Dolayısıyla tarayıcı hangi videoyu oynattığını bilse bile bunu Discord'a doğrudan iletemez.

Nowly'nin doldurduğu boşluk budur:

- bir **varlık** tarayıcındaki sayfayı okuyup etkinliği hazırlar,
- **tarayıcı uzantısı** etkinliği toplar ve ayarlarını uygular,
- **masaüstü uygulaması** bilgisayarında Discord'un yerel kanalını açıp etkinliği gönderen programdır.

Masaüstü uygulaması küçüktür, penceresi yoktur ve gerektiğinde tarayıcı tarafından başlatılır. Tek başına tarayıcı uzantısı, o olmadan Rich Presence'ı güncelleyemez.

## Rich Presence'ını kimler görebilir?

Etkinliğin profilinde ve üye listelerinde durumunu görebilen kişilere görünür: arkadaşlarına ve ortak sunucuların üyelerine. Discord'un **Etkinlik Gizliliği** ayarlarında ya da belirli bir sunucuda etkinlik paylaşımını kapatırsan görünmez. Durumun **Görünmez** olduğunda hiç kimse göremez.

Düğmeler başkaları içindir: arkadaşlarının aynı videoyu veya bölümü açmasını sağlar.

## Bilinmesi gereken sınırlar

- **Bir uygulama için aynı anda tek etkinlik.** Birkaç program etkinliğini güncellediğinde Discord birini, birkaçını gösterebilir veya aralarında geçiş yapabilir. Aynı şeyi gösteren iki aracı birlikte çalıştırma.
- **Güncellemelerin hız sınırı vardır.** Discord kısa sürede yalnızca belirli sayıda güncelleme kabul eder; durum sayfanın birkaç saniye gerisinde kalabilir. Zaman damgaları, sürekli güncelleme almadan süreyi Discord'un hesaplamasını sağlar.
- **Görsellere Discord erişebilmelidir.** Resimleri bilgisayarın değil Discord indirir; bu yüzden özel veya korumalı görseller için bir aracı gerekir. Nowly'nin bunu nasıl çözdüğünü [Nowly neleri görebilir?](/guides/what-nowly-can-see) rehberinde öğrenebilirsin.

## Rich Presence ve Discord'un yerleşik bağlantıları

Discord, Spotify gibi bir hesabı **Bağlantılar** bölümünden bağladığında bazı etkinlikleri ek bir program olmadan da gösterir. Bu bütünleştirmeler farklı çalışır ve farklı ödünleşimleri vardır. Karşılaştırma için [Discord bağlantıları mı, Nowly mi?](/guides/discord-connections-vs-nowly) rehberine bak.
