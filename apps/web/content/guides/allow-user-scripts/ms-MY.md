---
title: Mengapa Nowly meminta kebenaran menjalankan skrip pengguna dan cara membenarkannya
description: Maksud kebenaran skrip pengguna, sebab presence memerlukannya, cara menghidupkannya dalam Chrome, Edge, Brave, Opera dan Firefox, serta batas kebenaran tersebut.
category: start
order: 2
updated: 2026-10-09
related: set-up-nowly, what-nowly-can-see, rich-presence-not-showing
---

Semasa penyediaan, Nowly meminta satu kebenaran yang jarang diminta oleh sambungan lain: kebenaran menjalankan skrip pengguna. Istilah ini kedengaran teknikal, dan amaran pelayar mungkin agak membimbangkan. Panduan ini menerangkan skop sebenar kebenaran tersebut, mengapa Nowly menggunakannya dan cara menghidupkannya dalam setiap pelayar yang disokong.

## Apakah skrip pengguna?

Skrip pengguna ialah cebisan kecil JavaScript yang berjalan pada halaman web yang anda buka, bersama kod halaman itu sendiri. Pelayar sudah lama menyokongnya melalui alat tambah seperti Tampermonkey.

Sejak Manifest V3, format semasa bagi sambungan Chrome, Chrome membezakan kedua-duanya dengan jelas. Kod yang disertakan dalam pakej sambungan di gedung disemak bersama sambungan itu. Kod yang ditambah kemudian oleh sambungan selepas pemasangan dianggap skrip pengguna, dan pelayar hanya menjalankannya setelah anda membenarkannya secara nyata. Firefox menggunakan prinsip yang sama melalui gesaan kebenarannya sendiri.

## Mengapa presence menggunakan skrip pengguna

Setiap presence Nowly ialah kod yang memahami cara sesuatu laman web berfungsi: tempat YouTube meletakkan tajuk video, cara Netflix menyediakan nombor episod, dan bila Spotify sedang memainkan atau menjeda muzik. Terdapat lebih 40 presence, dan susun atur laman web kerap berubah.

Jika setiap presence disertakan terus dalam sambungan, setiap pembaikan memerlukan versi sambungan baharu serta semakan gedung baharu; anda juga perlu membawa kod untuk berpuluh-puluh laman yang tidak pernah anda lawati. Sebaliknya, sambungan kekal kecil dan presence dipasang secara berasingan daripada [pustaka](/library):

- Anda hanya memasang presence untuk platform yang anda gunakan.
- Presence yang rosak boleh dibaiki dan diterbitkan semula dalam beberapa jam tanpa mengemas kini sambungan.
- Presence hanya berjalan pada alamat yang disenaraikan untuknya. Contohnya, presence YouTube berjalan pada `www.youtube.com` dan `m.youtube.com`, bukan di tempat lain.

## Cara Nowly memastikan presence selamat

Pelayar meminta kebenaran terlebih dahulu kerana kod yang dimuat turun perlu dikendalikan dengan berhati-hati. Nowly menambah semakannya sendiri:

- Setiap presence rasmi ditandatangani oleh pasukan Nowly dengan kunci ECDSA P-256. Sebelum mendaftarkan skrip, sambungan mengesahkan tandatangan serta cincangan SHA-256 bagi himpunan kod dan metadatanya. Skrip yang diubah suai selepas ditandatangani akan ditolak.
- Kod sumber setiap presence terbuka kepada umum, jadi sesiapa pun boleh membaca fungsinya sebelum memasangnya.
- Presence menyerahkan maklumat yang ditemuinya kepada sambungan, yang menyampaikannya kepada aplikasi desktop pada komputer anda, kemudian kepada Discord. Tiada bahagian laluan itu melalui pelayan Nowly, dan kod presence disemak sebelum ditandatangani.
- Pakej tanpa tandatangan hanya diterima oleh binaan pembangunan yang dimuatkan secara manual, tidak sekali-kali oleh versi gedung.

## Hidupkan dalam Chrome, Edge, Brave dan Opera

1. Buka halaman sambungan: `chrome://extensions` dalam Chrome, `edge://extensions` dalam Edge, `brave://extensions` dalam Brave atau `opera://extensions` dalam Opera.
2. Cari **Nowly** dan klik **Butiran**.
3. Hidupkan **Benarkan skrip pengguna**.
4. Muat semula tab laman web yang ingin anda paparkan di Discord.

Pada versi Chrome dan pelayar Chromium yang lebih lama, suis **Benarkan skrip pengguna** belum ada. Skrip pengguna ketika itu dihidupkan melalui suis **Mod pembangun** di penjuru kanan atas halaman sambungan. Menghidupkannya tidak mengubah cara versi gedung Nowly dikemas kini atau disahkan.

## Hidupkan dalam Firefox

Firefox meminta kebenaran sekali sahaja semasa pengenalan awal Nowly. Terima gesaan tersebut dan selesai.

Jika anda menutup gesaan itu, buka `about:addons`, pilih **Nowly**, buka tab **Kebenaran** dan benarkan skrip pengguna. Kemudian muat semula tab yang ingin anda paparkan.

## Semak sama ada ia berfungsi

Buka panel sisi Nowly dengan **Ctrl+Shift+Y** (**Cmd+Shift+Y** pada Mac). Dalam diagnostik, baris **Skrip pengguna dibenarkan** sepatutnya hijau. Sebaik sahaja ia hijau, Nowly mendaftarkan presence yang anda pasang; baris seterusnya yang perlu diperhatikan ialah **Aktiviti dikesan** pada halaman yang disokong.

Jika baris itu masih merah selepas anda menghidupkan kebenaran:

- Muat semula sambungan daripada halaman sambungan atau mulakan semula pelayar.
- Pastikan anda mengubah tetapan untuk Nowly, bukan untuk sambungan lain.
- Jika pelayar anda diurus oleh sekolah atau syarikat, dasar mereka mungkin menyekat skrip pengguna bagi semua sambungan.

## Perkara yang tidak dibenarkan oleh kebenaran ini

Membenarkan skrip pengguna tidak memberi Nowly akses kepada kata laluan, sambungan lain atau fail anda. Kebenaran ini membolehkan sambungan mendaftarkan skrip untuk laman web tertentu, dan pelayar tetap menguatkuasakan senarai alamat setiap skrip. Nowly tidak menggunakannya untuk membaca halaman yang tidak disokong oleh mana-mana presence yang dipasang.

Anda boleh mematikan kebenaran itu pada bila-bila masa. Presence akan berhenti berjalan dan Discord berhenti memaparkan aktiviti anda, tetapi tiada apa-apa dipadam: hidupkannya semula dan semuanya akan berjalan seperti sebelumnya.

## Ringkasnya

Skrip pengguna membolehkan Nowly menyokong berpuluh-puluh laman web melalui sambungan kecil, mengemas kini presence dengan cepat dan memasang hanya yang anda perlukan. Kebenaran ini diperlukan sekali bagi setiap pelayar, dan setiap presence yang menggunakannya ditandatangani, terbuka kepada umum serta terhad kepada laman webnya sendiri.
