---
title: "Linux'ta Nowly: .deb, arşiv, Flatpak ve Snap"
description: Nowly masaüstü uygulamasını her dağıtımda yükle, "güncelleme mevcut" döngüsünü düzelt ve Flatpak veya Snap üzerinden kurulmuş Discord ya da tarayıcıyla Rich Presence'ı çalıştır.
category: troubleshooting
order: 3
updated: 2026-10-09
related: rich-presence-not-showing, set-up-nowly, what-is-discord-rich-presence
---

Nowly Linux'ta Windows ve macOS'taki gibi çalışır: tarayıcı uzantısı etkinliğini algılar, masaüstü uygulaması da bunu aynı bilgisayardaki Discord uygulamasına iletir. Ancak Linux'ta birkaç kurulum seçeneği vardır ve yalıtılmış paketler sorun çıkarabilir. Bu rehber, her tür dağıtımda kurulumu ve Linux kullanıcılarının gerçekten karşılaştığı sorunların çözümlerini anlatır.

## Gereksinimler

- Güncel yaygın dağıtımların tümünü kapsayan, glibc 2.17 veya üzeri sürüme sahip 64 bit (x64) dağıtım.
- Discord'un `.deb` paketinden, resmî arşivinden, dağıtımından, Flatpak'ten veya Snap'ten yüklenmiş Discord masaüstü uygulaması.
- Tercihen dağıtımının depolarından veya üreticinin kendi paketinden yüklenmiş Chrome, Chromium, Brave, Edge, Opera veya Firefox.

## Doğru dosyayı seç

[Masaüstü uygulaması sayfası](/desktop) Linux için iki dosya sunar:

- **`.deb` paketi** Debian, Ubuntu, Linux Mint, Pop!_OS, elementary OS ve Debian tabanlı diğer sistemler içindir. Uygulamayı sistem geneline yükler ve desteklenen tüm tarayıcılara kaydeder.
- **`.tar.gz` arşivi** Fedora, Arch, openSUSE ve diğer dağıtımlar içindir. Uygulamayı ve kullanıcı hesabın için kaydeden bir kurulum betiğini içerir.

## .deb paketini yükle

Çoğu masaüstünde dosyaya çift tıklamak grafik arayüzlü paket yükleyicisini açar. Bazı masaüstlerinde, örneğin Thunar kullanan XFCE'de, grafik paket yükleyicisi ayarlanmamışsa çift tıklamak hiçbir şey yapmaz. Bu durumda terminalden yükle:

```bash
sudo dpkg -i ~/Downloads/nowly-host.deb
```

Ardından gerçekten yüklendiğini kontrol et:

```bash
dpkg -L nowly-host
```

Listede `/usr/lib/nowly-client/nowly-host` bulunmalı. Yeni uygulamayı bulabilmesi için yalnızca sekmeyi değil, tarayıcıyı tamamen yeniden başlat.

## Arşivden yükle

Arşivi çıkar, çıkarılan klasörde bir terminal aç ve içindeki kurulum betiğini, betiğin yazdırdığı yönergelere göre çalıştır. Uygulamayı ev dizinine kopyalar ve tarayıcılara nerede bulacaklarını söyleyen küçük manifest dosyalarını oluşturur: Chrome için `~/.config/google-chrome/NativeMessagingHosts/nowly.client.json`, Firefox için `~/.mozilla/native-messaging-hosts/nowly.client.json` gibi. Sonrasında tarayıcıyı yeniden başlat.

## Kurulumun hemen ardından "Güncelleme mevcut" yazıyorsa

En yeni sürümü henüz yüklemene rağmen Nowly yan paneli masaüstü uygulaması için güncelleme olduğunu söylüyorsa aşağıdaki iki nedeni sırayla kontrol et:

1. **`.deb` hiç yüklenmemiştir.** `dpkg -L nowly-host` komutunu çalıştır. Paket yüklü değil diyorsa yukarıda gösterildiği gibi terminalden yükle.
2. **Kullanıcı hesabına yapılan eski kurulum öncelik alıyordur.** Arşivden `.deb` paketine geçtiysen ev dizinindeki eski manifest hâlâ eski uygulamayı gösterir. Kaldır:

```bash
rm -f ~/.mozilla/native-messaging-hosts/nowly.client.json
rm -f ~/.config/*/NativeMessagingHosts/nowly.client.json
rm -f ~/.local/share/NowlyClient/nowly-host
```

Ardından tarayıcıdan tamamen çık ve yeniden aç; böylece masaüstü uygulamasını yeni konumundan başlatır.

## Flatpak veya Snap ile yüklenmiş Discord

Discord'un yalıtılmış sürümleri Rich Presence soketini olağan konumu yerine kendi yalıtılmış klasöründe oluşturur. Nowly masaüstü uygulaması `$XDG_RUNTIME_DIR`, `$TMPDIR` ve `/tmp` içinde `discord-ipc-0` ile `discord-ipc-9` arasındaki soketleri arar; bu yüzden Flatpak veya Snap ile yüklenmiş Discord'u bulamayabilir. Diğer Rich Presence araçlarında da aynı sorun görülür. Yaygın çözüm, beklenen konumdan gerçek sokete bir sembolik bağ oluşturmaktır.

**Flathub'dan yüklenen Discord** için soket `$XDG_RUNTIME_DIR/app/com.discordapp.Discord/` içindedir. Şu komutla bağı oluştur:

```bash
ln -sf "$XDG_RUNTIME_DIR/app/com.discordapp.Discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

`$XDG_RUNTIME_DIR` her yeniden başlatmada boşaltılır; bağ da kaybolur. Her oturum açışında yeniden oluşturulması için systemd'yi kullan:

```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

**Snap Store'dan yüklenen Discord** için soket genellikle `$XDG_RUNTIME_DIR/snap.discord/` içindedir. Benzer bir bağ oluşturabilirsin:

```bash
ln -sf "$XDG_RUNTIME_DIR/snap.discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

Bağı oluşturmadan önce Discord'u başlat, ardından Nowly yan panelindeki **Bağlantıyı kontrol et**'e tıkla.

## Flatpak veya Snap ile yüklenmiş tarayıcı

Tarayıcı, Nowly masaüstü uygulamasını yerel mesajlaşma aracılığıyla başlatır. Yalıtılmış tarayıcılar hangi programları başlatabileceklerini sınırlar; paket ve sürüme göre yerel mesajlaşma tamamen engellenebilir. Belirti, ne yüklesen de **Nowly Desktop algılandı** satırının yeşile dönmemesidir.

Güvenilir çözüm, tarayıcının Flatpak veya Snap sürümü yerine dağıtımının depolarından veya üreticinin kendi `.deb` ya da `.rpm` paketinden yüklenmiş sürümünü kullanmaktır. Tarayıcı hesabına giriş yaptığında yer imlerin ve parolaların geri gelir.

## Bildirimler ve günlükler

Discord izin sorunu nedeniyle bağlantıyı engellediğinde masaüstünde bildirim hizmeti çalışıyorsa masaüstü uygulaması `notify-send` aracılığıyla bildirim gösterebilir.

Masaüstü uygulaması günlüğünü `~/.cache/NowlyClient/nowly-host.log` dosyasına yazar. Günlük, Discord'a gönderilen etkinliği içerebilir; destek talebinde paylaşmadan önce oku. İstediğin zaman silebilirsin.

## Kontrol listesi

- `dpkg -L nowly-host` uygulamayı listeliyor veya arşivin kurulum betiği hatasız çalıştı.
- Eski bir kurulumdan kalma manifest yok.
- Discord çalışıyor ve soketine `$XDG_RUNTIME_DIR` veya `/tmp` üzerinden erişilebiliyor.
- Tarayıcı Flatpak veya Snap'ten yüklenmemiş ya da içindeki yerel mesajlaşma çalışıyor.

Dördü de doğru olduğu hâlde Nowly Discord'a ulaşamıyorsa [sorun giderme kontrol listesini](/guides/rich-presence-not-showing) izle; dağıtımını, masaüstü ortamını ve Discord ile tarayıcıyı nasıl yüklediğini belirterek Nowly Discord sunucusunda bir destek talebi aç.
