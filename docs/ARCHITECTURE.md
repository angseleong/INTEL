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
├── index.html              # Peta (halaman utama)
├── peliput.html            # Halaman Peliput: peringkat + unduhan
├── tentang.html            # Halaman Tentang: cara hitung, atribusi
├── src/
│   ├── main.ts             # Peta MapLibre, lapisan Area Bawah Pasang + Garis Pantai, slider, Play, Skenario
│   ├── compare.ts          # Geser bandingkan: dua peta tersinkron, dipotong CSS
│   ├── pointCard.ts        # Kartu klik titik + cari titik terdekat
│   ├── search.ts           # Pencarian alamat (Nominatim)
│   ├── tide.ts             # Banner pasang minggu ini
│   ├── peliput.ts          # Tabel peringkat + grafik
│   └── style.css
├── public/
│   └── data/               # Data terbaru, ditimpa oleh pipeline setiap pembaruan
│       ├── below-tide-{rob,sea}.geojson  # satu file per tingkat, PMTiles setelah Pantura
│       ├── points.json         # titik per kolom
│       ├── meta.json           # tanggal, Pasang, status Uji Mundur
│       ├── dikes.pmtiles
│       ├── tide.json        # Pasang 7 hari ke depan
│       └── ranking.csv
├── pipeline/
│   ├── requirements.txt
│   ├── fetch_insar.py      # HyP3 burst InSAR → MintPy → Laju Penurunan (GeoTIFF)
│   ├── fetch_dem.py        # DeltaDTM potongan Wilayah Cakupan
│   ├── fetch_tide.py       # Data pasang BIG → Pasang Tertinggi, Pasang Harian, tide.json
│   ├── fetch_dikes.py      # Tanggul dari OpenStreetMap
│   ├── compute.py          # Rumus DATA.md §2–3 → Tahun Rob + Tahun Jadi Laut per titik (+ compute_check.py)
│   ├── backtest.py         # Uji Mundur DATA.md §5
│   ├── export.py           # GeoTIFF → PMTiles + CSV
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
4. `compute.py`: untuk setiap titik, hitung Tahun Rob dan Tahun Jadi Laut (tengah, paling cepat, paling lambat) untuk kedua Skenario, plus Tinggi Tanah terukur tiap tahun dari 2015 sampai tahun Rilis Data.
5. `backtest.py`: hanya untuk Uji Mundur, sebelum rilis pertama dan setiap kali rumus berubah.
6. `export.py`: hasilkan file di §4, timpa `public/data/`, unggah juga sebagai Rilis Data `data-YYYYQn`.

Hanya titik dengan Tinggi Tanah di bawah 5 m yang diekspor. Daerah yang lebih tinggi tidak akan di bawah Pasang Tertinggi sebelum 2050.

Batas runner gratis GitHub Actions: 6 jam per job, ±14 GB disk. Pemakaian sebenarnya diukur di Blok 2. Kalau tidak muat, pilihannya (VPS murah atau lainnya) diputuskan bersama pemilik dan ditulis sebagai ADR. Mesin pemilik bukan bagian dari rencana.

## 4. Format Data untuk Web

| File | Isi | Dipakai oleh |
|---|---|---|
| `below-tide-{rob,sea}.geojson` | Satu file per tingkat, hanya tingkat yang aktif yang diunduh. Satu poligon gabungan per tahun per Skenario. Properti: `level`, `year`, `scenario` (nanti `measured` untuk Masa Terukur) | Lapisan Area Bawah Pasang dan Garis Pantai (garis tepi poligon). Slider cukup mengganti filter `year`, tanpa menghitung ulang |
| `points.json` | Titik grid ±80 m, disimpan per kolom (satu daftar per properti), dicari terdekatnya di browser. Properti: `elevation`, `subsidenceRate`, `robYearMin`, `robYearMax`, `seaYearMin`, `seaYearMax` per Skenario, `kelurahan` | Kartu klik titik |
| `dikes.pmtiles` | Garis Tanggul | Lapisan informasi |
| `tide.json` | Waktu dan tinggi pasang 7 hari ke depan | Banner pasang |
| `ranking.csv` | Satu baris per Kelurahan | Halaman Peliput, unduhan |

Setiap file menyimpan tanggal pembaruannya (metadata PMTiles atau field `updated`).

## 5. Web

- Vite + TypeScript strict, tanpa framework UI. Tiga halaman HTML biasa.
- MapLibre GL JS + protokol `pmtiles`.
- Slider: `map.setFilter(layer, ["all", ["==", "year", y], ["==", "scenario", s]])`.
- Geser bandingkan: dua instance MapLibre yang posisinya disinkronkan, peta kanan dipotong dengan `clip-path`. Ditulis sendiri, tanpa plugin.
- URL hash: `#lat,lon,zoom,tahun,skenario`.

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
