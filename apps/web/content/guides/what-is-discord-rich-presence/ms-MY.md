---
title: Apakah Discord Rich Presence? Cara ia berfungsi dan apa yang boleh dipaparkan
description: Penjelasan tentang kad di bawah nama Discord anda, daripada jenis dan medan aktiviti hingga sambungan setempat yang digunakan program untuk mengemas kininya serta sebab laman web memerlukan aplikasi pembantu.
category: discord
order: 1
updated: 2026-10-09
related: discord-connections-vs-nowly, set-up-nowly, what-nowly-can-see
---

Jika anda pernah melihat profil Discord rakan memaparkan **Bermain** sesuatu permainan bersama gambar, pemasa dan butang **Sertai**, anda sudah melihat Rich Presence. Ciri ini membolehkan program menerangkan secara terperinci apa yang anda lakukan, bukan sekadar memaparkan nama. Panduan ini menerangkan kandungan Rich Presence, cara program menghantarnya kepada Discord dan sebab memaparkan aktiviti laman web memerlukan alat seperti Nowly.

## Daripada nama permainan kepada aktiviti terperinci

Pada mulanya, Discord mengesan permainan yang sedang anda jalankan lalu meletakkan namanya di bawah nama anda. Rich Presence, yang diperkenalkan untuk pembangun permainan, pergi lebih jauh: program itu sendiri memberitahu Discord apa yang sedang berlaku, misalnya peta, markah atau bilangan pemain dalam kumpulan anda, dan mengemas kini maklumat itu apabila keadaan berubah.

Mekanisme yang sama berfungsi untuk perkara lain, bukan permainan sahaja. Pemain muzik, editor kod dan alat penstriman menggunakannya; Nowly pula menggunakannya untuk laman web.

## Kandungan kad Rich Presence

Rich Presence terdiri daripada beberapa medan. Tidak semua program mengisi kesemuanya.

| Medan | Apa yang dipaparkan | Contoh dengan YouTube |
| --- | --- | --- |
| Jenis aktiviti | Kata kerja di hadapan nama | Menonton |
| Nama | Aplikasi | YouTube |
| Butiran | Baris pertama | Tajuk video |
| Keadaan | Baris kedua | Nama saluran |
| Imej besar | Gambar utama, bersama tip alat | Imej kecil video |
| Imej kecil | Lencana pada penjuru gambar | Ikon main atau jeda |
| Cap masa | Masa berlalu atau bar kemajuan dengan masa mula dan tamat | 14:10 daripada 26:48 |
| Butang | Sehingga dua pautan yang boleh dibuka oleh orang lain | Tonton video |

Jenis aktiviti ialah **Bermain**, **Mendengar**, **Menonton** atau **Bertanding**. Itulah sebabnya presence muzik memaparkan **Mendengar Spotify** dan presence video memaparkan **Menonton Netflix**.

## Cara program berkomunikasi dengan Discord

Rich Presence tidak melalui internet terlebih dahulu. Aplikasi desktop Discord membuka saluran setempat pada komputer anda apabila dimulakan: paip bernama `discord-ipc-0` pada Windows, dan fail soket dengan nama yang sama pada macOS serta Linux. Program yang ingin menetapkan aktiviti anda:

1. menyambung kepada saluran itu,
2. memperkenalkan dirinya dengan ID aplikasi yang didaftarkan pada Discord, yang memberikan nama dan imej kepada aktiviti itu,
3. menghantar medan aktiviti,
4. menghantar kemas kini apabila sesuatu berubah, atau mengosongkan aktiviti apabila anda berhenti.

Aplikasi Discord kemudian menerbitkan aktiviti itu pada profil anda melalui pelayan Discord, supaya rakan anda dapat melihatnya pada mana-mana peranti.

Oleh sebab saluran itu setempat, hanya program yang berjalan pada komputer sama dengan aplikasi desktop Discord boleh menggunakannya. Discord dalam tab pelayar atau pada telefon tidak membuka saluran ini.

## Mengapa laman web memerlukan aplikasi pembantu

Laman web tidak boleh membuka saluran setempat itu. Pelayar sengaja menghalang halaman web daripada mencapai sistem anda, dan sambungan juga berjalan dalam persekitaran terkurung. Jadi walaupun pelayar tahu video yang sedang anda mainkan, ia tidak dapat memberitahu Discord secara langsung.

Nowly mengisi jurang tersebut:

- sebuah **presence** membaca halaman dalam pelayar anda dan menyediakan aktiviti,
- **sambungan pelayar** mengumpulkannya dan menggunakan tetapan anda,
- **aplikasi desktop** ialah program pada komputer anda yang membuka saluran setempat Discord lalu menghantar aktiviti.

Aplikasi desktop itu kecil, tiada tetingkap dan dimulakan oleh pelayar apabila diperlukan. Tanpanya, sambungan pelayar sahaja tidak boleh mengemas kini Rich Presence.

## Siapa yang boleh melihat Rich Presence anda

Aktiviti anda dipaparkan pada profil dan dalam senarai ahli kepada orang yang boleh melihat status anda: rakan dan ahli pelayan yang anda sertai bersama, melainkan anda mematikan perkongsian aktiviti dalam tetapan **Privasi Aktiviti** Discord atau bagi pelayan tertentu. Apabila status anda **Tidak Kelihatan**, tiada siapa dapat melihatnya.

Butang ditujukan kepada orang lain: ia membolehkan rakan anda membuka video atau episod yang sama.

## Batasan yang wajar diketahui

- **Satu aktiviti bagi setiap aplikasi pada satu-satu masa.** Apabila beberapa program mengemas kini aktiviti anda, Discord mungkin memaparkan satu, beberapa atau bertukar-tukar antaranya. Elakkan menjalankan dua alat yang memaparkan perkara sama.
- **Kadar kemas kini dihadkan.** Discord hanya menerima bilangan kemas kini yang terhad dalam tempoh singkat, jadi status mungkin tertinggal beberapa saat berbanding halaman. Cap masa membolehkan Discord mengira masa sendiri tanpa menerima kemas kini berterusan.
- **Imej mesti boleh dicapai oleh Discord.** Discord, bukan komputer anda, memuat turun gambar; imej peribadi atau terlindung memerlukan proksi. Lihat [Apa yang boleh dilihat oleh Nowly](/guides/what-nowly-can-see) untuk mengetahui cara Nowly mengendalikannya.

## Rich Presence dan sambungan terbina dalam Discord

Discord juga memaparkan sesetengah aktiviti tanpa program tambahan apabila anda memautkan akaun dalam **Sambungan**, seperti Spotify. Penyepaduan itu berfungsi dengan cara berbeza dan mempunyai kelebihan serta kekurangannya sendiri. Perbandingannya ada dalam [Sambungan Discord atau Nowly](/guides/discord-connections-vs-nowly).
