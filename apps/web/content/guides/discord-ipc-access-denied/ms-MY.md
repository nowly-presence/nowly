---
title: Baiki ralat "Access is denied" pada discord-ipc-0 (Windows)
description: Mengapa Windows menyekat sambungan antara Nowly dan Discord apabila Discord dijalankan sebagai pentadbir, serta lima langkah untuk membaikinya secara kekal.
category: troubleshooting
order: 2
updated: 2026-10-09
related: rich-presence-not-showing, what-is-discord-rich-presence, set-up-nowly
---

Di Windows, Nowly kadangkala menunjukkan **Nowly Desktop dikesan** berwarna hijau tetapi **Discord tersambung** berwarna merah, dan log mengandungi baris seperti berikut:

```text
open \\.\pipe\discord-ipc-0: Access is denied.
```

Nowly mungkin turut memaparkan mesej yang menjelaskan bahawa Discord menyekat sambungan, dan aplikasi desktop boleh menunjukkan pemberitahuan Windows mengenainya. Puncanya hampir selalu sama, dan bukan pepijat Nowly atau Discord: Discord berjalan dengan hak pentadbir sedangkan pelayar anda tidak.

## Apakah discord-ipc-0?

Program yang ingin menetapkan aktiviti Discord anda, termasuk permainan, berkomunikasi dengan aplikasi Discord melalui saluran setempat yang dipanggil paip bernama. Pada Windows, saluran pertama dinamakan `\\.\pipe\discord-ipc-0`. Discord menciptanya apabila dimulakan, dan aplikasi desktop Nowly membukanya untuk menghantar aktiviti anda.

Tiada apa-apa dihantar melalui internet pada langkah ini. Ini ialah komunikasi antara dua program pada komputer yang sama.

## Mengapa Windows mengatakan "Access is denied"

Windows memisahkan program yang berjalan sebagai pentadbir daripada program biasa. Program yang dimulakan dengan **Jalankan sebagai pentadbir** berjalan pada tahap integriti lebih tinggi, dan objek yang diciptanya, termasuk paip bernama Discord, dilindungi daripada program pada tahap biasa.

Pelayar anda berjalan pada tahap biasa, jadi aplikasi desktop Nowly yang dimulakannya juga berjalan pada tahap biasa. Apabila Discord dimulakan sebagai pentadbir, Windows enggan membenarkan aplikasi biasa membuka paip yang dinaikkan haknya, lalu sambungan gagal dengan ralat **Access is denied**.

Permainan dan alat Rich Presence lain menghadapi halangan yang sama; sebab itulah aduan "Discord tidak memaparkan permainan saya" dan ralat ini kerap muncul bersama.

## Cara membaikinya, langkah demi langkah

1. **Tutup Discord sepenuhnya.** Menutup tetingkap sahaja tidak mencukupi: klik kanan ikon Discord dalam kawasan pemberitahuan berhampiran jam dan pilih **Keluar daripada Discord**.
2. **Pastikan tiada proses Discord tertinggal.** Buka Pengurus Tugas dengan **Ctrl+Shift+Esc** dan tamatkan mana-mana proses `Discord.exe` yang masih berjalan.
3. **Buang tetapan pentadbir.** Klik kanan pintasan Discord yang anda gunakan, pilih **Sifat**, buka tab **Keserasian** dan kosongkan tanda **Jalankan program ini sebagai pentadbir**. Masih dalam **Sifat**, pada tab **Pintasan**, klik **Lanjutan** dan pastikan **Jalankan sebagai pentadbir** juga tidak ditandakan. Jika butang **Ubah tetapan untuk semua pengguna** menunjukkan pilihan itu ditandakan, kosongkan tandanya di situ juga.
4. **Mulakan Discord seperti biasa**, dengan klik dua kali.
5. **Sambungkan semula Nowly.** Klik **Sambung semula** dalam panel sisi Nowly, atau mulakan semula pelayar anda.

**Discord tersambung** kini sepatutnya bertukar hijau, dan aktiviti anda sepatutnya muncul dalam beberapa saat.

## Jika Discord terus bermula sebagai pentadbir

- Semak setiap pintasan yang anda gunakan: pada desktop, menu Mula dan bar tugas. Setiap satunya mempunyai tetapan sendiri.
- Jika Discord bermula bersama Windows, ia mungkin dimulakan oleh tugas berjadual atau pengurus permulaan pihak ketiga yang ditetapkan menggunakan hak tertinggi. Buang pilihan itu atau cipta semula entri tanpa pilihan tersebut.
- Sesetengah pengguna menjalankan Discord sebagai pentadbir supaya fungsi tekan-untuk-bercakap berfungsi dalam permainan yang turut berjalan sebagai pentadbir. Dalam keadaan itu, anda perlu memilih: jalankan Discord dan permainan pada tahap biasa, atau Rich Presence daripada pelayar anda tidak dapat mencapai Discord.

## Perkara yang jangan dilakukan

Jangan jalankan pelayar anda, atau paksa aplikasi desktop Nowly berjalan, sebagai pentadbir untuk mengatasi masalah ini. Pelayar memulakan aplikasi desktop sendiri melalui mekanisme yang dipanggil pemesejan natif; menjalankan pelayar dengan hak pentadbir penuh mendedahkan seluruh sistem anda jika sesuatu yang buruk berlaku pada halaman web. Penyelesaian yang betul ialah mengembalikan Discord ke tahap biasa.

## Discord PTB dan Canary

Di Windows, aplikasi desktop Nowly menyambung kepada paip Discord pertama, `discord-ipc-0`. Jika anda menjalankan Discord Stable bersama Discord PTB atau Canary pada masa yang sama, aplikasi yang dimulakan dahulu memiliki paip itu, dan aktiviti anda hanya muncul dalam aplikasi tersebut. Biarkan satu aplikasi Discord sahaja terbuka untuk mengelakkan kekeliruan.

## Masih tersekat?

Jika ralat hilang tetapi status masih kosong, masalahnya berada di pautan seterusnya dalam rantaian. Kembali ke [senarai semak penyelesaian masalah](/guides/rich-presence-not-showing) dan teruskan daripada langkah **Skrip pengguna dibenarkan**. Jika log masih menyatakan **Access is denied** selepas anda mengikuti langkah di atas, buka tiket di pelayan Discord Nowly dengan menyertakan versi Windows anda dan cara anda memulakan Discord.
