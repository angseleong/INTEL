# INTEL — Alur Pengguna

## 1. Kedatangan

### 1.1 Tanpa link khusus: halaman pembuka dulu
Satu halaman scrollytelling: tiap kali digeser, layar berganti satu ide. Suasananya malam di laut, makin digeser makin gelap (`DESIGN.md` Overview dan Gerak B1). Urutannya:

1. **Hero**: laut malam yang bisa disentuh (ketuk = riak), wordmark **INTEL** besar berdiri di atas air dan memantul, tagline berupa pertanyaan "Indonesia Tenggelam? Cek datanya."
2. **Air naik**: makin digeser, air naik sampai menutup judul, lalu layar menggelap (`DESIGN.md` Gerak B1). Air menutup layar, bukan pulau di peta, supaya tidak terbaca sebagai klaim "Indonesia tenggelam".
3. **Masalahnya**: tanah pesisir turun pelan, beberapa cm per tahun, tidak terasa sampai rob datang tiap bulan. Peta Indonesia menyalakan kota-kota pesisir yang turun (Jakarta, Pekalongan, Semarang, Demak, Medan, dll.) dan jumlah orang di kawasan berisiko. Angka dan sumber di `DATA.md` §6.
4. **Cek tempatmu**: chip kota. Yang sudah dihitung (Semarang, Demak) menyala. Yang belum tetap tampil dengan label "belum tercakup". Di sini dijelaskan bahwa INTEL sementara baru menghitung Semarang & Demak.
5. **Cerita kota**: ketuk chip, lalu muncul cerita kota itu (±3 layar): apa yang sudah terjadi, siapa yang terdampak, foto, dan geser sebelum/sesudah citra satelit 2017 vs 2025 (Air Nyata). Hanya kejadian nyata, bukan perkiraan.
   - **Demak**: Bedono (KK yang direlokasi), Timbulsloko (KK yang hidup di tengah genangan).
   - **Semarang**: Tambak Lorok, rob di kawasan kota, tembok laut yang retak.
6. **Peta**: tombol **Cek lokasimu** (satu-satunya tombol terisi di layar ini) membuka peta di kota yang dipilih. Sebelum peta, satu layar cara membaca: dua tingkat (Rob dan Pasang Harian), Air Nyata, dihitung tanpa Tanggul dan pompa, tahun selalu berupa Rentang Tahun. Animasi pembuka 2015 → sekarang (`DESIGN.md` Gerak A1) jalan sekali di sini.
7. **Mitigasi**: di peta ada tombol hantu **Apa yang bisa dilakukan?**, karena di ponsel peta penuh layar menelan gerakan scroll. Isinya ada di §1.4.

Kunjungan kedua dan seterusnya: halaman pembuka tetap muncul, tapi ada tombol hantu **Langsung ke peta** di atas.

### 1.2 Dengan link yang dibagikan
Kalau link berisi hash (`#lat,lon,zoom,tahun,skenario`), halaman pembuka dilewati dan peta langsung membuka keadaan itu.

### 1.3 Di peta
Banner di atas: "Wilayah Cakupan: sementara baru Semarang & Demak". Badge "Belum tervalidasi" sampai Uji Mundur lulus.

### 1.4 Apa yang bisa dilakukan (mitigasi)
Dibuka dari tombol di peta. Satu halaman gulir, dua bagian:

1. **Yang sudah dilakukan**: satu Kartu Upaya per upaya nyata (misalnya tembok laut Tambak Lorok, Tol Tanggul Laut Semarang–Demak, mangrove dan pemecah ombak di Bedono/Timbulsloko, pembatasan air tanah, polder dan pompa). Isi kartu: apa, kapan, siapa, dan dampaknya. Dampak ditulis dari dua sumber:
   - berita atau laporan, dengan link sumber;
   - data INTEL sendiri di lokasi itu, yaitu Laju Penurunan sebelum dan sesudah upaya dari InSAR (misalnya "di belakang tembok ini tanah masih turun ±X cm/tahun").
   Kalau data InSAR di lokasi itu kurang, kartu menulis "Dampak ke penurunan tanah belum bisa diukur".
2. **Yang masih bisa dilakukan**: perbandingan Skenario Lanjut vs Henti (berapa tahun yang bisa diselamatkan kalau air tanah berhenti disedot), lalu mangrove dan Tanggul, dengan catatan jujur: Tanggul menahan laut, tapi tidak menghentikan tanah turun.

Tanggul tetap hanya garis informasi. Kartu Upaya tidak boleh menyiratkan area di belakangnya aman atau pasti tergenang.

## 2. Mengecek Lokasi Sendiri (Pengunjung)
1. Ketik alamat atau nama Kelurahan, lalu pilih dari saran. Peta terbang ke sana.
2. Ketuk titik rumah. Kartu titik muncul: Tinggi Tanah, Laju Penurunan, nama Kelurahan, dan dua Rentang Tahun:
   ```
   Mulai kena Rob sesekali: ±2029–2032   (Tahun Rob)
   Di bawah pasang harian:  ±2036–2041   (Tahun Bawah Pasang Harian)
   ```
   Kalau Laju Penurunan titik itu diisi dari tetangga, kartu menulis "diperkirakan dari titik terukur dalam ±1 km".
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
| Sudah di bawah Pasang Tertinggi hari ini | Tanpa tahun. Kartu menulis bahwa tanah sudah di bawah pasang dan nasibnya bergantung pada Tanggul, pompa, dan urugan (ADR-0005) |

## 5. Peliput
1. Buka halaman Peliput dari menu.
2. Urutkan tabel Kelurahan menurut Rentang Tahun paling awal, Laju Penurunan, atau luas Area Bawah Pasang di 2050.
3. Ketuk nama Kelurahan, peta terbuka di Kelurahan itu.
4. Unduh CSV atau GeoJSON, atau buka arsip Rilis Data lama di GitHub Releases.

## 6. Halaman Tentang
Cara hitung dalam bahasa awam, keterbatasan (Tanggul dan pompa tidak dihitung, galat ketinggian), asal nama dari Kolam Intel ITB, atribusi dan lisensi setiap dataset.
