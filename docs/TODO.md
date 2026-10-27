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
- [x] Tingkat ketiga Tahun Hilang ke Laut dicoba, lalu dibuang (lihat bawah).
- [x] `compute.py` + `compute_check.py` (angka buatan dengan jawaban yang diketahui). Masa Terukur menyusul setelah ada deret waktu InSAR.
- [x] `compute.py` pertama dengan data asli: 31.096 titik. 27% sudah di bawah Pasang Tertinggi, 3% 2026–2030, 8% 2031–2040, 6% 2041–2050, 56% tidak sebelum 2050. Genuk −0,33 m dan Kaligawe −0,21 m di bawah MSL, kemungkinan terlalu rendah karena MDT dan `t0`. **Belum boleh ditampilkan.**
- [x] `backtest.py` + `fetch_water.py`: Uji Mundur pertama. **Belum lulus**: tidak ada daya beda di Sayung (`DATA.md` §5.1).
- [x] Uji Mundur di seluruh pesisir dengan pembanding acak: **LULUS** (AUC 0,87, 3,9× acak). Sayung saja AUC 0,50 (`DATA.md` §5.2).
- [x] Kartu titik tanpa tahun untuk tanah yang sudah di bawah Pasang Tertinggi (ADR-0005).
- [x] Jadi dua tingkat: Rob (Pasang Tertinggi) dan Pasang Harian (nama "Jadi Laut" dibuang karena menyesatkan). Hilang ke Laut dibuang karena hanya menangkap 4%. Uji Mundur tetap lulus.
- [ ] Setel `RENTANG_MAKS` dari hasil Uji Mundur.

**Checkpoint:** `python pipeline/backtest.py` mencetak LULUS. ✅ 20 Okt 2026.

## ACTIVE — Blok 4: Peta Dasar

> Dibuka 19 Okt 2026 atas persetujuan pemilik, sebelum Uji Mundur lulus. Peta wajib berlabel "Belum tervalidasi" sampai `meta.json` `validated: true`.

- [ ] Pemilik: sambungkan repo ke Vercel (Add New → Project → pilih INTEL). Opsional: domain di Vercel → Settings → Domains.
- [x] `export.py` → `below-tide-{rob,daily}.geojson` (±0,6–0,8 MB gzip per tingkat, hanya tingkat aktif yang diunduh) + `points.json` (0,7 MB gzip) + `meta.json`. GeoJSON dulu, PMTiles kalau sudah Pantura.
- [x] Peta MapLibre (peta dasar EOX 2024) + Area Bawah Pasang + Garis Pantai 2026 (putih) dan tahun terpilih (oranye putus-putus).
- [x] Slider tahun 2026–2050 + Play + Skenario Lanjut/Henti.
- [ ] Masa Terukur 2015–2025 di slider: perlu `timeseries.h5` dari MintPy di artifact.
- [x] Kartu klik titik: titik terukur terdekat ≤ 150 m, kasus di luar Wilayah Cakupan, tanpa data, sudah kena, tidak sebelum 2050, belum bisa diperkirakan.
- [x] Celah InSAR diisi dari titik terukur dalam ±1 km (min. 10 tetangga), berlabel. 58.387 titik (27.291 isian).
- [x] Pilihan tingkat Rob / Pasang Harian di peta + legenda jujur + lapisan Air Nyata 2025.
- [x] Kartu titik menampilkan Tinggi Tanah pada tahun di slider, bukan tahun DeltaDTM (2021).
- [x] Pemilik: jalankan `insar` step `process` dengan ambang koherensi 0,5 (20 Okt 2026). Cakupan daratan < 3 m: 25% → 75%. 81.368 titik, 15.223 isian.
- [x] Acuan ulang laju ke median STABLE_BOX (`DATA.md` §2.4), karena acuan MintPy di run 2 jatuh di luar kotak.
- [ ] Cari tahu kenapa acuan MintPy di run 2 jatuh di luar STABLE_BOX (log run berikutnya).

**Checkpoint:** di desktop dan 375×812, geser slider dan lihat Area Bawah Pasang berubah, ketuk titik di Sayung dan lihat Rentang Tahun.

## ACTIVE — Blok 5: Fitur Lengkap v1

> Dibuka 20 Okt 2026 atas permintaan pemilik.
- [x] Skenario Lanjut / Henti: tombol di peta, ganti peta dan kartu, ikut tersimpan di URL hash.
- [x] Geser bandingkan: peta kedua di atas peta utama, dipotong `clip-path`, slider kecil untuk sisi kanan. Pilihan cepat "2015 vs sekarang" menyusul Masa Terukur.
- [x] Pencarian alamat: Nominatim, hanya di dalam Wilayah Cakupan, dicari saat Enter (aturan Nominatim melarang cari-sambil-ketik). Hasil yang dipilih langsung membuka kartu titik.
- [x] URL hash `#lat,lon,zoom,tahun,skenario`. Lokasi = titik yang diketuk, kalau ada.
- [x] Lapisan Tanggul: `fetch_dikes.py` → `dikes.geojson`, 138 garis OSM dalam 3 km dari pantai.
- [x] Banner pasang minggu ini: analisis harmonik 10 komponen dari setahun data IOC `sema` → `tide.json` 120 hari ke depan. Uji 30 hari terakhir: tinggi meleset rata-rata 7 cm, jam tepat.
- [x] Halaman Peliput + `ranking.csv`: batas Kelurahan HDX lewat range request (`fetch_kelurahan.py`, ±190 MB, ±15 menit), peringkat menurut "separuh daratan di bawah Pasang Tertinggi", laju per kota, unduhan. Nama Kelurahan juga tampil di kartu titik.
- [x] Halaman pembuka scrollytelling (FR-0, B1–B4) di atas peta utama, GSAP dimuat dinamis hanya tanpa hash. Banner Wilayah Cakupan di peta. Animasi A1 (2015 → sekarang) menyusul Masa Terukur.
- [x] Cerita Kota Demak dan Semarang: 2 foto Commons (`DATA.md` §6.1), angka KK bersumber, geser 2017 vs 2025 dari `story.py`. Belum ada foto Commons untuk Timbulsloko dan tembok laut yang retak.
- [x] Halaman Apa yang Bisa Dilakukan (FR-10): 5 Kartu Upaya bersumber (`DATA.md` §7), laju 2015–2017 dan seluruh rekaman per lokasi (`upaya.py`), Skenario Lanjut vs Henti. Laju sesudah upaya menyusul deret waktu Masa Terukur.
- [x] Halaman Tentang + semua atribusi + Konstelasi Titik.

**Checkpoint:** semua FR di `PRD.md` §4 bisa dicoba di ponsel.

## ACTIVE — Blok 7: Rombak Frontend (Laut Malam)

> Dibuka 27 Okt 2026 atas permintaan pemilik. Acuan: canvas mockup "INTEL Mockup Gaya Baru", ADR-0007, ADR-0008, `DESIGN.md`. Data dan pipeline tidak berubah.

- [x] Mockup 5 halaman + Prototipe Air di canvas, disetujui pemilik.
- [x] ADR-0007, ADR-0008, `DESIGN.md` ditulis ulang.
- [x] Pasang React + Tailwind 4 di Vite yang ada. Token `DESIGN.md` jadi tema Tailwind (`src/app.css`). Font Sora di-self-host. JSX dikompilasi esbuild bawaan Vite, tanpa `@vitejs/plugin-react`. shadcn/ui dipasang begitu ada komponen yang butuh (dialog, sheet), belum di Peta.
- [x] Laut WebGL untuk peta (`src/sea/mapWater.ts`): laut dan Air Nyata berombak, cincin riak dari Titik terpilih, cadangan reduced-motion dan tanpa WebGL. Cek: `node src/sea/ripples_check.ts`.
- [ ] Laut WebGL untuk halaman pembuka (perspektif), memakai `glsl.ts` dan `ripples.ts` yang sama.
- [x] Peta (`src/peta/`): MapLibre + Area Bawah Pasang bercahaya + kartu titik + slider + Play + Skenario + tingkat + pencarian + URL hash + Bandingkan + banner pasang. Dicek di 390×844 dan 1440×900. Halaman pembuka lama ikut lepas dari `index.html` sampai yang baru jadi.
- [ ] Peta: animasi A2 (pudar silang tahun), A3 (garis putus-putus berjalan), A5 (angka menghitung naik, kartu naik), A6. Masih langsung lompat.
- [ ] Halaman pembuka: laut naik ikut gulir sampai hilang, baru teks bagian berikutnya masuk dari samping. Lalu chip kota, Cerita Kota, cara membaca.
- [ ] Tentang (Konstelasi Titik), Apa yang Bisa Dilakukan (potongan laut diam), Peliput.
- [ ] Tiap halaman: impeccable `critique` + `polish` sekali, cek 375×812 dan desktop.
- [ ] Hapus `src/` lama setelah semua halaman pengganti lulus.

**Checkpoint:** semua FR di `PRD.md` §4 bisa dicoba di ponsel dengan tampilan baru, dan `npm run build` lolos tanpa error.

## Blok 6: Otomasi & Rilis
- [ ] `tide.yml`, `dikes.yml`, `insar.yml`. `insar.yml` juga perlu `fetch_kelurahan.py` (simpan `work/kelurahan.geojson` di cache atau Rilis Data, unduhannya ±15 menit), `upaya.py`, `story.py`.
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
