---
title: Cipta presence Nowly pertama anda
description: Daripada folder kosong kepada aktiviti Discord yang berfungsi: alat yang diperlukan, fail presence, skrip pertama, ujian setempat dan cara menerbitkannya.
category: developers
order: 1
updated: 2026-10-09
related: what-is-discord-rich-presence, allow-user-scripts, nowly-vs-premid
---

Setiap platform dalam pustaka Nowly wujud kerana seseorang menulis presence untuknya. Jika laman web yang anda gunakan belum ada, anda boleh menambahnya sendiri. Presence ialah projek TypeScript kecil, biasanya kurang daripada seratus baris untuk versi pertama, manakala CLI Nowly mengurus penjanaan rangka projek, pembinaan dan ujian setempat. Panduan ini membawa anda daripada permulaan hingga menghasilkan presence yang mengemas kini status Discord anda. Rujukan lengkap ada dalam [dokumentasi Nowly](https://docs.nowly.me/).

## Perkara yang diperlukan

- **Node.js 22 atau lebih baharu** dan **pnpm**, untuk menjalankan CLI dan membina presence.
- **Git**, untuk mengklon repositori presence dan membuka permintaan cantum.
- **Pelayar Chromium atau Firefox**, serta **aplikasi desktop Discord** dengan [aplikasi desktop Nowly](/desktop) terpasang, untuk menguji dalam keadaan sebenar.
- Pengetahuan asas JavaScript atau TypeScript, dan alat pembangun pelayar untuk memeriksa halaman sasaran.

## Dapatkan repositori dan CLI

Semua presence komuniti berada dalam satu repositori awam di bawah lesen MIT:

```bash
git clone https://github.com/nowly-presence/presences.git
cd presences
pnpm install
pnpm i -g @nowly/cli
```

`pnpm install` turut memautkan pakej `@nowly/sdk`, yang memberikan jenis bagi API Presence kepada editor anda.

## Jana rangka presence

```bash
nowly init "Example"
```

CLI mengemukakan beberapa soalan dan mencipta folder di bawah `src/E/Example/`, berdasarkan huruf pertama nama platform:

- `metadata.json`: nama, penulis, alamat disokong, kategori, warna, penerangan dan tetapan presence.
- `presence.ts`: kod yang membaca halaman dan menetapkan aktiviti.
- `locales/`: teks yang ditunjukkan di Discord, satu fail bagi setiap bahasa.
- `assets/`: logo, ikon dan imej kecil yang digunakan di Discord dan dalam pustaka.

CLI juga bertanya sama ada Discord sudah memaparkan platform ini melalui akaun yang dipautkan. Jika ya, presence ditandakan supaya pustaka dapat memaklumkan pengguna.

## Terangkan platform dalam metadata.json

Medan paling penting ialah alamat. `url` menyenaraikan nama hos, manakala `regExp` ialah corak yang mesti dipadankan oleh alamat halaman sebelum presence berjalan. Hadkan skopnya mengikut kemampuan laman: presence tidak patut berjalan pada halaman yang tidak difahaminya.

`category` boleh bernilai `streaming`, `music`, `video`, `social`, `gaming`, `tools`, `ai`, `learning`, `creator` atau `other`. Penerangan ditulis bagi setiap bahasa, dan bahasa Inggeris digunakan jika terjemahan tiada.

## Tulis presence pertama

`Presence` dan `Assets` disediakan oleh masa jalan. Hanya pembantu seperti `PresenceType` diimport daripada SDK:

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

`UpdateData` dicetuskan secara berkala selagi halaman terbuka dan setiap kali pengguna mengubah tetapan. Pada setiap kejadian, baca halaman dan hantar aktiviti. Apabila tiada apa-apa yang sesuai untuk dipaparkan, panggil `presence.clearActivity()` dan jangan hantar status kosong.

Bagi media, `createMediaTimestamps(video)` daripada SDK menukar elemen `audio` atau `video` menjadi masa mula dan tamat yang diperlukan Discord untuk bar kemajuan.

## Hormati orang yang menggunakannya

Presence dalam pustaka mengikuti beberapa peraturan yang penting kepada pengguna:

- Paparkan apa yang pengguna benar-benar sedang lakukan, bukan setiap halaman yang dilayari. Letakkan halaman pelayaran di sebalik tetapan **Tunjukkan aktiviti melayari**, yang dimatikan secara lalai.
- Sediakan pilihan privasi apabila kandungan mungkin bersifat peribadi: misalnya mod yang menyembunyikan tajuk atau pengecualian perbualan peribadi daripada Discord.
- Jangan sekali-kali hantar data ke mana-mana selain aktiviti, dan jangan baca lebih daripada yang diperlukan oleh aktiviti itu.
- Gunakan teks setempat daripada `locales/` untuk semua teks yang ditunjukkan di Discord.

## Bina dan uji secara setempat

Sahkan metadata dan aset, kemudian bina:

```bash
nowly validate
nowly build example
```

Jika Nowly belum dipasang dalam pelayar anda, masukkan presence ke dalam sambungan pembangunan yang sedia digunakan:

```bash
nowly extension example
nowly extension example --firefox
```

Muatkan `dist/extension-dev` sebagai sambungan tidak berpakej daripada `chrome://extensions` dengan **Mod pembangun** dihidupkan, atau muatkan `dist/extension-dev-firefox/manifest.json` sebagai alat tambah sementara daripada `about:debugging` dalam Firefox. Buka laman web sasaran, dan status Discord anda sepatutnya berubah.

Jika anda sudah menjalankan binaan pembangunan Nowly yang tidak berpakej, percepatkan kitaran pengujian dengan fail zip:

```bash
nowly pack example
```

Kemudian letakkan `dist/packs/example.zip` dalam bahagian **Tetapan**, **Lanjutan**, **Nyahpepijat** pada sambungan. Fail zip tanpa tandatangan hanya diterima oleh binaan tidak berpakej, tidak sekali-kali oleh versi gedung.

## Terbitkannya

1. Jalankan `nowly validate` sekali lagi dan periksa presence pada beberapa halaman sebenar, termasuk ketika tiada apa-apa dimainkan.
2. Buka permintaan cantum pada repositori presence dengan penerangan ringkas dan tangkapan skrin status Discord.
3. Pasukan menyemak kod, menandatangani keluaran dan menerbitkannya ke pustaka. Selepas itu, sesiapa sahaja boleh memasangnya dengan satu klik, dan nama anda dipaparkan sebagai penulis pada halaman pustakanya.

## Ketahui lebih lanjut

Dokumentasi merangkumi keseluruhan API Presence, tetapan, penyetempatan, cap masa, iframe dan proksi imej bagi imej yang tidak dapat dimuatkan terus oleh Discord. Mulakan dengan [Mencipta presence pertama anda](https://docs.nowly.me/presence-development/creating-your-first-presence) dan rujuk [garis panduan sumbangan](https://docs.nowly.me/publishing/contribution-guidelines) sebelum membuka permintaan cantum.
