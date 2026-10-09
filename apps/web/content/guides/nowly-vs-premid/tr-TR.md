---
title: "Nowly ve PreMiD: dürüst bir karşılaştırma"
description: İkisi de site etkinliğini Discord'da gösterir. Kurulum, katalog, gizlilik, güvenlik ve lisans açısından karşılaştırmaları ve kullandığın platformlara göre nasıl seçim yapacağın.
category: discord
order: 3
updated: 2026-10-09
related: discord-connections-vs-nowly, what-nowly-can-see, set-up-nowly
---

Tarayıcıda izlediklerini Discord'da göstermenin yolunu arıyorsan iki adla çabucak karşılaşırsın: uzun süredir var olan topluluk projesi PreMiD ve daha yeni bir alternatif olan Nowly. Aynı sorunu benzer bir temel tasarımla çözerler; bu nedenle doğru seçim ayrıntılara bağlıdır. Bu karşılaştırma, PreMiD'in üstün olduğu noktalar dahil, adil olmaya çalışır.

Her iki proje de hızla değişiyor. Aşağıdaki bilgiler yazıldıkları zamandaki durumu anlatır; en güncel bilgiler için projelerin kendi sitelerine bak.

## Ortak noktaları

- **Aynı mimari.** Bir tarayıcı uzantısı sayfayı okur, bilgisayarındaki küçük bir uygulama etkinliği yerel bağlantı üzerinden Discord masaüstü uygulamasına aktarır. İkisi de tarayıcı sekmesindeki veya telefondaki Discord ile çalışamaz.
- **Siteye özel bütünleştirmeler.** İkisi de bunlara varlık der: topluluk tarafından yazılan ve bir sitede neyin okunacağını bilen, platform başına bir betik.
- **Ücretsiz kullanım.** İkisinde de uzantı, masaüstü uygulaması ve varlıklar için ücret alınmaz.

## PreMiD'in önde olduğu yerler

- **Katalog büyüklüğü.** PreMiD yıllardır var ve topluluğu, pek çok niş site dahil yüzlerce site için varlık yazdı. Nowly kitaplığında bugün en çok kullanılanlara odaklanan 40'tan fazla platform bulunuyor.
- **Olgunluk ve topluluk.** Yıllarca kullanım sayesinde birçok uç durum görülüp düzeltildi; ayrıca geniş bir varlık yazarları topluluğu oluştu.

Önemsediğin platform yalnızca PreMiD mağazasında varsa PreMiD senin için daha iyi seçimdir. Bu kadar basit.

## Nowly'nin odaklandığı noktalar

- **İmzalı varlıklar.** Her resmî Nowly varlığı ekip tarafından ECDSA P-256 anahtarıyla imzalanır; uzantı çalıştırmadan önce imzayı ve özetleri kontrol eder. Değiştirilmiş bir betik reddedilir.
- **Varsayılan gizlilik.** Çoğu varlıkta gezinme etkinliği varsayılan olarak kapalıdır; bazılarında gizlilik modu vardır; geçici ChatGPT sohbetleri gizli kalır ve kullanım istatistikleri sen açmadıkça kapalıdır. Bkz. [Nowly neleri görebilir?](/guides/what-nowly-can-see).
- **Günlük kullanımda kontrol.** Paylaşımı duraklatan genel kısayol, gizli sekmeler, bir varlığı birkaç saatliğine erteleme ve varlık başına zamanlama. Bkz. [Discord'un hakkında tam olarak ne göstereceğini seç](/guides/control-what-discord-shows).
- **Yerleşik tanı.** Yan panel, zincirin her halkasını ayrı ayrı kontrol eder (uzantı, kullanıcı betikleri, masaüstü uygulaması, Discord, varlık, etkinlik); böylece hangisini düzeltmen gerektiğini bilirsin.
- **Yan panel arayüzü ve diller.** Uzantı tarayıcının yan panelinde yaşar; hem arayüz hem de site 11 dilde kullanılabilir.
- **Windows, macOS ve Linux için masaüstü uygulaması**; diğer dağıtımlar için `.deb` paketi ve arşiv bulunur.
- **İsteğe bağlı hesap eşitlemesi.** Varlıklarını ve ayarlarını birkaç tarayıcıda kullanmak istersen Discord ile giriş yaparsın; istemezsen gerekmez.

## Lisanslar

PreMiD'in kodu açık kaynaklıdır. Nowly varlıkları MIT lisansıyla açık kaynaklıdır; SDK'sı ve CLI'ı da katkıda bulunanlar için belgelenmiştir. Nowly'nin ana kodu GitHub'da Business Source License 1.1 kapsamında herkese açıktır. Bu, kaynak kodu görülebilen bir lisanstır: kodu okuyup denetleyebilirsin ama OSI onaylı bir açık kaynak lisansı değildir. Bu ayrım senin için önemliyse bilmekte yarar var.

## Hangisini seçmelisin?

- **Platformun yalnızca PreMiD'de varsa:** PreMiD'i kullan.
- **Platformların her ikisinde de varsa:** İmzalı varlıklar, gizlilik varsayılanları ve ayrıntılı kontrol önemliyse Nowly'yi dene; PreMiD'den memnunsan onda kal.
- **Farklı platformlarda ikisini birden istiyorsan:** Mümkün, ama dikkatli ol. Discord etkinliğini aynı anda güncelleyen iki araç birbirinin durumunu değiştirebilir veya temizleyebilir. Her platformla yalnızca birinin ilgilendiğinden emin ol; deneme sırasında diğer aracı kapat.

## PreMiD'den Nowly'ye geçiş

1. Etkinliğini güncellemeyi bırakması için PreMiD masaüstü uygulamasından çık ve tarayıcı uzantısını devre dışı bırak.
2. [Nowly nasıl kurulur?](/guides/set-up-nowly) rehberini izle: uzantı, kullanıcı betikleri, masaüstü uygulaması, Discord.
3. Kullandıklarının yerine geçecek varlıkları [kitaplıktan](/library) yükle.
4. Yan paneldeki tanıyı, ardından Discord profilini kontrol et.

PreMiD'de kullandığın bir şey kitaplıkta yoksa [destek sayfasından](/support) talep et: düzenli olarak yeni varlıklar eklenir. Dilersen [geliştirici rehberiyle](/guides/create-your-first-presence) kendin de bir varlık yazabilirsin.
