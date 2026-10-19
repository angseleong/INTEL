# INTEL — Daftar Tugas Aktif

> **Aturan:** agen hanya boleh mengerjakan tugas di blok ACTIVE.
> Blok di bawah garis (---) adalah backlog. Jangan dimulai sebelum dipindah ke atas.
> Setiap blok berakhir dengan **Checkpoint**: sesuatu yang bisa dibuka atau dijalankan.

---

## DONE — Blok 0: Persiapan

**Pemilik (manual):**
- [x] Buat akun NASA Earthdata (urs.earthdata.nasa.gov). Dipakai untuk HyP3 dan unduhan Sentinel-1.
- [x] Jadikan repo GitHub `INTEL` publik. Menit GitHub Actions gratis tanpa batas untuk repo publik.
- [x] Simpan `EARTHDATA_USERNAME` dan `EARTHDATA_PASSWORD` di GitHub → Settings → Secrets and variables → Actions.

**Agen:**
- [x] Scaffold Vite + TypeScript (strict) di root, dengan skrip `dev` dan `build`.
- [x] `pipeline/requirements.txt` + `.gitignore` (abaikan data mentah, GeoTIFF, `.venv/`).

**Checkpoint:** `npm run dev` menampilkan halaman kosong tanpa error, dan `pip install -r pipeline/requirements.txt` berhasil. ✅ 19 Okt 2026.

## DONE — Blok 1: Cek Data

Tujuan: setiap baris "belum dicek" di `DATA.md` §1 jadi pasti sebelum ada kode hitung.

- [x] Cek sumber data pasang. Portal BIG tidak bisa diakses, diganti stasiun IOC `sema` (arsip mulai 2015). Datumnya pernah berubah, caranya di `DATA.md` §2.1.
- [x] Cek DeltaDTM: datum EGM2008, tahun acuan campuran 2012–2023. Lihat `DATA.md` §2.1.
- [x] Tulis cara menyamakan datum DeltaDTM dan data pasang di `DATA.md` §2.1.
- [x] Unduh MDT: DTU22, ±1,01 m di Semarang. Sisa cek geoid acuannya dipindah ke Blok 3.
- [x] Ambil tile DeltaDTM `S07E110` lewat range request ke `Asia.zip`.
- [x] Batas Kelurahan: HDX COD-AB (BPS), CC BY-IGO. Portal BIG tidak dipakai.
- [x] Pilih peta dasar citra: EOX Sentinel-2 cloudless.
- [x] Pilih tag OSM untuk Tanggul.
- [x] Cari sumber `HENTI_TAHUN`: Tokyo, ±10 tahun. Lihat `DATA.md` §2.2.

**Checkpoint:** `DATA.md` §1 tidak punya baris "belum dicek" lagi. ✅ 19 Okt 2026, kecuali angka Kenaikan Muka Laut BRIN yang dokumen aslinya dicari di Blok 3.

---

## DONE — Blok 2: Laju Penurunan Pertama
- [x] `fetch_insar.py`: cari stack, kirim pasangan ke HyP3, unduh hasil. Jalur naik 127, burst `272740` + `272741` IW1: 436 tanggal (Okt 2014 – Okt 2026), 869 pasangan.
- [x] Pemilik: jalankan workflow `insar` submit. 869 pasangan terkirim ke HyP3, 19 Okt 2026 (run #2).
- [x] Cek status otomatis tiap 6 jam: workflow membuka Issue "HyP3 selesai" begitu semua pasangan selesai.
- [x] Pemilik: jalankan workflow `insar` step `process`. Run #6 berhasil, 19 Okt 2026.
- [x] MintPy: deret waktu → Laju Penurunan + simpangan baku (GeoTIFF), `fetch_insar.py timeseries`. Belum dites sampai hasil HyP3 ada.
- [x] Jalankan di GitHub Actions: 3 jam 1 menit total (MintPy 2 jam 59 menit), unduhan 6,6 GB, disk 67 dari 145 GB. Muat di runner gratis.
- [x] Bandingkan dengan paper: Sayung 10,8, Genuk 10,4, Kaligawe 9,2 cm/tahun, maksimum 14,7. Pusat kota ±0,2, perbukitan selatan −1 s/d −1,5. Cocok dengan pola di riset. Cakupan baru 10% piksel (koherensi temporal ≥ 0,7), plus celah di antara dua burst.

**Checkpoint:** GeoTIFF Laju Penurunan terbuka di QGIS dan angkanya masuk akal dibanding paper. ✅ 19 Okt 2026.

## ACTIVE — Blok 3: Hitung & Uji Mundur

> Dibuka bersamaan dengan Blok 2 (19 Okt 2026, disetujui pemilik) supaya bagian yang tidak butuh hasil HyP3 bisa dikerjakan sambil menunggu.

- [x] `fetch_dem.py`: DeltaDTM `S07E110` + `S08E110` lewat range request, dikurangi MDT 1,008 m → `elevation.tif`.
- [x] `fetch_tide.py`: IOC `sema` 2015–2026 → Pasang Tertinggi 0,65 m, Pasang Harian 0,34 m.
- [x] Uji asap `compute.py` dari ujung ke ujung dengan laju buatan 10 cm/tahun: jalan, 70.956 titik.
- [x] Cek geoid acuan DTU22 MDT: XGM2019e, bukan EGM2008. Dipakai apa adanya dulu, diganti kalau Uji Mundur meleset sistematis.
- [x] Sumber angka BRIN 2,4–4,3 mm/tahun: siaran pers BRIGHTS Seri 2, 26 Mei 2026.
- [x] Pilih `t0` DeltaDTM dengan titik ICESat-2 di Sayung: **2021** (`DATA.md` §2.1). Efeknya kecil: "sudah di bawah Pasang Tertinggi" 27% → 26%.
- [x] Cek MDT dengan muka laut ICESat-2: **0,75 ± 0,04 m** di atas EGM2008 dari 7 lintasan 2019–2025 yang dikoreksi pasang stasiun. Menggantikan DTU22 (1,008 m, geoid berbeda).
- [x] Tingkat ketiga Tahun Hilang ke Laut (di bawah Surut Harian −0,31 m).
- [x] `compute.py` + `compute_check.py` (angka buatan dengan jawaban yang diketahui). Masa Terukur menyusul setelah ada deret waktu InSAR.
- [x] `compute.py` pertama dengan data asli: 31.096 titik. 27% sudah di bawah Pasang Tertinggi, 3% 2026–2030, 8% 2031–2040, 6% 2041–2050, 56% tidak sebelum 2050. Genuk −0,33 m dan Kaligawe −0,21 m di bawah MSL, kemungkinan terlalu rendah karena MDT dan `t0`. **Belum boleh ditampilkan.**
- [ ] `backtest.py`: Uji Mundur sesuai `DATA.md` §5.
- [ ] Setel `RENTANG_MAKS` dan `UJI_MINIMAL` dari hasil Uji Mundur.

**Checkpoint:** `python pipeline/backtest.py` mencetak persentase kecocokan ≥ `UJI_MINIMAL`. Kalau gagal, berhenti dan perbaiki sebelum lanjut.

## ACTIVE — Blok 4: Peta Dasar

> Dibuka 19 Okt 2026 atas persetujuan pemilik, sebelum Uji Mundur lulus. Peta wajib berlabel "Belum tervalidasi" sampai `meta.json` `validated: true`.

- [ ] Pemilik: sambungkan repo ke Vercel (Add New → Project → pilih INTEL). Opsional: domain di Vercel → Settings → Domains.
- [x] `export.py` → `below-tide.geojson` (50 poligon, 0,6 MB gzip) + `points.json` (31.096 titik per kolom, 0,2 MB gzip) + `meta.json`. GeoJSON dulu, PMTiles kalau sudah Pantura.
- [x] Peta MapLibre (peta dasar EOX 2024) + Area Bawah Pasang + Garis Pantai 2026 (putih) dan tahun terpilih (oranye putus-putus).
- [x] Slider tahun 2026–2050 + Play + Skenario Lanjut/Henti.
- [ ] Masa Terukur 2015–2025 di slider: perlu `timeseries.h5` dari MintPy di artifact.
- [x] Kartu klik titik: titik terukur terdekat ≤ 150 m, kasus di luar Wilayah Cakupan, tanpa data, sudah kena, tidak sebelum 2050, belum bisa diperkirakan.
- [x] Celah InSAR diisi dari titik terukur dalam ±1 km (min. 10 tetangga), berlabel. 58.387 titik (27.291 isian).
- [x] Pilihan tingkat Rob / Terendam / Hilang ke Laut di peta + legenda.
- [ ] Pemilik: jalankan `insar` step `process` sekali lagi dengan ambang koherensi 0,5, supaya lebih banyak titik terukur langsung.

**Checkpoint:** di desktop dan 375×812, geser slider dan lihat Area Bawah Pasang berubah, ketuk titik di Sayung dan lihat Rentang Tahun.

## Blok 5: Fitur Lengkap v1
- [ ] Skenario Lanjut / Henti.
- [ ] Geser bandingkan.
- [ ] Pencarian alamat.
- [ ] URL hash.
- [ ] Lapisan Tanggul.
- [ ] Banner pasang minggu ini.
- [ ] Halaman Peliput + `ranking.csv`.
- [ ] Halaman pembuka (FR-0, `USERFLOW.md` §1.1) + banner Wilayah Cakupan di peta.
- [ ] Halaman Tentang + semua atribusi.

**Checkpoint:** semua FR di `PRD.md` §4 bisa dicoba di ponsel.

## Blok 6: Otomasi & Rilis
- [ ] `tide.yml`, `dikes.yml`, `insar.yml`.
- [ ] Rilis Data pertama `data-YYYYQn` di GitHub Releases.
- [ ] Cek semua syarat rilis di `PRD.md` §5.

**Checkpoint:** situs online di Vercel, dan data pasang terbarui sendiri dalam seminggu tanpa ada yang menjalankan apa pun.

## Backlog
- v1.1: Jakarta Utara.
- v1.1: tampilan 3D setelah Uji Mundur lulus: citra tajam (Esri World Imagery atau MapTiler, cek syaratnya), gedung 3D dari OpenFreeMap, lapisan air 3D setinggi (pasang − Tinggi Tanah), kamera sinematik untuk animasi pembuka. Google Photorealistic 3D tidak dipakai karena wajib kartu kredit.
- v1.1: lapisan area yang benar-benar terendam per tahun (citra air Sentinel-1/2), memakai ulang peta air dari Uji Mundur.
- v2: ML untuk mengisi celah InSAR (tambak, sawah, vegetasi).
- v2: NISAR L-band.
- v2: seluruh Pantura.
