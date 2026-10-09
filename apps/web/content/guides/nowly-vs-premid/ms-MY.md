---
title: "Nowly berbanding PreMiD: perbandingan yang jujur"
description: Kedua-duanya memaparkan aktiviti laman web di Discord. Bandingkan penyediaan, katalog, privasi, keselamatan dan lesen, serta pilih yang sesuai untuk platform anda.
category: discord
order: 3
updated: 2026-10-09
related: discord-connections-vs-nowly, what-nowly-can-see, set-up-nowly
---

Jika anda mencari cara memaparkan apa yang ditonton dalam pelayar di Discord, anda akan segera menemui dua nama: PreMiD, projek komuniti yang sudah lama wujud, dan Nowly, alternatif yang lebih baharu. Kedua-duanya menyelesaikan masalah yang sama dengan reka bentuk asas yang serupa, jadi pilihan yang tepat bergantung pada butirannya. Perbandingan ini cuba berlaku adil, termasuk mengakui kelebihan PreMiD.

Kedua-dua projek berubah dengan pantas. Fakta di bawah menggambarkan keadaan semasa panduan ini ditulis; semak laman web setiap projek untuk maklumat terkini.

## Persamaan kedua-duanya

- **Seni bina yang sama.** Sambungan pelayar membaca halaman, dan aplikasi kecil pada komputer anda menyampaikan aktiviti kepada aplikasi desktop Discord melalui sambungan setempatnya. Kedua-duanya tidak berfungsi dengan Discord dalam tab pelayar atau pada telefon.
- **Penyepaduan mengikut laman web.** Kedua-duanya memanggilnya presence: satu skrip bagi setiap platform, ditulis oleh komuniti, yang tahu apa yang perlu dibaca pada laman tersebut.
- **Percuma untuk digunakan.** Kedua-duanya tidak mengenakan bayaran untuk sambungan, aplikasi desktop atau presence.

## Kelebihan PreMiD

- **Saiz katalog.** PreMiD sudah wujud bertahun-tahun dan komunitinya telah menulis presence untuk ratusan laman web, termasuk banyak laman khusus. Pustaka Nowly kini mempunyai lebih 40 platform, dengan tumpuan pada yang paling kerap digunakan.
- **Kematangan dan komuniti.** Penggunaan selama bertahun-tahun bermakna banyak kes luar biasa telah ditemukan dan dibaiki, dengan komuniti penulis presence yang besar.

Jika platform yang penting bagi anda hanya ada dalam gedung PreMiD, PreMiD sememangnya pilihan lebih baik untuk anda.

## Tumpuan Nowly

- **Presence bertandatangan.** Setiap presence rasmi Nowly ditandatangani oleh pasukan dengan kunci ECDSA P-256; sambungan memeriksa tandatangan dan cincangan sebelum menjalankannya. Skrip yang diubah suai akan ditolak.
- **Privasi secara lalai.** Aktiviti melayari dimatikan secara lalai pada kebanyakan presence, beberapa presence mempunyai mod privasi, perbualan sementara ChatGPT kekal tersembunyi, dan statistik penggunaan dimatikan melainkan anda menghidupkannya. Lihat [Apa yang boleh dilihat oleh Nowly](/guides/what-nowly-can-see).
- **Kawalan dalam penggunaan harian.** Pintasan jeda menyeluruh, tab tersembunyi, penangguhan presence selama beberapa jam dan jadual bagi setiap presence. Lihat [Pilih dengan tepat apa yang Discord paparkan tentang anda](/guides/control-what-discord-shows).
- **Diagnostik terbina dalam.** Panel sisi memeriksa setiap pautan dalam rantaian secara berasingan (sambungan, skrip pengguna, aplikasi desktop, Discord, presence, aktiviti), supaya anda tahu apa yang perlu dibaiki.
- **Antara muka panel sisi dan bahasa.** Sambungan berada dalam panel sisi pelayar, dan antara muka serta laman web tersedia dalam 11 bahasa.
- **Aplikasi desktop untuk Windows, macOS dan Linux**, dengan pakej `.deb` dan arkib untuk edaran lain.
- **Penyegerakan akaun pilihan.** Log masuk dengan Discord hanya jika anda mahu presence dan tetapan anda tersedia dalam beberapa pelayar.

## Pelesenan

Kod PreMiD ialah sumber terbuka. Presence Nowly ialah sumber terbuka di bawah lesen MIT, dan SDK serta CLI-nya didokumenkan untuk penyumbang. Kod utama Nowly tersedia kepada umum di GitHub di bawah Business Source License 1.1, iaitu lesen sumber tersedia: anda boleh membaca dan mengauditnya, tetapi ia bukan lesen sumber terbuka yang diluluskan oleh OSI. Perbezaan itu penting untuk diketahui jika anda mengambil berat mengenainya.

## Yang mana patut anda pilih?

- **Platform anda hanya ada di PreMiD:** gunakan PreMiD.
- **Platform anda ada pada kedua-duanya:** cuba Nowly jika presence bertandatangan, privasi lalai dan kawalan terperinci penting bagi anda; teruskan menggunakan PreMiD jika anda berpuas hati dengannya.
- **Anda mahu menggunakan kedua-duanya untuk platform berlainan:** boleh, tetapi berhati-hati. Dua alat yang mengemas kini aktiviti Discord anda serentak boleh menggantikan atau mengosongkan status satu sama lain. Pastikan setiap platform dikendalikan oleh satu alat sahaja, dan matikan alat yang satu lagi semasa menguji.

## Beralih daripada PreMiD ke Nowly

1. Tutup aplikasi desktop PreMiD dan nyahdayakan sambungan pelayarnya supaya ia berhenti mengemas kini aktiviti anda.
2. Ikuti [Cara menyediakan Nowly](/guides/set-up-nowly): sambungan, skrip pengguna, aplikasi desktop, Discord.
3. Pasang daripada [pustaka](/library) presence yang menggantikan presence yang anda gunakan.
4. Semak diagnostik dalam panel sisi, kemudian profil Discord anda.

Jika sesuatu yang anda gunakan di PreMiD tiada dalam pustaka, mintalah melalui [halaman sokongan](/support): presence baharu ditambah secara berkala, dan sesiapa sahaja boleh menulisnya dengan [panduan pembangun](/guides/create-your-first-presence).
