---
title: Discord Rich Presence tidak muncul? Ikuti senarai semak ini
description: Status Discord anda kosong semasa anda menonton atau mendengar? Ikuti semakan mengikut turutan, daripada tetapan Discord hingga halaman yang sedang anda buka.
category: troubleshooting
order: 1
updated: 2026-10-09
related: discord-ipc-access-denied, nowly-on-linux, allow-user-scripts
---

Rich Presence melalui rantaian lima pautan: halaman yang anda buka, presence untuk laman web itu, sambungan pelayar, aplikasi desktop dan aplikasi Discord. Apabila status anda kekal kosong, salah satu pautan itu tidak berfungsi; cara terpantas membaikinya ialah mengenal pasti pautan tersebut, bukannya memasang semula segala-galanya. Ikuti semakan di bawah mengikut turutan. Kebanyakan masalah selesai dalam empat langkah pertama.

## Mulakan dengan diagnostik Nowly

Buka panel sisi Nowly (**Ctrl+Shift+Y**, atau **Cmd+Shift+Y** pada Mac) pada tab yang ingin anda kongsi. Diagnostik menunjukkan enam baris: **Sambungan dipasang**, **Skrip pengguna dibenarkan**, **Nowly Desktop dikesan**, **Discord tersambung**, **Presence dipasang** dan **Aktiviti dikesan**.

Baca dari atas ke bawah dan berhenti pada baris pertama yang tidak hijau. Setiap bahagian di bawah sepadan dengan salah satu semakan itu, ditambah beberapa keadaan yang tidak dapat dilihat oleh diagnostik melalui pelayar anda.

## 1. Anda menggunakan aplikasi desktop Discord

Rich Presence hanya berfungsi dengan aplikasi Discord yang dipasang pada komputer anda. Discord dalam tab pelayar, pada telefon atau pada komputer lain tidak akan memaparkan apa-apa, walaupun anda log masuk dengan akaun yang sama.

Jika anda menggunakan kedua-duanya, tutup versi pelayar Discord: versi itu boleh membuat anda menyangka status anda kosong sedangkan aplikasi desktop memaparkannya kepada orang lain.

## 2. Discord dibenarkan memaparkan aktiviti anda

Discord boleh menyembunyikan aktiviti anda walaupun ia menerimanya:

- Buka **Tetapan Pengguna**, kemudian **Privasi Aktiviti**, dan hidupkan pilihan untuk berkongsi aktiviti semasa anda.
- Semak status anda. **Tidak Kelihatan** menyembunyikan aktiviti daripada semua orang.
- Sesetengah pelayan membolehkan anda mematikan perkongsian aktiviti khusus untuk pelayan itu melalui tetapan privasinya. Jika rakan dalam satu pelayan tidak dapat melihatnya tetapi orang lain boleh, periksa tetapan tersebut.

Cara mudah membezakannya: jika profil anda sendiri memaparkan aktiviti tetapi rakan tidak melihatnya, masalahnya terletak pada tetapan privasi Discord, bukan Nowly.

## 3. Aplikasi desktop dipasang dan berjalan

Jika **Nowly Desktop dikesan** berwarna merah, sambungan tidak dapat mencapai aplikasi desktop.

- Pasang melalui [halaman aplikasi desktop](/desktop) jika belum berbuat demikian, kemudian klik **Semak sambungan** dalam panel sisi.
- Jika anda baru memasangnya, tutup dan buka semula panel sisi, atau mulakan semula pelayar agar ia mengesan aplikasi baharu.
- Pasang aplikasi pada komputer yang sama dengan pelayar. Ia tidak berfungsi merentasi komputer.
- Di Linux, punca paling biasa ialah pakej `.deb` yang sebenarnya tidak pernah dipasang atau pelayar yang dipasang melalui Flatpak atau Snap. Lihat [Nowly di Linux](/guides/nowly-on-linux).

## 4. Discord tersambung

Jika **Nowly Desktop dikesan** hijau tetapi **Discord tersambung** merah, aplikasi desktop tidak dapat berkomunikasi dengan Discord.

- Mulakan aplikasi desktop Discord dan tunggu sehingga ia dimuatkan sepenuhnya, kemudian klik **Semak sambungan**.
- Di Windows, punca paling biasa ialah Discord berjalan sebagai pentadbir. Pembaikannya mengambil masa seminit: [Baiki ralat "Access is denied" pada discord-ipc-0](/guides/discord-ipc-access-denied).
- Jika anda menjalankan Discord PTB atau Canary bersama Discord biasa, tutup semuanya kecuali satu.

## 5. Skrip pengguna dibenarkan

Jika **Skrip pengguna dibenarkan** merah, pelayar menyekat presence. Hidupkan **Benarkan skrip pengguna** pada halaman butiran Nowly (atau **Mod pembangun** pada versi Chrome yang lebih lama), kemudian muat semula tab. Langkah penuh untuk setiap pelayar ada dalam [Mengapa Nowly meminta kebenaran menjalankan skrip pengguna](/guides/allow-user-scripts).

## 6. Presence yang betul dipasang dan dihidupkan

Setiap laman web memerlukan presence sendiri. Jika **Presence dipasang** hijau tetapi tiada apa berlaku pada satu laman, buka halaman laman itu dalam [pustaka](/library) dan pastikan ia menunjukkan **Dipasang**. Kemudian, dalam panel sisi:

- Pastikan presence dihidupkan.
- Pastikan perkongsian tidak dijeda. Apabila dijeda, panel sisi memaparkan **Perkongsian dijeda**. Sambung semula dengan butang jeda atau **Ctrl+Shift+U**.
- Pastikan presence tidak ditangguhkan dan anda tidak berada **Di luar jadual anda** jika anda menetapkan waktu perkongsian.
- Pastikan tab itu sendiri tidak disembunyikan dengan **Sembunyikan tab ini**.

## 7. Halaman itu disokong oleh presence

**Aktiviti dikesan** kekal merah apabila presence tidak menemui apa-apa untuk dipaparkan pada halaman semasa. Dua sebab ini menjelaskan hampir semua keadaan:

- **Anda sedang melayari, bukan menonton.** Kebanyakan presence hanya berkongsi kandungan yang benar-benar anda mainkan: video, episod, lagu atau siaran langsung. Pada kebanyakannya, halaman utama, carian dan katalog tidak memaparkan apa-apa melainkan anda menghidupkan **Tunjukkan aktiviti melayari** dalam tetapan presence itu. Halaman pustaka setiap presence menerangkan apa yang dipaparkan secara lalai.
- **Alamat tidak disokong.** Setiap presence menyenaraikan alamat tempat ia berjalan di bawah **Laman yang disokong** pada halaman pustakanya. Contohnya, Prime Video berjalan pada `primevideo.com`. Jika laman berpindah ke alamat baharu atau mengubah susun atur, gunakan **Laporkan masalah** pada halaman presence.

Selepas memasang presence atau mengubah tetapan, muat semula tab sekali. Halaman yang telah dibuka sebelum presence dipasang belum mempunyai presence itu.

## 8. Alat Rich Presence lain tidak mengganggu

Alat lain yang menetapkan aktiviti Discord anda, seperti PreMiD atau pemain muzik dengan Rich Presence sendiri, boleh menggantikan atau mengosongkan maklumat yang dihantar oleh Nowly. Matikan alat tersebut semasa menguji. Permainan yang sedang anda mainkan juga boleh mengambil alih aktiviti yang ditunjukkan pada profil.

## 9. Masih tiada apa-apa?

- Muat semula tab, kemudian mulakan semula pelayar dan Discord. Walaupun kedengaran mudah, langkah ini membina semula setiap sambungan dalam rantaian.
- Kemas kini sambungan, aplikasi desktop dan Discord.
- Buka log masa jalan sambungan dan klik **Salin log** untuk menampalnya dalam tiket. Log boleh mengandungi alamat halaman disokong yang anda lawati, jadi baca dahulu sebelum berkongsi.
- Buka tiket di pelayan Discord Nowly, atau laporkan presence melalui halaman pustakanya jika hanya satu laman web terjejas.

## Rantaian ini dalam satu ayat

Halaman mesti disokong, presence mesti dipasang dan berjalan, skrip pengguna mesti dibenarkan, aplikasi desktop mesti dapat dicapai, serta Discord mesti terbuka dan dibenarkan memaparkan aktiviti anda. Cari pautan pertama yang gagal, baikinya, dan selebihnya biasanya akan berfungsi.
