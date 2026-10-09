---
title: Discord'da ne izlediğini göster (Netflix, Prime Video, Disney+ ve daha fazlası)
description: İzlediğin dizi veya filmi Discord durumunda nasıl göstereceğin, her yayın varlığının neler gösterdiği ve ekran paylaşımında siyah görüntü çıkarken bunun neden çalıştığı.
category: start
order: 3
updated: 2026-10-09
related: set-up-nowly, control-what-discord-shows, rich-presence-not-showing
---

Discord oynadığın oyunu kendiliğinden gösterir, ancak tarayıcıda izlediğin diziyi göstermez. Nowly ile profilinde başlık, bölüm, afiş ve izleme ilerlemenle birlikte **Netflix izliyor** yazabilir; arkadaşların da aynı bölümü tek tıkla açabilir. Bu rehber, yayın servisleri için kurulumu ve her birinden neler bekleyebileceğini anlatır.

## Gerekenler

Nowly henüz kurulu değilse önce [Nowly nasıl kurulur?](/guides/set-up-nowly) rehberini izle: uzantı, kullanıcı betikleri, masaüstü uygulaması ve Discord masaüstü uygulaması. Ardından kullandığın her servis için [kitaplıktan](/library) bir varlık yükle. Yayın varlıkları arasında Netflix, Prime Video, Disney+, Crunchyroll, HBO Max, Paramount+, Peacock, Apple TV+, Canal+ ve ADN de bulunur.

## Arkadaşların ne görecek?

Bir yayın varlığı, Rich Presence kartını ekrandaki içerikle doldurur. Örneğin Netflix'te:

- Üstte **Netflix izliyor** yazar.
- İlk satırda dizinin veya filmin adı görünür.
- Dizi için `S1.E3` biçiminde sezon ve bölüm numarası, ardından bölümün adı; film için yapım yılı görünür.
- Ana görselde afiş, köşesinde oynat veya duraklat simgesi bulunur.
- Oynatma sırasında geçen ve kalan süre gösterilir.
- Arkadaşlarının aynı içeriği açabileceği **Bölümü izle** veya **Filmi izle** düğmesi bulunur.

Prime Video ve Disney+ benzer şekilde çalışır; oynatıcıda gösterildiğinde sezon ve bölümü de ekler. Crunchyroll diziyi, bölüm adını ve kapak görselini gösterir; dizi sayfasına götüren bir düğme ekler.

## Gezinirken değil, izlerken

Yayın varlıkları varsayılan olarak oynatıcıdaki içeriğe odaklanır; böylece iki dizi arasında karar vermeye çalışırken durumun sürekli değişmez. Ayrıntılar biraz farklıdır:

- **Netflix**, bir içerik oynatılana kadar hiçbir şey göstermez: ana sayfa, arama ve içerik sayfaları gizli kalır.
- **Prime Video** ve **Disney+**, bulunduğun içerik sayfasını da adıyla birlikte **Ayrıntılara bakıyor** veya **Bir diziye bakıyor** olarak gösterir. Ana sayfa, arama ve listeler gizli kalır.
- **Crunchyroll**, dizi sayfası, eşzamanlı yayın takvimi, izleme listen veya arama gibi ana sayfalarını da gösterir. Başlıkları gizlemek için **Gizlilik modu**'nu aç.

Daha fazlasını göstermek istersen yan panelde varlığın ayarlarından **Gezinme etkinliğini göster**'i aç. Böylece durumun ana sayfa, listeler ve aramada seni takip eder; yazdığın arama terimini bile gösterebilir.

## Ekran paylaşımı çalışmazken bu neden çalışır?

Netflix izlerken Discord'da ekranını paylaşmayı denediysen video yerine siyah bir dikdörtgen görmüş olabilirsin. Yayın servisleri videolarını DRM ile korur; tarayıcılar korumalı videonun ekran görüntüsüne alınmasını engeller.

Rich Presence farklıdır: videoyu asla göndermez, yalnızca onu anlatan metni ve afişi gönderir. Bu nedenle her serviste çalışır ve platformun kurallarını ihlal etmez. Birlikte izlemek istersen platformda varsa kendi grup izleme özelliğini kullan; Discord durumun arkadaşlarına ne izlediğini bildirsin.

## Bazı şeyler sende kalsın

Her akşamını başkalarıyla paylaşmak zorunda değilsin. Hızlı seçenekler:

- **Her şeyi duraklatmak** için **Ctrl+Shift+U** (Mac'te **Cmd+Shift+U**) tuşlarına bas; devam etmek için yeniden bas.
- Diğer sekmeler paylaşılmaya devam ederken birini gizli tutmak için yan panelde **Bu sekmeyi gizle**'yi seç.
- Bir varlığı bir saatliğine, dört saatliğine veya yarına kadar **ertelemeye al**.
- Tüm varlıklar veya yalnızca yayın varlıkları için bir zamanlama belirleyerek **yalnızca belli saatlerde paylaş**.
- **Crunchyroll**'da izlediğini göstermeye devam ederken başlığı gizlemek için **Gizlilik modu**'nu aç.

Ayrıntıların tamamı [Discord'un hakkında tam olarak ne göstereceğini seç](/guides/control-what-discord-shows) rehberinde.

## Durumun boş kalıyorsa

- İçeriğin TV uygulamasında veya telefonunda değil, tarayıcıda gerçekten oynatıldığından emin ol.
- Varlığın desteklediği adreste olduğunu kontrol et: Prime Video `primevideo.com`, Netflix `netflix.com` adresinde çalışır.
- Bir varlığı yükledikten sonra sekmeyi bir kez yenile.

Diğer sorunlarda [sorun giderme kontrol listesi](/guides/rich-presence-not-showing) bağlantı zincirinin her halkasını inceler.
