---
title: Nowly nasıl kurulur ve etkinliğin Discord'da nasıl gösterilir?
description: Tarayıcı uzantısından masaüstü uygulamasına, ilk varlığından her şeyin çalıştığını doğrulayan kontrollere kadar eksiksiz bir kurulum rehberi.
category: start
order: 1
updated: 2026-10-09
related: allow-user-scripts, rich-presence-not-showing, control-what-discord-shows
---

Nowly, sitelerde izlediğin, dinlediğin veya göz attığın şeyleri Discord Rich Presence olarak gösterir: adının altındaki başlık, görsel, ilerleme çubuğu ve bazen düğme içeren kart. Kurulum yaklaşık beş dakika sürer ve üç parçadan oluşur: tarayıcı uzantısı, küçük bir masaüstü uygulaması ve göstermek istediğin her site için bir varlık. Bu rehber, bunları sırayla kurmanı ve sonunda bağlantıların çalıştığını doğrulamanı sağlar.

## Başlamadan önce gerekenler

- **Bir bilgisayar**: Windows 10 veya 11, macOS 11 Big Sur veya üzeri ya da 64 bit bir Linux dağıtımı.
- **Bir tarayıcı**: Chrome, Edge, Brave, Opera veya Chromium tabanlı başka bir tarayıcı ya da Firefox.
- **Discord masaüstü uygulaması**: Yüklü ve hesabın açık olmalı. Tarayıcı sekmesindeki veya telefonundaki Discord başka bir programdan Rich Presence alamaz; bu nedenle Nowly ile çalışmaz.

Nowly hesabı açmana gerek yok. Aşağıdakilerin hepsi ücretsiz.

## 1. adım: tarayıcı uzantısını yükle

Her gün kullandığın tarayıcıdan [uzantı sayfasını](/extension) aç. Düğme tarayıcına uygun mağazaya yönlendirir: Chrome, Edge, Brave ve Opera için Chrome Web Store; Firefox için Firefox Add-ons. **Ekle**'ye tıkla, onayla ve Nowly simgesini araç çubuğuna sabitle; böylece tek tıkla erişebilirsin.

Nowly, tarayıcının yan panelinde (Firefox'ta kenar çubuğunda) bulunur. Araç çubuğundaki simgeyle veya **Ctrl+Shift+Y** (Mac'te **Cmd+Shift+Y**) ile aç. İlk açılışta kısa bir tanıtım her adımı açıklar. İstersen onu izleyebilir, istersen buradan devam edebilirsin: adımlar aynı.

## 2. adım: kullanıcı betiklerine izin ver

Her varlık, yalnızca yazıldığı sitede çalışan küçük bir betiktir. Tarayıcılar bunlara kullanıcı betiği der ve çalıştırmadan önce izin ister.

- **Chrome, Edge, Brave, Opera**: `chrome://extensions` (veya `edge://extensions`, `brave://extensions`, `opera://extensions`) sayfasını aç, Nowly'yi bul, **Ayrıntılar**'a tıkla ve **Kullanıcı betiklerine izin ver** seçeneğini aç. Eski Chrome sürümlerinde bu anahtar henüz yoktur; bunun yerine uzantılar sayfasının sağ üstündeki **Geliştirici modu**'nu aç.
- **Firefox**: İlk kurulum sırasında izin bir kez istenir. Kabul et.

Bu iznin tam olarak neleri kapsadığını öğrenmek için [Nowly neden kullanıcı betiklerine izin ister?](/guides/allow-user-scripts) rehberini oku.

## 3. adım: masaüstü uygulamasını yükle

Discord, Rich Presence'ı yalnızca aynı bilgisayarda çalışan bir programdan, sitelerin ve uzantıların kendi başına açamadığı yerel bir bağlantı üzerinden kabul eder. Nowly masaüstü uygulaması (uzantıda Nowly Desktop olarak görünür) bu programdır. Penceresi yoktur: Nowly ihtiyaç duyduğunda tarayıcı onu başlatır ve etkinliğini Discord'a aktarır.

[Masaüstü uygulaması sayfasını](/desktop) aç. Sistemini algılar ve uygun dosyayı sunar.

- **Windows**: Yükleyiciyi çalıştır. Derleme henüz ücretli bir sertifikayla imzalanmadığı için Windows SmartScreen uyarı gösterebilir. Yalnızca nowly.me'den indirdiğin dosyada **Diğer bilgiler** ve ardından **Yine de çalıştır**'ı seç.
- **macOS**: Disk imajını aç ve yönergeleri izle. Uygulama Apple tarafından noter onaylıdır; Gatekeeper kabul eder.
- **Linux**: Debian, Ubuntu veya Mint'te `.deb` paketini yükle. Diğer dağıtımlarda arşivi indirip içindeki kurulum betiğini çalıştır. Sorun yaşarsan [Linux'ta Nowly](/guides/nowly-on-linux) rehberine bak.

## 4. adım: Discord'u aç ve etkinlik ayarını kontrol et

Discord masaüstü uygulamasını başlat ve açık bırak. Ardından Discord'un etkinliğini göstermesine izin verildiğini doğrula: **Kullanıcı Ayarları**'ndan **Etkinlik Gizliliği**'ne gir ve mevcut etkinliğini paylaşma seçeneğinin açık olduğundan emin ol. İfadesi Discord sürümüne göre değişebilir; etkinliğinden veya durum mesajından söz eden anahtarı aramalısın.

Durumun **Görünmez** olduğunda, Nowly ne gönderirse göndersin etkinliğini kimsenin göremeyeceğini de unutma.

## 5. adım: ilk varlığını yükle

Varlıkları [kitaplıkta](/library) bulabilirsin. İlk deneme için YouTube uygundur; birkaç saniyede video başlatabilirsin:

1. [YouTube varlığını](/library/youtube) aç.
2. Sayfanın uzantıyı algılamasını bekle, ardından **Yükle**'ye tıkla.
3. YouTube'da bir video açıp oynat.

Yan panelden çıkmadan da varlık yükleyebilirsin: uzantıdaki **Kitaplık** sekmesi aynı kataloğu listeler. Her varlığın dijital imzası yüklenmeden önce doğrulanır.

## 6. adım: tanı göstergelerini oku

Nowly yan panelini aç. Tanı bölümünde altı kontrol bulunur; hazır olduklarında her biri yeşile döner:

| Kontrol | Anlamı |
| --- | --- |
| Uzantı yüklü | Uzantı bu tarayıcıda çalışıyor. |
| Kullanıcı betiklerine izin verildi | Tarayıcı, Nowly varlıklarının çalışmasına izin veriyor. |
| Nowly Desktop algılandı | Masaüstü uygulaması uzantıya yanıt verdi. |
| Discord bağlandı | Masaüstü uygulaması Discord uygulamasına ulaştı. |
| Bir varlık yüklü | En az bir varlık yüklü. |
| Etkinlik algılandı | Bir varlık mevcut sekmede gösterilecek bir şey buldu. |

Altısı da yeşil olduğunda Discord profilini kontrol et: video başlığı, kanal, küçük resim ve ilerleme çubuğuyla birlikte **YouTube izliyor** görünmeli. Bir satır kırmızı kalırsa önce onu düzelt; zincirde sıradaki eksik bağlantı odur. [Sorun giderme kontrol listesi](/guides/rich-presence-not-showing) bütün olasılıkları ele alır.

## Arkadaşların ne görür?

YouTube varlığında oynayan bir video; başlığı, kanal adını, küçük resmi, geçen süreyi ve **Videoyu izle** düğmesini gösterir. Duraklatınca oynat simgesinin yerini duraklat simgesi alır. YouTube ana sayfasına veya arama sonuçlarına göz atmak varsayılan olarak hiçbir şey göstermez: çoğu varlık yalnızca gerçekten izlediğin veya dinlediğin şeyi paylaşır. Gezinme etkinliğini her varlık için ayrıca açabilirsin.

## Sonraki adımlar

- Gerçekten kullandığın platformları [kitaplıktan](/library) ekle: Netflix, Twitch, Crunchyroll, Spotify ve 40'tan fazla başka platform.
- Paylaşımı duraklatmayı, bir sekmeyi gizlemeyi veya yalnızca belirli saatlerde paylaşmayı [Discord'un hakkında tam olarak ne göstereceğini seç](/guides/control-what-discord-shows) rehberinden öğren.
- Perde arkasını merak mı ediyorsun? [Discord Rich Presence nedir?](/guides/what-is-discord-rich-presence) rehberini oku.
