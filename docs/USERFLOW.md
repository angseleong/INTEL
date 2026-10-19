# INTEL — Alur Pengguna

## 1. Kedatangan

### 1.1 Tanpa link khusus: halaman pembuka dulu
Satu halaman yang digeser ke bawah, gaya void gelap (`DESIGN.md`):

1. **Pembuka**: "Indonesia Tenggelam? Cek datanya." + satu kalimat (tanah turun lebih cepat daripada laut naik, diukur dari satelit). Di bawahnya Konstelasi Titik (`DESIGN.md` §8).
2. **Kenapa ini dibuat**: tiga angka asli dengan sumbernya: Laju Penurunan Sayung–Genuk (InSAR), Kenaikan Muka Laut (BRIN), dan Bedono yang sudah jadi laut.
3. **Cara membaca peta**: tiga tingkat (Rob, Terendam, Hilang ke Laut), dihitung tanpa Tanggul dan pompa, tahun selalu berupa Rentang Tahun.
4. **Mulai**: "Cek lokasimu." + tombol **Mulai lihat peta** (satu-satunya tombol terisi di halaman) + keterangan "Saat ini: Semarang & Demak".
5. Ketuk Mulai → peta terbuka. Animasi pembuka 2015 → sekarang (`DESIGN.md` §9 A1) jalan sekali di sini.

Kunjungan kedua dan seterusnya: halaman pembuka tetap muncul, tapi ada tombol hantu **Langsung ke peta** di atas.

### 1.2 Dengan link yang dibagikan
Kalau link berisi hash (`#lat,lon,zoom,tahun,skenario`), halaman pembuka dilewati dan peta langsung membuka keadaan itu.

### 1.3 Di peta
Banner di atas: "Wilayah Cakupan: sementara baru Semarang & Demak". Badge "Belum tervalidasi" sampai Uji Mundur lulus.

## 2. Mengecek Lokasi Sendiri (Pengunjung)
1. Ketik alamat atau nama Kelurahan, lalu pilih dari saran. Peta terbang ke sana.
2. Ketuk titik rumah. Kartu titik muncul: Tinggi Tanah, Laju Penurunan, nama Kelurahan, dan dua Rentang Tahun:
   ```
   Mulai kena Rob sesekali: ±2029–2032   (Tahun Rob)
   Terendam tiap hari:      ±2036–2041   (Tahun Terendam)
   ```
3. Geser slider atau tekan Play. Area Bawah Pasang dan Garis Pantai bergerak per tahun. Geser ke kiri sampai 2015 untuk melihat seberapa jauh Garis Pantai sudah maju (Masa Terukur). Geser ke kanan sampai 2050 untuk perkiraan (Masa Perkiraan).
4. Ganti ke Skenario Henti. Peta dan kartu berubah, menunjukkan berapa tahun yang bisa diselamatkan.
5. Salin link dari address bar. Penerima link melihat titik, tahun, dan Skenario yang sama.

## 3. Membandingkan Dua Tahun
1. Ketuk tombol Bandingkan. Layar terbelah: kiri tahun sekarang, kanan 2050. Pilihan cepat "2015 vs sekarang" untuk melihat yang sudah terjadi.
2. Ubah tahun di masing-masing sisi dengan slider kecil.
3. Geser garis pembatas dengan jari atau mouse.
4. Ketuk Bandingkan lagi untuk keluar.

## 4. Kasus Khusus

| Keadaan | Yang tampil |
|---|---|
| Titik di luar Wilayah Cakupan | Kartu: "Wilayah ini belum dihitung. Saat ini: Demak dan Semarang." |
| Titik dengan Tinggi Tanah ≥ 5 m | Kartu: "Tidak di bawah Pasang Tertinggi sebelum 2050." |
| Rentang Tahun lebih lebar dari batas | Kartu: "Belum bisa diperkirakan", plus alasannya (data penurunan atau ketinggian kurang pasti) |
| Titik tanpa data penurunan (celah InSAR, misalnya tambak atau sawah) | Kartu: "Data penurunan tanah belum tersedia di titik ini." |
| Sudah di bawah Pasang Tertinggi hari ini | Baris Tahun Rob: "Sudah kena Rob sesekali". Baris Tahun Terendam tetap tampil |
| Sudah di bawah Pasang Harian hari ini | Kedua baris: "Sudah terendam tiap hari" |

## 5. Peliput
1. Buka halaman Peliput dari menu.
2. Urutkan tabel Kelurahan menurut Rentang Tahun paling awal, Laju Penurunan, atau luas Area Bawah Pasang di 2050.
3. Ketuk nama Kelurahan, peta terbuka di Kelurahan itu.
4. Unduh CSV atau GeoJSON, atau buka arsip Rilis Data lama di GitHub Releases.

## 6. Halaman Tentang
Cara hitung dalam bahasa awam, keterbatasan (Tanggul dan pompa tidak dihitung, galat ketinggian), asal nama dari Kolam Intel ITB, atribusi dan lisensi setiap dataset.
