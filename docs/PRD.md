# Project Requirements Document (PRD)

## 1. Gambaran Proyek

### 1.1 Tujuan
INTEL menjawab satu pertanyaan untuk siapa saja yang tinggal di pesisir utara Jawa: **tahun berapa tanah di sini berada di bawah Pasang Tertinggi?** Jawabannya dihitung dari Laju Penurunan yang diukur satelit radar, Tinggi Tanah, dan Kenaikan Muka Laut, lalu ditampilkan di peta yang bisa digeser per tahun.

### 1.2 Latar Belakang
Tanah di Demak dan Semarang turun sampai 10–20 cm per tahun karena pengambilan air tanah, beban bangunan, dan tanah lunak. Desa Bedono di Demak sudah hilang karena Rob. Prediksi "kapan tenggelam" selama ini hanya ada di paper, berita, dan paparan pejabat. Belum ada alat publik untuk mengecek satu lokasi tertentu dengan data penurunan tanah yang terukur.

Proyek pribadi, open source, biaya Rp0.

### 1.3 Ruang Lingkup
**Termasuk (v1)**
- Wilayah Cakupan: Demak dan Semarang (lihat ADR-0004).
- Peta interaktif dengan slider tahun 2015–2050 (Masa Terukur lalu Masa Perkiraan), tombol Play, Garis Pantai per tahun, geser-bandingkan dua tahun.
- Klik satu titik untuk melihat Tinggi Tanah, Laju Penurunan, dan Rentang Tahun.
- Dua Skenario: Lanjut dan Henti.
- Info Pasang Tertinggi minggu ini dari data pasang.
- Halaman Peliput: peringkat Kelurahan dan unduhan data.
- URL yang menyimpan lokasi, tahun, dan Skenario, sehingga tampilan bisa dibagikan sebagai link.
- Pembaruan data berkala (jadwal di `DATA.md` §4).

**Tidak termasuk (untuk sekarang)**
- Jakarta Utara (v1.1), seluruh Pantura (v2).
- Lapisan area yang benar-benar terendam per tahun dari citra air satelit (v1.1).
- Membandingkan dua Rilis Data langsung di peta. Untuk sekarang cukup lewat unduhan di halaman Peliput.
- Model ML untuk mengisi celah data penurunan tanah (v2).
- Data NISAR (v2).
- Akun, login, notifikasi, laporan warga, atau apa pun yang menyimpan data Pengunjung.
- Pemodelan aliran air, efek Tanggul, pompa, atau banjir karena hujan.
- Tombol bagikan khusus (cukup link).
- Bahasa selain Indonesia.

## 2. Pemangku Kepentingan
- **Pemilik**: membangun proyek dan menjalankan pembaruan data.
- **Pengunjung**: warga yang mengecek lokasinya, biasanya dari ponsel.
- **Peliput**: jurnalis, peneliti, pemda yang butuh peringkat dan data mentah.

## 3. Tujuan
1. Pengunjung menemukan Rentang Tahun lokasinya dalam waktu di bawah 30 detik sejak membuka situs.
2. Setiap angka bisa ditelusuri ke sumber dan rumusnya.
3. Data tidak pernah lebih tua dari jadwal pembaruannya.
4. Biaya operasional tetap Rp0 berapa pun jumlah Pengunjung.

## 4. Kebutuhan Fungsional

### FR-0 — Halaman Pembuka
- Halaman yang digeser sebelum peta: pembuka, kenapa INTEL dibuat (tiga angka asli bersumber), cara membaca tiga tingkat, lalu tombol **Mulai lihat peta**.
- Menyebut Wilayah Cakupan saat ini ("Saat ini: Semarang & Demak").
- Dilewati kalau link berisi hash. Kunjungan berikutnya mendapat tombol "Langsung ke peta".

### FR-1 — Peta
- Peta dasar citra satelit, dibuka pada Wilayah Cakupan.
- Lapisan Area Bawah Pasang untuk tahun yang dipilih, sesuai Skenario aktif dan tingkat yang dipilih: Rob (bawaan), Terendam, Hilang ke Laut. Setiap tingkat punya satu kalimat legenda.
- Garis Pantai tahun sekarang dan tahun yang dipilih tampil bersamaan.
- Lapisan Tanggul sebagai garis informasi.

### FR-2 — Slider Tahun & Play
- Slider 2015–2050, langkah satu tahun, dibuka di tahun sekarang. Peta berubah saat slider digeser, tanpa jeda yang terasa.
- Slider terbagi dua: Masa Terukur (2015 sampai tahun Rilis Data terakhir) dan Masa Perkiraan (sesudahnya). Keduanya dibedakan dengan gaya garis dan label "terukur" / "perkiraan".
- Tombol Play menganimasikan tahun dari posisi sekarang sampai 2050, lalu berhenti.
- Kunjungan pertama dibuka dengan animasi 2015 → tahun ini ("Ini yang sudah terjadi"), bisa dilewati. Semua animasi ada di `DESIGN.md` §9.

### FR-3 — Geser Bandingkan
- Layar dibelah dua: kiri tahun A, kanan tahun B. Garis pembatas bisa digeser dengan jari atau mouse.

### FR-4 — Pencarian & Klik Titik
- Cari alamat atau nama Kelurahan, peta terbang ke sana.
- Klik atau ketuk satu titik: kartu berisi Tinggi Tanah, Laju Penurunan, Rentang Tahun untuk Tahun Rob ("mulai kena Rob sesekali"), Tahun Terendam ("terendam tiap pasang"), dan Tahun Hilang ke Laut ("air tidak pernah surut"), nama Kelurahan, dan tanggal data. Titik yang lajunya diisi dari tetangga diberi keterangan.
- Kalau Rentang Tahun lebih lebar dari batas di `DATA.md` §3.3, kartu menulis "belum bisa diperkirakan" dan alasannya.

### FR-5 — Skenario
- Pilihan: Skenario Lanjut (bawaan) dan Skenario Henti. Mengganti Skenario langsung mengubah peta dan kartu.

### FR-6 — Pasang Minggu Ini
- Banner kecil: tanggal dan jam pasang tertinggi dalam 7 hari ke depan di stasiun pasang terdekat.

### FR-7 — Halaman Peliput
- Tabel peringkat Kelurahan menurut Rentang Tahun paling awal, bisa diurutkan.
- Grafik Laju Penurunan rata-rata per kota.
- Unduhan: CSV per Kelurahan dan GeoJSON Area Bawah Pasang per tahun, dengan link ke semua Rilis Data di GitHub Releases supaya prediksi antar Rilis Data bisa dibandingkan.

### FR-8 — Link yang Bisa Dibagikan
- URL hash menyimpan lokasi, zoom, tahun, dan Skenario. Membuka link itu menampilkan keadaan yang sama.

### FR-9 — Halaman Tentang
- Asal nama (Kolam Intel ITB), cara hitung dalam bahasa awam, keterbatasan, atribusi dan lisensi setiap dataset.

## 5. Syarat Rilis v1
1. **Uji Mundur Sayung lulus**: pipeline dijalankan hanya dengan citra Sentinel-1 2015–2017, dan Area Bawah Pasang 2025 hasil prediksinya cocok dengan area yang benar-benar terendam di Kecamatan Sayung, Demak (termasuk Bedono dan Timbulsloko). Kriteria persisnya ada di `DATA.md` §5.
2. Semua lapisan menampilkan tanggal "diperbarui".
3. Halaman Tentang memuat semua atribusi.
4. Bisa dipakai penuh di ponsel 375×812.

## 6. Kebutuhan Non-Fungsional
- Halaman awal di bawah 3 MB sebelum tile peta dimuat.
- Tanpa server dan tanpa database (ADR-0001).
- Kode MIT. Docs dan tampilan Bahasa Indonesia.

## 7. Pertanyaan Terbuka
- Pengolahan InSAR muat di runner gratis GitHub Actions: diukur di Blok 2.
- Sumber batas Kelurahan, peta dasar citra, datum vertikal: dicek di Blok 1.
- Angka `HENTI_TAHUN` untuk Skenario Henti: dicari sumbernya di Blok 1.
