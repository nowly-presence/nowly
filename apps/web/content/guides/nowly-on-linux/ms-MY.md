---
title: "Nowly di Linux: .deb, arkib, Flatpak dan Snap"
description: Pasang aplikasi desktop Nowly pada mana-mana edaran, baiki kitaran "kemas kini tersedia" dan gunakan Rich Presence dengan Discord atau pelayar yang dipasang melalui Flatpak atau Snap.
category: troubleshooting
order: 3
updated: 2026-10-09
related: rich-presence-not-showing, set-up-nowly, what-is-discord-rich-presence
---

Nowly berfungsi di Linux seperti di Windows dan macOS: sambungan pelayar mengesan aktiviti anda, dan aplikasi desktop menyampaikannya kepada aplikasi Discord pada komputer sama. Namun, Linux menawarkan beberapa pilihan tambahan, dan pakej dalam persekitaran terkurung boleh menghalang sambungan. Panduan ini meliputi pemasangan pada pelbagai jenis edaran dan penyelesaian kepada masalah yang lazim dialami pengguna Linux.

## Keperluan

- Edaran 64-bit (x64) dengan glibc 2.17 atau lebih baharu, yang merangkumi semua edaran arus perdana semasa.
- Aplikasi desktop Discord daripada pakej `.deb` Discord, arkib rasmi, edaran anda, Flatpak atau Snap.
- Chrome, Chromium, Brave, Edge, Opera atau Firefox, sebaik-baiknya dipasang daripada repositori edaran anda atau pakej daripada pembekalnya sendiri.

## Pilih muat turun yang sesuai

[Halaman aplikasi desktop](/desktop) menawarkan dua fail untuk Linux:

- **Pakej `.deb`** untuk Debian, Ubuntu, Linux Mint, Pop!_OS, elementary OS dan sistem berasaskan Debian yang lain. Pakej ini memasang aplikasi untuk seluruh sistem dan mendaftarkannya pada setiap pelayar yang disokong.
- **Arkib `.tar.gz`** untuk edaran lain seperti Fedora, Arch dan openSUSE. Arkib ini mengandungi aplikasi serta skrip pemasangan yang mendaftarkannya untuk pengguna anda.

## Pasang pakej .deb

Pada kebanyakan desktop, klik dua kali fail tersebut untuk membuka pemasang perisian. Pada sesetengah desktop, misalnya XFCE dengan Thunar, klik dua kali tidak berbuat apa-apa jika pemasang pakej grafik belum disediakan. Sebaliknya, pasang daripada terminal:

```bash
sudo dpkg -i ~/Downloads/nowly-host.deb
```

Kemudian semak sama ada ia benar-benar telah dipasang:

```bash
dpkg -L nowly-host
```

Senarai itu sepatutnya mengandungi `/usr/lib/nowly-client/nowly-host`. Mulakan semula pelayar sepenuhnya, bukan tab sahaja, supaya ia dapat mencari aplikasi baharu.

## Pasang daripada arkib

Ekstrak arkib, buka terminal dalam folder yang telah diekstrak dan jalankan skrip pemasangan di dalamnya, sambil mengikuti arahan yang dicetak oleh skrip. Skrip itu menyalin aplikasi ke dalam direktori utama anda dan menulis fail manifes kecil yang memberitahu pelayar lokasi aplikasi, seperti `~/.config/google-chrome/NativeMessagingHosts/nowly.client.json` untuk Chrome atau `~/.mozilla/native-messaging-hosts/nowly.client.json` untuk Firefox. Mulakan semula pelayar selepas itu.

## "Kemas kini tersedia" sejurus selepas memasang

Jika panel sisi Nowly mengatakan kemas kini aplikasi desktop tersedia walaupun anda baru memasang versi terkini, semak dua punca berikut mengikut turutan:

1. **Pakej `.deb` sebenarnya tidak dipasang.** Jalankan `dpkg -L nowly-host`. Jika arahannya mengatakan pakej belum dipasang, pasang melalui terminal seperti yang ditunjukkan di atas.
2. **Pemasangan lama khusus pengguna diberi keutamaan.** Jika anda pernah menggunakan arkib sebelum beralih kepada `.deb`, manifes lama dalam direktori utama anda masih menunjuk kepada aplikasi lama. Buangkannya:

```bash
rm -f ~/.mozilla/native-messaging-hosts/nowly.client.json
rm -f ~/.config/*/NativeMessagingHosts/nowly.client.json
rm -f ~/.local/share/NowlyClient/nowly-host
```

Kemudian tutup pelayar sepenuhnya dan bukanya semula supaya ia memulakan aplikasi desktop daripada lokasi baharu.

## Discord yang dipasang melalui Flatpak atau Snap

Versi Discord dalam persekitaran terkurung meletakkan soket Rich Presence di dalam folder kurungan masing-masing, bukan di lokasi biasa. Aplikasi desktop Nowly mencari `discord-ipc-0` hingga `discord-ipc-9` dalam `$XDG_RUNTIME_DIR`, `$TMPDIR` dan `/tmp`, jadi ia mungkin tidak menemui Discord daripada Flatpak atau Snap. Alat Rich Presence lain menghadapi masalah yang sama; penyelesaian biasa ialah pautan simbolik dari lokasi yang dijangka ke soket sebenar.

Bagi **Discord daripada Flathub**, soket berada dalam `$XDG_RUNTIME_DIR/app/com.discordapp.Discord/`. Cipta pautan dengan:

```bash
ln -sf "$XDG_RUNTIME_DIR/app/com.discordapp.Discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

`$XDG_RUNTIME_DIR` dikosongkan setiap kali komputer dimulakan semula, jadi pautan itu juga hilang. Untuk menciptanya semula secara automatik setiap kali log masuk, biarkan systemd menguruskannya:

```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

Bagi **Discord daripada Snap Store**, soket biasanya berada dalam `$XDG_RUNTIME_DIR/snap.discord/`. Pautan yang sama jenisnya berfungsi:

```bash
ln -sf "$XDG_RUNTIME_DIR/snap.discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

Mulakan Discord sebelum mencipta pautan, kemudian klik **Semak sambungan** dalam panel sisi Nowly.

## Pelayar yang dipasang melalui Flatpak atau Snap

Pelayar memulakan aplikasi desktop Nowly melalui pemesejan natif. Pelayar dalam persekitaran terkurung mengehadkan program yang boleh dimulakan; bergantung pada pakej dan versinya, pemesejan natif mungkin disekat sepenuhnya. Tandanya ialah baris **Nowly Desktop dikesan** yang tidak pernah bertukar hijau, tanpa mengira apa yang anda pasang.

Penyelesaian yang boleh diharapkan ialah menggunakan pelayar yang dipasang daripada repositori edaran anda atau pakej `.deb` atau `.rpm` daripada pembekalnya, bukannya versi Flatpak atau Snap. Penanda halaman dan kata laluan anda akan kembali apabila anda log masuk ke akaun pelayar.

## Pemberitahuan dan log

Apabila Discord menyekat sambungan akibat masalah kebenaran, aplikasi desktop boleh menunjukkan pemberitahuan desktop melalui `notify-send`, jika desktop anda menjalankan perkhidmatan pemberitahuan.

Aplikasi desktop menulis lognya ke `~/.cache/NowlyClient/nowly-host.log`. Log itu mungkin mengandungi aktiviti yang dihantar ke Discord, jadi bacalah sebelum berkongsinya dalam tiket sokongan. Anda boleh memadamnya pada bila-bila masa.

## Senarai semak

- `dpkg -L nowly-host` menyenaraikan aplikasi, atau skrip pemasangan arkib berjalan tanpa ralat.
- Tiada manifes lama yang tertinggal daripada pemasangan terdahulu.
- Discord sedang berjalan dan soketnya dapat dicapai melalui `$XDG_RUNTIME_DIR` atau `/tmp`.
- Pelayar bukan daripada Flatpak atau Snap, atau pemesejan natif berfungsi di dalamnya.

Jika keempat-empatnya benar tetapi Nowly masih tidak dapat mencapai Discord, ikuti [senarai semak penyelesaian masalah](/guides/rich-presence-not-showing) dan buka tiket di pelayan Discord Nowly dengan menyatakan edaran, persekitaran desktop serta cara Discord dan pelayar dipasang.
