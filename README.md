# Papan Status Tugas Tim

Papan visual terpusat untuk melihat status semua tugas tim dalam satu layar,
dikelompokkan per penanggung jawab (PIC). Dibuat untuk tim kecil (5-10 orang)
yang selama ini mengandalkan grup WhatsApp untuk koordinasi kerja.

## Fitur

- Tambah tugas (nama tugas, penanggung jawab, status awal).
- Ubah status bebas antara **Belum Mulai / Dikerjakan / Selesai**, tanpa login.
- Tampilan dikelompokkan per penanggung jawab.
- Tanggal terakhir diupdate ditampilkan di tiap tugas.
- Tugas yang tidak diupdate lebih dari **3 hari** ditandai merah dengan ikon ⚠️
  ("mangkrak"). Angka ini bisa diubah di `lib/constants.ts`
  (`STALE_DAYS_THRESHOLD`).
- Data tersimpan di database bersama (Vercel Postgres), bukan localStorage —
  semua anggota tim melihat data yang sama dari perangkat masing-masing.
- Tampilan mobile-first, nyaman dipakai dari HP.

## Teknologi

- Next.js (App Router) + TypeScript + Tailwind CSS
- Vercel Postgres (`@vercel/postgres`) sebagai database
- Tabel database dibuat otomatis saat request pertama — tidak perlu langkah
  migrasi manual.

## Menjalankan di Lokal (opsional, untuk pengembangan)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Siapkan database. Cara termudah: buat Vercel Postgres store lewat dashboard
   Vercel (lihat langkah deploy di bawah), lalu di tab **Storage** pilih
   **.env.local** dan salin isinya ke file `.env.local` di root proyek ini
   (gunakan `.env.example` sebagai referensi nama variabel).

3. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

4. Buka [http://localhost:3000](http://localhost:3000).

## Langkah Deploy ke Vercel

1. **Push repo ini ke GitHub** (jika belum), lalu buka
   [vercel.com/new](https://vercel.com/new) dan import repo tersebut.
2. Saat konfigurasi project, Anda bisa langsung klik **Deploy** — belum
   perlu isi environment variable apa pun di langkah ini.
3. Setelah deploy pertama selesai (kemungkinan akan error karena database
   belum ada, tidak apa-apa), buka project Anda di dashboard Vercel:
   - Masuk ke tab **Storage** → **Create Database** → pilih **Postgres**
     (Neon).
   - Pilih region yang paling dekat (misal Singapura), lalu buat database.
   - Setelah dibuat, klik **Connect Project** dan hubungkan ke project
     dashboard tugas ini. Vercel akan otomatis mengisi environment variable
     `POSTGRES_URL` dkk ke project Anda.
4. Kembali ke tab **Deployments**, buka deployment terakhir, lalu klik
   **Redeploy** (agar env variable baru terpakai).
5. Selesai. Buka URL project Anda (contoh: `nama-project.vercel.app`) — tabel
   tugas akan otomatis dibuat saat halaman pertama kali diakses.
6. Bagikan link tersebut ke grup tim Anda. Tidak perlu login atau instalasi
   apa pun — tinggal buka link dari HP masing-masing.

### Catatan

- Aplikasi ini sengaja **tanpa login/autentikasi** — siapa pun yang punya
  link bisa menambah tugas dan mengubah status.
- Tidak ada notifikasi otomatis, riwayat perubahan, komentar, atau lampiran
  file — sesuai spesifikasi awal, agar aplikasi tetap sederhana dan cepat
  dipakai.
