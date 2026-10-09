---
title: Apa yang boleh dilihat oleh Nowly dan ke mana data anda pergi
description: Laluan aktiviti anda dari halaman web ke Discord, apa yang dibaca oleh presence, apa yang kekal pada komputer anda dan beberapa perkara pilihan yang sampai kepada Nowly.
category: privacy
order: 2
updated: 2026-10-09
related: control-what-discord-shows, allow-user-scripts, what-is-discord-rich-presence
---

Alat yang mengetahui apa yang anda tonton patut memberi jawapan jelas kepada satu soalan mudah: ke mana maklumat itu pergi? Panduan ini mengikuti aktiviti anda langkah demi langkah, menyenaraikan apa yang kekal pada peranti anda dan berterus terang tentang beberapa ciri pilihan yang berhubung dengan pelayan Nowly. Ia melengkapi [dasar privasi](/privacy) dengan bahasa mudah; dasar tersebut tetap menjadi rujukan utama.

## Secara ringkas

Aktiviti anda bergerak daripada halaman web ke aplikasi Discord pada komputer anda sendiri, tanpa melalui tempat lain. Ia tidak pernah melalui nowly.me atau API Nowly. Statistik penggunaan dimatikan melainkan anda menghidupkannya, dan akaun adalah pilihan.

## Laluan aktiviti anda

Inilah yang berlaku apabila anda memainkan kandungan pada laman web yang disokong:

1. **Presence membaca halaman.** Presence untuk laman itu berjalan dalam tab pelayar anda dan membaca apa yang diperlukan: tajuk, nombor episod, nama saluran atau sama ada video sedang dimainkan.
2. **Sambungan menyediakan aktiviti.** Ia menggunakan tetapan anda (jeda, jadual, mod privasi, bahasa) dan membina Rich Presence.
3. **Aplikasi desktop menerimanya.** Sambungan menghantarnya kepada aplikasi desktop Nowly melalui pemesejan natif, iaitu saluran antara pelayar dan program pada komputer sama.
4. **Discord menerimanya secara setempat.** Aplikasi desktop menyampaikannya kepada aplikasi Discord melalui sambungan setempat Discord.
5. **Discord berkongsi aktiviti itu.** Selepas itu, aplikasi Discord menghantarnya ke pelayan Discord supaya rakan anda dapat melihatnya, tertakluk pada dasar privasi Discord sendiri.

Langkah 1 hingga 4 semuanya berlaku pada komputer anda. Pelayan Nowly tidak terlibat dalam laluan tersebut.

## Apa yang dibaca oleh presence

Presence hanya membaca halaman yang khusus untuknya, dan hanya maklumat yang diperlukan untuk status anda. Presence YouTube membaca tajuk video, saluran, alamat imej kecil dan kedudukan main balik. Presence Spotify membaca lagu yang dimainkan oleh pelayar anda. Presence tidak membaca tab lain, sejarah pelayaran, medan borang atau kata laluan anda.

Sesetengah laman web hanya menyediakan butiran melalui data mereka sendiri. Contohnya, presence Netflix meminta laman Netflix sendiri memberikan tajuk dan episod kandungan yang sedang dimainkan, dari dalam tab Netflix, sama seperti yang dilakukan oleh halaman Netflix.

## Imej dan proksi imej

Discord perlu memuat turun gambar yang ditunjukkan dalam status anda. Imej kebanyakan platform terbuka kepada umum dan dimuatkan terus oleh Discord. Sesetengahnya, seperti poster Netflix, tidak dapat dimuatkan oleh Discord dalam bentuk asal. Dalam keadaan ini, presence menggunakan proksi imej Nowly: alamat imej melalui API Nowly, yang mengambilnya supaya Discord dapat memaparkannya.

Alamat itu mungkin berkaitan dengan tajuk yang anda tonton, jadi hal ini wajar diketahui. Proksi hanya digunakan untuk tujuan ini, tidak pernah untuk membina profil pengiklanan, dan lognya disimpan hanya selama yang diperlukan untuk menjalankan serta melindungi perkhidmatan.

## Apa yang kekal pada komputer anda

- Presence yang anda pasang, tetapannya dan sama ada ia dihidupkan.
- Aktiviti semasa anda: tajuk, platform, tempoh dan alamat imej.
- Log nyahpepijat dengan tindakan terkini dan alamat halaman disokong yang anda lawati, berguna apabila ada masalah.
- Log aplikasi desktop, `nowly-host.log`, dalam folder cache aplikasi.
- Salinan setempat nama dan avatar Discord anda, diambil daripada aplikasi Discord untuk dipaparkan dalam sambungan.

Semuanya dipadam apabila anda menetapkan semula atau menyahpasang sambungan, dan anda boleh memadam log aplikasi desktop pada bila-bila masa.

## Kebenaran, dalam bahasa mudah

- **Akses kepada laman web**: skrip ringan memeriksa sama ada halaman yang anda buka milik platform yang disokong supaya panel sisi boleh mencadangkan presence yang sesuai. Ia tidak menghantar sejarah pelayaran anda ke mana-mana.
- **Skrip pengguna**: membolehkan presence yang dipasang berjalan pada laman web masing-masing. Lihat [Mengapa Nowly meminta kebenaran menjalankan skrip pengguna](/guides/allow-user-scripts).
- **Pemesejan natif**: membolehkan sambungan berkomunikasi dengan aplikasi desktop pada komputer anda.
- **Storan**: menyimpan tetapan dan presence anda dalam pelayar.

## Apa yang boleh sampai kepada Nowly, hanya jika anda memilihnya

- **Statistik penggunaan** dimatikan secara lalai. Jika dihidupkan, API Nowly menerima pengecam peranti rawak, pelayar, sistem, bahasa dan versi anda, serta peristiwa seperti pemasangan. Tidak sekali-kali halaman, tajuk, carian atau identiti Discord anda.
- **Akaun** adalah pilihan. Jika anda log masuk dengan Discord, tetapan dan senarai presence yang dipasang disegerakkan antara pelayar anda. Aktiviti semasa, tab dan sejarah anda tidak pernah disegerakkan.
- **Tanda suka dan laporan** yang anda hantar daripada halaman presence sampai kepada API Nowly, bersama kandungan laporan yang anda tulis.
- **Memuat turun presence** daripada pustaka menghubungi pelayan dan CDN Nowly, seperti muat turun yang lain.

## Data anda, di bawah kawalan anda

- Halaman [Data anda](/consent) membolehkan anda menghidupkan atau mematikan statistik, serta mengeksport atau memadam semua yang disimpan untuk peranti anda.
- [Halaman akaun](/account) membolehkan anda memuat turun data akaun atau memadam akaun.
- Menyahpasang sambungan memadam semua yang disimpannya secara setempat.

## Apa yang Discord lakukan dengan aktiviti itu

Sebaik sahaja aktiviti anda sampai kepada Discord, Discord memaparkannya kepada orang yang dibenarkan melihat profil anda dan memprosesnya menurut dasar privasinya sendiri. Nowly tidak dapat mengubah bahagian itu, tetapi anda boleh memilih apa yang dihantar sejak awal: lihat [Pilih dengan tepat apa yang Discord paparkan tentang anda](/guides/control-what-discord-shows).
