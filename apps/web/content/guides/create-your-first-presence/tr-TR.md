---
title: İlk Nowly varlığını oluştur
description: Boş bir klasörden çalışan bir Discord etkinliğine kadar gereken araçlar, varlık dosyaları, ilk betik, yerel deneme ve yayımlama süreci.
category: developers
order: 1
updated: 2026-10-09
related: what-is-discord-rich-presence, allow-user-scripts, nowly-vs-premid
---

Nowly kitaplığındaki her platform, biri onun için bir varlık yazdığı için oradadır. Kullandığın bir site eksikse sen de ekleyebilirsin. Varlık, ilk sürümünde genellikle yüz satırdan kısa olan küçük bir TypeScript projesidir. Nowly CLI proje iskeletini, derlemeyi ve yerel denemeyi halleder. Bu rehber seni sıfırdan Discord durumunu güncelleyen bir varlığa kadar götürür. Tam başvuru kaynağı [Nowly belgelerinde](https://docs.nowly.me/) bulunur.

## Gerekenler

- CLI'ı çalıştırıp varlıkları derlemek için **Node.js 22 veya üzeri** ve **pnpm**.
- Varlıklar deposunu klonlayıp çekme isteği açmak için **Git**.
- Gerçek ortamda denemek için **Chromium tabanlı bir tarayıcı veya Firefox**, [Nowly masaüstü uygulaması](/desktop) yüklü bilgisayarda **Discord masaüstü uygulaması**.
- Temel JavaScript veya TypeScript bilgisi ve hedeflediğin sayfayı incelemek için tarayıcı geliştirici araçları.

## Depoyu ve CLI'ı edin

Topluluğun tüm varlıkları MIT lisanslı, herkese açık tek bir depoda bulunur:

```bash
git clone https://github.com/nowly-presence/presences.git
cd presences
pnpm install
pnpm i -g @nowly/cli
```

`pnpm install`, düzenleyicinin Presence API türlerini tanımasını sağlayan `@nowly/sdk` paketini de bağlar.

## Varlık iskeletini oluştur

```bash
nowly init "Example"
```

CLI birkaç soru sorar ve platform adının ilk harfine göre `src/E/Example/` altında bir klasör oluşturur:

- `metadata.json`: varlığın adı, yazarı, desteklenen adresleri, kategorisi, rengi, açıklamaları ve ayarları.
- `presence.ts`: sayfayı okuyup etkinliği ayarlayan kod.
- `locales/`: Discord'da gösterilen metinler; her dil için ayrı dosya.
- `assets/`: Discord'da ve kitaplıkta kullanılan logo, simge ve küçük resim.

CLI ayrıca Discord'un bu platformu bağlı hesap aracılığıyla zaten gösterip göstermediğini sorar. Gösteriyorsa kitaplığın kullanıcılara bunu söyleyebilmesi için varlığı işaretler.

## Platformu metadata.json içinde tanımla

En önemli alanlar adreslerdir. `url` ana makine adlarını listeler; `regExp`, varlığın çalışması için sayfa adresinin eşleşmesi gereken desendir. Bunları sitenin izin verdiği kadar dar tut: varlık anlamadığı sayfalarda asla çalışmamalıdır.

`category`, `streaming`, `music`, `video`, `social`, `gaming`, `tools`, `ai`, `learning`, `creator` ve `other` değerlerinden biridir. Açıklamalar her dil için ayrı yazılır; İngilizce yedek dildir.

## İlk varlığını yaz

`Presence` ve `Assets` çalışma ortamınca sağlanır. SDK'dan yalnızca `PresenceType` gibi yardımcılar içe aktarılır:

```ts
import { PresenceType } from "@nowly/sdk"

const presence = new Presence()

presence.on("UpdateData", async () => {
  await presence.setActivity({
    details: document.title,
    state: document.location.hostname,
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
})
```

`UpdateData`, sayfa açıkken düzenli aralıklarla ve kullanıcı bir ayarı değiştirdiğinde tetiklenir. Her seferinde sayfayı oku ve etkinliği gönder. Gösterilmeye değer bir şey yoksa boş bir durum göndermek yerine `presence.clearActivity()` çağır.

Medya için SDK'daki `createMediaTimestamps(video)`, bir `audio` veya `video` öğesini Discord'un ilerleme çubuğu için ihtiyaç duyduğu başlangıç ve bitiş zamanlarına dönüştürür.

## Kullanan kişilere saygı göster

Kitaplıktaki varlıklar, kullanıcıların güvendiği birkaç kurala uyar:

- Kullanıcının gezdiği her şeyi değil, gerçekten yaptığını göster. Gezinme sayfalarını varsayılan olarak kapalı bir **Gezinme etkinliğini göster** ayarının arkasına koy.
- İçerik kişisel olabilecekse başlıkları gizleyen bir mod sun veya özel konuşmaları Discord'dan uzak tut.
- Verileri etkinlik dışında hiçbir yere gönderme ve etkinlik için gerekenden fazlasını okuma.
- Discord'da gösterilen her metin için `locales/` içindeki yerelleştirilmiş dizeleri kullan.

## Yerel olarak derle ve dene

Üst verileri ve görselleri doğrula, ardından derle:

```bash
nowly validate
nowly build example
```

Nowly tarayıcında henüz yüklü değilse varlığı kullanıma hazır bir geliştirme uzantısına ekle:

```bash
nowly extension example
nowly extension example --firefox
```

`chrome://extensions` sayfasında **Geliştirici modu** açıkken `dist/extension-dev` klasörünü paketlenmemiş uzantı olarak yükle; Firefox'ta ise `about:debugging` üzerinden `dist/extension-dev-firefox/manifest.json` dosyasını geçici eklenti olarak yükle. Hedef siteyi açtığında Discord durumun değişmeli.

Nowly'nin paketlenmemiş bir geliştirme derlemesini zaten çalıştırıyorsan zip dosyasıyla daha hızlı yineleme yapabilirsin:

```bash
nowly pack example
```

Ardından `dist/packs/example.zip` dosyasını uzantının **Ayarlar** > **Gelişmiş** > **Hata ayıklama** bölümüne bırak. İmzasız zip dosyaları yalnızca paketlenmemiş derlemelerde kabul edilir; mağaza sürümünde asla kabul edilmez.

## Yayımlanmasını sağla

1. Son kez `nowly validate` çalıştır ve hiçbir şey oynatılmadığı durum dahil birkaç gerçek sayfada varlığı kontrol et.
2. Varlıklar deposunda kısa bir açıklama ve Discord durumunun ekran görüntüsüyle çekme isteği aç.
3. Ekip kodu inceler, sürümü imzalar ve kitaplıkta yayımlar. Ardından herkes tek tıkla yükleyebilir; kitaplık sayfasında yazar olarak sen görünürsün.

## Daha ileriye git

Belgeler Presence API'nin tamamını, ayarları, yerelleştirmeyi, zaman damgalarını, iframe'leri ve Discord'un doğrudan yükleyemediği görseller için görsel aracısını kapsar. [İlk varlığını oluşturma](https://docs.nowly.me/presence-development/creating-your-first-presence) rehberiyle başla ve çekme isteği açmadan önce [katkı yönergelerini](https://docs.nowly.me/publishing/contribution-guidelines) elinin altında tut.
