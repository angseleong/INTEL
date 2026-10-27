# INTEL Architecture

## 1. Gambaran

```
① PIPELINE (GitHub Actions, terjadwal)   ② REPO & ARSIP                  ③ HOSTING          ④ BROWSER
──────────────────────────────────────   ──────────────                  ─────────          ────────
• minta HyP3 (server NASA) mengolah  ──► commit data terbaru ke      ──► Vercel deploy  ──► MapLibre membaca
  citra Sentinel-1                        public/data/                    otomatis tiap      PMTiles, filter
• unduh hasil, gabung jadi Laju           Rilis Data diarsipkan di        push               tahun & Skenario
  Penurunan, hitung Tahun Rob             GitHub Releases
• ekspor PMTiles + CSV
```

Tidak ada server dan tidak ada database (ADR-0001). Pengolahan citra radar yang berat dikerjakan HyP3 di server NASA. GitHub Actions hanya mengirim permintaan, mengunduh hasil, dan menghitung. Browser hanya memfilter fitur yang sudah dihitung.

## 2. Susunan Folder

```
INTEL/
├── index.html              # Peta (React). Halaman pembuka baru menyusul di Blok 7
├── peliput.html            # Halaman Peliput: peringkat + unduhan (gaya lama, diganti di Blok 7)
├── tentang.html            # Halaman Tentang: cara hitung, atribusi (gaya lama, diganti di Blok 7)
├── upaya.html              # Apa yang Bisa Dilakukan: Kartu Upaya + Skenario (gaya lama, diganti di Blok 7)
├── vite.config.ts          # empat halaman HTML di atas + Tailwind
├── public/fonts/           # Sora (OFL), satu file woff2
├── src/
│   ├── app.css             # Tailwind + token Laut Malam dari DESIGN.md
│   ├── peta/               # Halaman Peta: Peta.tsx (peta, panel, slider, Skenario, pencarian, hash), PointCard.tsx, layers.ts
│   ├── sea/                # Laut WebGL: glsl.ts (shader bersama), ripples.ts (+ ripples_check.ts). Hanya halaman pembuka dan Upaya, bukan peta
│   ├── compare.ts          # Geser bandingkan: peta kedua di atas, dipotong clip-path
│   ├── pointCard.ts        # Isi Kartu titik + cari titik terdekat
│   ├── search.ts           # Pencarian alamat (Nominatim)
│   ├── tide.ts             # Pasang tertinggi minggu ini
│   ├── intro.ts            # Halaman pembuka lama, tidak dipakai lagi, dihapus di akhir Blok 7
│   ├── page.ts             # Bersama untuk halaman teks: gaya + A9
│   ├── tentang.ts          # Konstelasi Titik
│   ├── peliput.ts          # Tabel peringkat + grafik per kota
│   ├── upaya.ts            # Angka Kartu Upaya + Skenario
│   ├── tokens.css          # Token DESIGN.md lama, dipakai page.css sampai halaman teks diganti
│   └── page.css            # Halaman teks
├── public/
│   ├── photos/             # Foto Cerita Kota (DATA.md §6.1)
│   ├── story/              # Air Nyata 2017 vs 2025 untuk Cerita Kota
│   └── data/               # Data terbaru, ditimpa oleh pipeline setiap pembaruan
│       ├── below-tide-{rob,daily}.geojson  # satu file per tingkat, PMTiles setelah Pantura
│       ├── water-2025.geojson  # Air Nyata
│       ├── points.json         # titik per kolom, termasuk indeks Kelurahan
│       ├── kelurahan.json      # [kode, nama, kecamatan, kota] per Kelurahan
│       ├── meta.json           # tanggal, Pasang, status Uji Mundur, laju per kota
│       ├── dikes.geojson       # Tanggul, PMTiles setelah Pantura
│       ├── tide.json           # air tinggi harian 120 hari ke depan
│       ├── ranking.csv         # satu baris per Kelurahan
│       ├── constellation.json  # titik untuk Konstelasi Titik
│       └── upaya.json          # angka halaman Apa yang Bisa Dilakukan
├── pipeline/
│   ├── requirements.txt
│   ├── fetch_insar.py      # HyP3 burst InSAR → MintPy → Laju Penurunan (GeoTIFF)
│   ├── fetch_dem.py        # DeltaDTM potongan Wilayah Cakupan
│   ├── fetch_tide.py       # Data pasang IOC → Pasang Tertinggi, Pasang Harian, tide.json (+ fetch_tide_check.py)
│   ├── fetch_dikes.py      # Tanggul dari OpenStreetMap
│   ├── fetch_kelurahan.py  # Batas Kelurahan HDX COD-AB
│   ├── fetch_water.py      # Air dari Sentinel-2 (Uji Mundur, Air Nyata)
│   ├── compute.py          # Rumus DATA.md §2–3 → Tahun Rob + Tahun Bawah Pasang Harian per titik (+ compute_check.py)
│   ├── backtest.py         # Uji Mundur DATA.md §5
│   ├── export.py           # → file web di public/data + ranking.csv (+ export_check.py)
│   ├── upaya.py            # → upaya.json
│   ├── story.py            # → public/story
│   └── run_all.py          # Langkah 1–6 berurutan untuk satu Rilis Data
└── .github/workflows/
    ├── tide.yml            # Mingguan
    ├── dikes.yml           # Bulanan
    └── insar.yml           # Tiap 3 bulan: run_all.py + Rilis Data
```

## 3. Pipeline

Urutan per Rilis Data:

1. `fetch_insar.py`: cari citra Sentinel-1 di atas Wilayah Cakupan, kirim pasangan burst ke HyP3, tunggu, unduh hasilnya, jalankan MintPy jadi peta Laju Penurunan + simpangan bakunya.
2. `fetch_dem.py`: potong DeltaDTM ke Wilayah Cakupan, samakan grid dengan peta Laju Penurunan.
3. `fetch_tide.py`: hitung Pasang Tertinggi dan Pasang Harian dari data pasang per jam.
4. `compute.py`: untuk setiap titik, hitung Tahun Rob dan Tahun Bawah Pasang Harian (tengah, paling cepat, paling lambat) untuk kedua Skenario, plus Tinggi Tanah terukur tiap tahun dari 2015 sampai tahun Rilis Data.
5. `backtest.py`: hanya untuk Uji Mundur, sebelum rilis pertama dan setiap kali rumus berubah.
6. `export.py`: hasilkan file di §4, timpa `public/data/`, unggah juga sebagai Rilis Data `data-YYYYQn`.

Hanya titik dengan Tinggi Tanah di bawah 5 m yang diekspor. Daerah yang lebih tinggi tidak akan di bawah Pasang Tertinggi sebelum 2050.

Batas runner gratis GitHub Actions: 6 jam per job, ±14 GB disk. Pemakaian sebenarnya diukur di Blok 2. Kalau tidak muat, pilihannya (VPS murah atau lainnya) diputuskan bersama pemilik dan ditulis sebagai ADR. Mesin pemilik bukan bagian dari rencana.

## 4. Format Data untuk Web

| File | Isi | Dipakai oleh |
|---|---|---|
| `below-tide-{rob,daily}.geojson` | Satu file per tingkat, hanya tingkat yang aktif yang diunduh. Satu poligon gabungan per tahun per Skenario. Properti: `level`, `year`, `scenario` (nanti `measured` untuk Masa Terukur) | Lapisan Area Bawah Pasang dan Garis Pantai (garis tepi poligon). Slider cukup mengganti filter `year`, tanpa menghitung ulang |
| `points.json` | Titik grid ±80 m, disimpan per kolom (satu daftar per properti), dicari terdekatnya di browser. Properti: `elevation`, `subsidenceRate`, `robYearMin`, `robYearMax`, `dailyYearMin`, `dailyYearMax` per Skenario, `kelurahan` | Kartu klik titik |
| `dikes.geojson` | Garis Tanggul OSM dalam 3 km dari pantai | Lapisan informasi |
| `tide.json` | Air tinggi harian 120 hari ke depan (waktu, tinggi di atas muka laut rata-rata). Browser memilih yang tertinggi dalam 7 hari | Banner pasang |
| `kelurahan.json` | `[kode, nama, kecamatan, kota]`, diindeks oleh kolom `kelurahan` di `points.json` | Nama Kelurahan di kartu titik |
| `ranking.csv` | Satu baris per Kelurahan | Halaman Peliput, unduhan |

Setiap file menyimpan tanggal pembaruannya (metadata PMTiles atau field `updated`).

## 5. Web

- Vite + React + TypeScript strict + Tailwind CSS 4 + komponen shadcn/ui (ADR-0007). Tetap statis, tanpa server. Susunan `src/` di §1 masih versi lama dan ditulis ulang di Blok 7.
- Laut WebGL (shader sendiri, tanpa three.js) untuk halaman pembuka, Air Nyata di peta, dan halaman Upaya (ADR-0008, `DESIGN.md` bagian Laut WebGL).
- MapLibre GL JS + protokol `pmtiles`.
- GSAP + ScrollTrigger hanya untuk animasi scroll di halaman pembuka (ADR-0006). Tidak dimuat di halaman peta.
- Slider: `map.setFilter(layer, ["all", ["==", "year", y], ["==", "scenario", s]])`.
- Geser bandingkan: dua instance MapLibre yang posisinya disinkronkan, peta kanan dipotong dengan `clip-path`. Ditulis sendiri, tanpa plugin.
- URL hash: `#lat,lon,zoom,tahun,skenario`. Lokasi = titik yang diketuk kalau ada. Link tanpa hash membuka halaman pembuka dulu.

## 6. Penyimpanan

| Lapis | Di mana | Kenapa |
|---|---|---|
| Data mentah Sentinel-1 | Tidak disimpan. Arsip permanen ada di ASF/ESA | Ratusan GB, bisa diunduh ulang |
| Data terbaru untuk web | `public/data/` di repo, ditimpa setiap pembaruan | Beberapa MB, Vercel langsung menyajikannya |
| Arsip semua Rilis Data (GeoTIFF + PMTiles + CSV) | GitHub Releases, satu per kuartal | Gratis, maks 2 GB per file, tidak membengkakkan git |

Kalau `public/data/` tumbuh di atas ±50 MB, pindahkan ke Cloudflare R2 (gratis 10 GB) dan biarkan web membacanya dari sana.

## 7. Deploy

- Repo tersambung ke Vercel. Setiap push ke `main`, termasuk commit data dari pipeline, memicu deploy otomatis. Setiap branch dapat link preview.
- Build command: `npm run build`. Output: `dist/`.
- Domain sendiri (opsional): Vercel → Settings → Domains, lalu isi record DNS yang diberikan di penyedia domain.

Rahasia GitHub Actions yang dibutuhkan: `EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD` (akun NASA Earthdata pemilik, untuk HyP3).

Kalau sebuah workflow gagal, GitHub mengirim email ke pemilik. Itu satu-satunya hal yang perlu dipantau.

## 8. Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server lokal |
| `npm run build` | Build ke `dist/` |
| `python pipeline/compute_check.py` | Cek rumus dengan angka buatan |
| `python pipeline/run_all.py` | Satu Rilis Data penuh. Dipanggil oleh `insar.yml`, bisa juga dijalankan lokal untuk debug |
