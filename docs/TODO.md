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

## ACTIVE — Blok 2: Laju Penurunan Pertama
- [x] `fetch_insar.py`: cari stack, kirim pasangan ke HyP3, unduh hasil. Jalur naik 127, burst `272740` + `272741` IW1: 436 tanggal (Okt 2014 – Okt 2026), 869 pasangan.
- [x] Pemilik: jalankan workflow `insar` submit. 869 pasangan terkirim ke HyP3, 19 Okt 2026 (run #2).
- [x] Cek status otomatis tiap 6 jam: workflow membuka Issue "HyP3 selesai" begitu semua pasangan selesai.
- [ ] Pemilik: begitu Issue itu muncul, jalankan workflow `insar` step `process` (unduh + MintPy). Maks 14 hari, setelah itu hasil dihapus HyP3.
- [x] MintPy: deret waktu → Laju Penurunan + simpangan baku (GeoTIFF), `fetch_insar.py timeseries`. Belum dites sampai hasil HyP3 ada.
- [ ] Jalankan di GitHub Actions, ukur lama proses dan pemakaian disk. Kalau tidak muat di runner gratis, berhenti dan bahas pilihan lain dengan pemilik.
- [ ] Bandingkan hasilnya dengan angka paper (Semarang hingga ±10 cm/tahun, Demak hingga ±20 cm/tahun).

**Checkpoint:** GeoTIFF Laju Penurunan terbuka di QGIS dan angkanya masuk akal dibanding paper.

## Blok 3: Hitung & Uji Mundur
- [ ] `fetch_dem.py` (range request ke `Asia.zip`, tile `S07E110` + `S08E110`), `fetch_tide.py` (IOC `sema`).
- [ ] Cek geoid acuan DTU22 MDT vs EGM2008. Kalau beda, hitung `MSS DTU21 − EGM2008`.
- [ ] Cari dokumen asli angka Kenaikan Muka Laut BRIN 2,4–4,3 mm/tahun.
- [ ] Pilih `t0` DeltaDTM dengan titik ICESat-2 di Sayung (`DATA.md` §2.1).
- [ ] `compute.py` + `compute_check.py` (angka buatan dengan jawaban yang diketahui).
- [ ] `backtest.py`: Uji Mundur sesuai `DATA.md` §5.
- [ ] Setel `RENTANG_MAKS` dan `UJI_MINIMAL` dari hasil Uji Mundur.

**Checkpoint:** `python pipeline/backtest.py` mencetak persentase kecocokan ≥ `UJI_MINIMAL`. Kalau gagal, berhenti dan perbaiki sebelum lanjut.

## Blok 4: Peta Dasar
- [ ] Pemilik: sambungkan repo ke Vercel (Add New → Project → pilih INTEL). Opsional: domain di Vercel → Settings → Domains.
- [ ] `export.py` → `below-tide.pmtiles`, `points.pmtiles`.
- [ ] Peta MapLibre + lapisan Area Bawah Pasang + Garis Pantai.
- [ ] Slider tahun 2015–2050 (Masa Terukur + Masa Perkiraan) + Play.
- [ ] Kartu klik titik, termasuk semua kasus khusus di `USERFLOW.md` §4.

**Checkpoint:** di desktop dan 375×812, geser slider dan lihat Area Bawah Pasang berubah, ketuk titik di Sayung dan lihat Rentang Tahun.

## Blok 5: Fitur Lengkap v1
- [ ] Skenario Lanjut / Henti.
- [ ] Geser bandingkan.
- [ ] Pencarian alamat.
- [ ] URL hash.
- [ ] Lapisan Tanggul.
- [ ] Banner pasang minggu ini.
- [ ] Halaman Peliput + `ranking.csv`.
- [ ] Halaman Tentang + semua atribusi.

**Checkpoint:** semua FR di `PRD.md` §4 bisa dicoba di ponsel.

## Blok 6: Otomasi & Rilis
- [ ] `tide.yml`, `dikes.yml`, `insar.yml`.
- [ ] Rilis Data pertama `data-YYYYQn` di GitHub Releases.
- [ ] Cek semua syarat rilis di `PRD.md` §5.

**Checkpoint:** situs online di Vercel, dan data pasang terbarui sendiri dalam seminggu tanpa ada yang menjalankan apa pun.

## Backlog
- v1.1: Jakarta Utara.
- v1.1: lapisan area yang benar-benar terendam per tahun (citra air Sentinel-1/2), memakai ulang peta air dari Uji Mundur.
- v2: ML untuk mengisi celah InSAR (tambak, sawah, vegetasi).
- v2: NISAR L-band.
- v2: seluruh Pantura.
