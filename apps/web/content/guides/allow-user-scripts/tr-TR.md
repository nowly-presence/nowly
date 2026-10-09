---
title: Nowly neden kullanıcı betiklerine izin ister ve bu izin nasıl verilir?
description: Kullanıcı betiği izni nedir, varlıklar neden buna ihtiyaç duyar, Chrome, Edge, Brave, Opera ve Firefox'ta nasıl açılır ve neleri kapsamaz?
category: start
order: 2
updated: 2026-10-09
related: set-up-nowly, what-nowly-can-see, rich-presence-not-showing
---

Kurulum sırasında Nowly, çoğu uzantının istemediği bir izin ister: kullanıcı betiklerini çalıştırma izni. Teknik bir konu gibi görünür; tarayıcının uyarısı da biraz ürkütücü olabilir. Bu rehber, iznin gerçekte neleri kapsadığını, Nowly'nin neden buna dayandığını ve desteklenen her tarayıcıda nasıl açılacağını anlatır.

## Kullanıcı betiği nedir?

Kullanıcı betiği, açtığın bir web sayfasında sayfanın kendi koduna ek olarak çalışan küçük bir JavaScript parçasıdır. Tarayıcılar, Tampermonkey gibi eklentiler aracılığıyla bu betikleri uzun zamandır destekler.

Chrome uzantılarının güncel biçimi olan Manifest V3'ten itibaren Chrome net bir ayrım yapar. Uzantının mağaza paketindeki kod, uzantıyla birlikte incelenir. Uzantının kurulumdan sonra eklediği kod ise kullanıcı betiği sayılır ve tarayıcı bunu ancak açıkça izin verdiğinde çalıştırır. Firefox da kendi izin istemiyle aynı yaklaşımı izler.

## Varlıklar neden kullanıcı betiğidir?

Her Nowly varlığı, bir sitenin nasıl çalıştığını bilen koddur: YouTube'un video başlığını nereye koyduğunu, Netflix'in bölüm numarasını nasıl sunduğunu, Spotify'ın ne zaman çaldığını veya duraklatıldığını bilir. 40'tan fazla varlık vardır ve siteler tasarımlarını sık sık değiştirir.

Her varlık uzantıya gömülü olsaydı her düzeltme yeni bir uzantı sürümü ve yeni bir mağaza incelemesi gerektirirdi; ayrıca hiç ziyaret etmediğin onlarca site için kod taşırdın. Bunun yerine uzantı küçük kalır, varlıklar [kitaplıktan](/library) ayrı ayrı yüklenir:

- Yalnızca kullandığın platformları yüklersin.
- Bozulan bir varlık, uzantı güncellenmeden birkaç saat içinde düzeltilip yeniden yayımlanabilir.
- Varlık yalnızca kendisi için listelenen adreslerde çalışır. Örneğin YouTube varlığı `www.youtube.com` ve `m.youtube.com` adreslerinde çalışır, başka hiçbir yerde çalışmaz.

## Nowly varlıkları nasıl güvenli tutar?

Tarayıcıların önce izin istemesinin nedeni indirilen kod çalıştırılmasıdır; bu yüzden Nowly ek denetimler uygular:

- Her resmî varlık Nowly ekibi tarafından bir ECDSA P-256 anahtarıyla imzalanır. Uzantı, betiği kaydetmeden önce imzayı ve paket ile üst verilerinin SHA-256 özetlerini doğrular. İmzalandıktan sonra değiştirilmiş bir betik reddedilir.
- Her varlığın kaynak kodu herkese açıktır; yüklemeden önce ne yaptığını herkes inceleyebilir.
- Varlıklar bulduklarını uzantıya iletir; uzantı bunları bilgisayarındaki masaüstü uygulamasına, uygulama da Discord'a aktarır. Bu yol Nowly sunucularından geçmez ve varlık kodu imzalanmadan önce incelenir.
- İmzasız paketler yalnızca elle yüklenen geliştirme derlemelerinde kabul edilir; mağaza sürümünde asla kabul edilmez.

## Chrome, Edge, Brave ve Opera'da aç

1. Uzantılar sayfasını aç: Chrome'da `chrome://extensions`, Edge'de `edge://extensions`, Brave'de `brave://extensions`, Opera'da `opera://extensions`.
2. **Nowly**'yi bul ve **Ayrıntılar**'a tıkla.
3. **Kullanıcı betiklerine izin ver**'i aç.
4. Discord'da göstermek istediğin sitelerin sekmelerini yenile.

Chrome ve Chromium tabanlı tarayıcıların eski sürümlerinde **Kullanıcı betiklerine izin ver** anahtarı henüz bulunmaz. O sürümlerde kullanıcı betikleri, uzantılar sayfasının sağ üstündeki **Geliştirici modu** ile etkinleştirilir. Bunu açmak Nowly'nin mağaza sürümünün güncellenme veya doğrulanma biçimini değiştirmez.

## Firefox'ta aç

Firefox, Nowly'nin ilk kurulumu sırasında kendi izin istemini bir kez gösterir. Kabul etmen yeterli.

İstemi kapattıysan `about:addons` sayfasını aç, **Nowly**'yi seç, **İzinler** sekmesine gir ve kullanıcı betiği iznini ver. Ardından göstermek istediğin sekmeleri yenile.

## Çalıştığını doğrula

Nowly yan panelini **Ctrl+Shift+Y** (Mac'te **Cmd+Shift+Y**) ile aç. Tanı bölümündeki **Kullanıcı betiklerine izin verildi** satırı artık yeşil olmalı. Yeşile döndüğünde Nowly yüklü varlıklarını kaydeder; desteklenen bir sayfada bakacağın sonraki satır **Etkinlik algılandı** olur.

İzni açmana rağmen satır kırmızı kalıyorsa:

- Uzantılar sayfasından uzantıyı yeniden yükle veya tarayıcıyı yeniden başlat.
- Ayarı başka bir uzantı için değil, Nowly için değiştirdiğinden emin ol.
- Tarayıcın okulun veya şirketin tarafından yönetiliyorsa kurum politikaları tüm uzantılarda kullanıcı betiklerini engelliyor olabilir.

## Bu izin ne yapmaz?

Kullanıcı betiklerine izin vermek Nowly'ye parolalarına, diğer uzantılarına veya dosyalarına erişim vermez. Uzantının belirli siteler için betik kaydetmesine olanak tanır; tarayıcı da her betiğin adres listesini uygulamaya devam eder. Nowly, bu izni yüklü bir varlığın desteklemediği sayfaları okumak için kullanmaz.

İzni istediğin zaman kapatabilirsin. O zaman varlıklar çalışmayı durdurur ve Discord etkinliğini göstermez; ancak hiçbir şey silinmez. Yeniden açtığında her şey kaldığı yerden devam eder.

## Kısacası

Kullanıcı betikleri, Nowly'nin küçük bir uzantıyla onlarca siteyi desteklemesini, varlıkları hızla güncellemesini ve yalnızca ihtiyacın olanları yüklemeni sağlar. İzin her tarayıcıda bir kez gereklidir; onu kullanan her varlık imzalıdır, kaynak kodu açıktır ve kendi siteleriyle sınırlıdır.
