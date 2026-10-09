---
title: Cara menyediakan Nowly dan memaparkan aktiviti anda di Discord
description: Panduan lengkap daripada sambungan pelayar hingga aplikasi desktop, presence pertama anda dan semakan untuk memastikan semuanya berfungsi.
category: start
order: 1
updated: 2026-10-09
related: allow-user-scripts, rich-presence-not-showing, control-what-discord-shows
---

Nowly memaparkan apa yang anda tonton, dengar atau layari di laman web sebagai Discord Rich Presence: kad di bawah nama anda yang mengandungi tajuk, imej, bar kemajuan dan kadangkala butang. Penyediaannya mengambil masa kira-kira lima minit dan memerlukan tiga perkara: sambungan pelayar, aplikasi desktop kecil dan satu presence bagi setiap laman web yang ingin anda paparkan. Panduan ini menerangkan setiap langkah mengikut turutan dan diakhiri dengan semakan untuk mengesahkan semuanya tersambung.

## Perkara yang diperlukan sebelum bermula

- **Komputer**: Windows 10 atau 11, macOS 11 Big Sur atau lebih baharu, atau edaran Linux 64-bit.
- **Pelayar**: Chrome, Edge, Brave, Opera atau pelayar Chromium yang lain, ataupun Firefox.
- **Aplikasi desktop Discord**, dipasang dan telah dilog masuk. Discord dalam tab pelayar atau pada telefon tidak boleh menerima Rich Presence daripada program lain, jadi ia tidak akan berfungsi dengan Nowly.

Anda tidak memerlukan akaun Nowly. Semua yang diterangkan di bawah adalah percuma.

## Langkah 1: pasang sambungan pelayar

Buka [halaman sambungan](/extension) menggunakan pelayar yang anda pakai setiap hari. Butangnya membawa anda ke gedung yang sesuai: Chrome Web Store untuk Chrome, Edge, Brave dan Opera, serta Firefox Add-ons untuk Firefox. Klik **Tambah**, sahkan, kemudian sematkan ikon Nowly pada bar alat agar mudah dibuka.

Nowly berada dalam panel sisi pelayar anda (bar sisi dalam Firefox). Bukanya dengan ikon pada bar alat atau dengan **Ctrl+Shift+Y** (**Cmd+Shift+Y** pada Mac). Kali pertama, pengenalan ringkas menerangkan setiap langkah. Anda boleh mengikutinya atau terus membaca di sini: langkahnya sama.

## Langkah 2: benarkan skrip pengguna

Setiap presence ialah skrip kecil yang hanya berjalan pada laman web yang khusus untuknya. Pelayar memanggilnya skrip pengguna dan meminta kebenaran anda sebelum menjalankannya.

- **Chrome, Edge, Brave, Opera**: buka `chrome://extensions` (atau `edge://extensions`, `brave://extensions`, `opera://extensions`), cari Nowly, klik **Butiran** dan hidupkan **Benarkan skrip pengguna**. Pada versi Chrome yang lebih lama, suis ini belum ada: sebaliknya hidupkan **Mod pembangun** di bahagian atas sebelah kanan halaman sambungan.
- **Firefox**: pengenalan awal meminta kebenaran sekali sahaja. Terimanya.

Jika anda ingin tahu dengan tepat apa yang dibenarkan oleh kebenaran ini, baca [Mengapa Nowly meminta kebenaran menjalankan skrip pengguna](/guides/allow-user-scripts).

## Langkah 3: pasang aplikasi desktop

Discord hanya menerima Rich Presence daripada program yang berjalan pada komputer yang sama, melalui sambungan setempat yang tidak boleh dibuka sendiri oleh laman web atau sambungan pelayar. Aplikasi desktop Nowly (dipaparkan sebagai Nowly Desktop dalam sambungan) ialah program tersebut. Ia tidak mempunyai tetingkap: pelayar anda memulakannya apabila diperlukan, lalu ia menyampaikan aktiviti anda kepada Discord.

Buka [halaman aplikasi desktop](/desktop). Halaman itu mengesan sistem anda dan menawarkan fail yang sesuai.

- **Windows**: jalankan pemasang. Binaan ini belum ditandatangani dengan sijil berbayar, jadi Windows SmartScreen mungkin memaparkan amaran. Pilih **Maklumat lanjut**, kemudian **Jalankan juga**, tetapi hanya untuk fail yang anda muat turun daripada nowly.me.
- **macOS**: buka imej cakera dan ikut arahan. Aplikasi ini telah disahkan oleh Apple, jadi Gatekeeper menerimanya.
- **Linux**: pada Debian, Ubuntu atau Mint, pasang pakej `.deb`. Pada edaran lain, muat turun arkib dan jalankan skrip pemasangan di dalamnya. Jika ada masalah, lihat [Nowly di Linux](/guides/nowly-on-linux).

## Langkah 4: buka Discord dan semak tetapan aktivitinya

Mulakan aplikasi desktop Discord dan biarkan ia berjalan. Kemudian pastikan Discord dibenarkan memaparkan aktiviti anda: buka **Tetapan Pengguna**, kemudian **Privasi Aktiviti**, dan pastikan perkongsian aktiviti semasa dihidupkan. Perkataan tepatnya berubah mengikut versi Discord, tetapi ia ialah suis yang menyebut aktiviti atau mesej status anda.

Ingat juga bahawa apabila status anda **Tidak Kelihatan**, tiada siapa dapat melihat aktiviti anda, tanpa mengira apa yang dihantar oleh Nowly.

## Langkah 5: pasang presence pertama anda

Presence tersedia dalam [pustaka](/library). YouTube ialah pilihan terbaik untuk ujian pertama kerana video boleh dimainkan dalam beberapa saat:

1. Buka [presence YouTube](/library/youtube).
2. Tunggu sehingga halaman mengesan sambungan, kemudian klik **Pasang**.
3. Buka video di YouTube dan mulakan main balik.

Anda juga boleh memasang presence tanpa meninggalkan panel sisi: tab **Perpustakaan** dalam sambungan memaparkan katalog yang sama. Setiap presence disahkan melalui tandatangan digital sebelum dipasang.

## Langkah 6: baca diagnostik

Buka panel sisi Nowly. Diagnostik menyenaraikan enam semakan; setiap satu bertukar hijau apabila sedia:

| Semakan | Maksudnya |
| --- | --- |
| Sambungan dipasang | Sambungan berjalan dalam pelayar ini. |
| Skrip pengguna dibenarkan | Pelayar membenarkan Nowly menjalankan presence. |
| Nowly Desktop dikesan | Aplikasi desktop membalas sambungan. |
| Discord tersambung | Aplikasi desktop berjaya menghubungi aplikasi Discord. |
| Presence dipasang | Sekurang-kurangnya satu presence telah dipasang. |
| Aktiviti dikesan | Presence menemui sesuatu untuk dipaparkan pada tab semasa. |

Apabila keenam-enamnya hijau, lihat profil Discord anda: anda sepatutnya melihat **Menonton YouTube** bersama tajuk video, saluran, imej kecil dan bar kemajuan. Jika satu baris kekal merah, baiki perkara itu dahulu: itulah pautan seterusnya dalam rantaian. [Senarai semak penyelesaian masalah](/guides/rich-presence-not-showing) merangkumi setiap keadaan.

## Apa yang dilihat oleh rakan anda

Dengan presence YouTube, video yang sedang dimainkan memaparkan tajuknya, nama saluran, imej kecil dan masa yang telah berlalu, serta butang **Tonton video**. Apabila anda menjeda video, ikon jeda menggantikan ikon main. Melayari halaman utama atau carian YouTube tidak memaparkan apa-apa secara lalai: kebanyakan presence hanya berkongsi kandungan yang benar-benar anda tonton atau dengar, manakala perkongsian aktiviti melayari ialah pilihan yang boleh anda hidupkan bagi setiap presence.

## Langkah seterusnya

- Tambah platform yang benar-benar anda gunakan daripada [pustaka](/library): Netflix, Twitch, Crunchyroll, Spotify dan lebih 40 platform lain.
- Ketahui cara menjeda, menyembunyikan tab atau berkongsi hanya pada waktu tertentu dalam [Pilih dengan tepat apa yang Discord paparkan tentang anda](/guides/control-what-discord-shows).
- Ingin tahu apa yang berlaku di sebalik tabir? Baca [Apakah Discord Rich Presence?](/guides/what-is-discord-rich-presence)
