# INTEL — Data & Metode

## 1. Sumber Data

| Data | Sumber | Resolusi | Lisensi | Status |
|---|---|---|---|---|
| Laju Penurunan | Sentinel-1 (ESA Copernicus), diolah jadi interferogram oleh [ASF HyP3](https://hyp3-docs.asf.alaska.edu/) (burst InSAR), deret waktu dengan MintPy | ±80 m | Copernicus: bebas dengan atribusi | Belum dites untuk Demak–Semarang |
| Tinggi Tanah | [DeltaDTM](https://doi.org/10.4121/21997565) (Deltares/TU Delft), CopernicusDEM yang dikoreksi lidar ICESat-2 dan GEDI | 30 m | CC BY 4.0 (cek ulang di halaman repositori) | Belum diunduh |
| Pasang | Stasiun pasang BIG Semarang, kode `0042SMRG01`, data per jam (InaSeaLevel / iPASOET) | 1 titik | Belum dicek | Alamat portal perlu dicek ulang |
| Kenaikan Muka Laut | BRIN: 2,4–4,3 mm/tahun. Pembanding: proyeksi IPCC AR6 (NASA Sea Level Projection Tool) | – | Publik | Angka BRIN dari pemberitaan 2026, cari dokumen asli |
| Tanggul | OpenStreetMap | vektor | ODbL | Tag OSM yang dipakai belum dipilih |
| Batas Kelurahan | Kandidat: BIG, BPS, geoBoundaries | vektor | Belum dicek | Belum dicek |
| Peta dasar citra | Belum dipilih (harus gratis tanpa kartu kredit) | – | – | Belum dipilih |
| Pencarian alamat | Nominatim (OpenStreetMap), maks 1 permintaan/detik | – | ODbL | – |

Data yang **tidak** dipakai di v1 dan alasannya:
- **FABDEM**: lisensi non-komersial (CC BY-NC-SA). DeltaDTM lebih bebas dan khusus pesisir.
- **Peta Climate Central**: tidak memakai Laju Penurunan terukur.
- **NISAR (L-band)**: data publik sejak Juli 2026, tapi kalibrasi akhir masih berjalan. Masuk v2.

## 2. Rumus

Untuk setiap titik peta dan setiap tahun `t`:

```
Tinggi Tanah(t)     = Tinggi Tanah(t0) − Laju Penurunan × (t − t0)
Pasang Tertinggi(t) = Pasang Tertinggi(2026) + Kenaikan Muka Laut × (t − 2026)
Pasang Harian(t)    = Pasang Harian(2026)    + Kenaikan Muka Laut × (t − 2026)

Tahun Rob      = tahun pertama saat Tinggi Tanah(t) < Pasang Tertinggi(t)
Tahun Terendam = tahun pertama saat Tinggi Tanah(t) < Pasang Harian(t)
```

- Pasang Tertinggi dan Pasang Harian dihitung dari data pasang per jam beberapa tahun terakhir: Pasang Tertinggi = pasang tertinggi tahunan rata-rata (tanpa badai), Pasang Harian = rata-rata pasang tinggi harian.
- Peta (Area Bawah Pasang, Garis Pantai) memakai Pasang Tertinggi. Kartu titik menampilkan Tahun Rob dan Tahun Terendam.

- `t0` = tahun acuan Tinggi Tanah dari DeltaDTM. **Perlu dicek**: DeltaDTM dibangun dari data beberapa tahun, jadi tahun acuannya harus dipilih dan ditulis di sini.
- **Datum vertikal harus sama.** DeltaDTM dan data pasang BIG bisa memakai acuan tinggi yang berbeda (geoid vs datum stasiun). Konversinya harus dicek sebelum hitung pertama. Ini sumber kesalahan terbesar kalau terlewat.
- Laju Penurunan dari InSAR diukur searah pandang satelit. v1 menganggap gerakan tanah hanya vertikal. Kalau data orbit naik dan turun tersedia, gabungkan keduanya.

### 2.1 Skenario
- **Skenario Lanjut**: Laju Penurunan tetap sama setiap tahun.
- **Skenario Henti**: pengambilan air tanah dihentikan mulai 2027, Laju Penurunan menyusut linear sampai nol dalam `HENTI_TAHUN` tahun. Nilai awal `HENTI_TAHUN = 10`. **Perlu sumber**: cari contoh kota yang penurunannya berhenti setelah air tanah dibatasi (misalnya Tokyo atau Bangkok) dan sesuaikan angkanya.

## 3. Ketidakpastian

### 3.1 Sumbernya
- Tinggi Tanah: DeltaDTM punya rata-rata galat ±0,45 m secara global. Galat khusus Indonesia belum diketahui.
- Laju Penurunan: simpangan baku dari deret waktu InSAR per titik.
- Kenaikan Muka Laut: rentang BRIN 2,4–4,3 mm/tahun.

### 3.2 Rentang Tahun
- **Paling cepat**: Tinggi Tanah dikurangi galat, Laju Penurunan ditambah simpangan bakunya, Kenaikan Muka Laut 4,3 mm.
- **Paling lambat**: kebalikannya, dengan Kenaikan Muka Laut 2,4 mm.

Galat Tinggi Tanah mendominasi. Di titik yang turun 10 cm/tahun, ±0,45 m setara ±4–5 tahun. Di titik yang turun 2 cm/tahun, setara ±20 tahun.

### 3.3 Batas "belum bisa diperkirakan"
Kalau Rentang Tahun lebih lebar dari `RENTANG_MAKS = 10` tahun, kartu titik menulis "belum bisa diperkirakan". Angka ini kenop kalibrasi. Setel ulang setelah Uji Mundur.

## 4. Jadwal Pembaruan

| Data | Seberapa sering | Cara |
|---|---|---|
| Laju Penurunan | Tiap 3 bulan | GitHub Actions (`insar.yml`). Pengolahan berat di HyP3. Muat tidaknya di runner gratis diukur di Blok 2 |
| Pasang minggu ini | Tiap minggu | GitHub Actions |
| Tanggul | Tiap bulan | GitHub Actions |
| Tinggi Tanah | Saat DeltaDTM merilis versi baru | Manual |
| Kenaikan Muka Laut | Saat BRIN atau IPCC menerbitkan angka baru | Manual |

Semua pembaruan berjalan otomatis. Setiap pembaruan Laju Penurunan menghasilkan satu Rilis Data (`data-YYYYQn`) di GitHub Releases. Rilis lama tidak pernah dihapus.

## 5. Uji Mundur

**Tujuan**: membuktikan rumus §2 memprediksi Rob yang sudah terjadi, sebelum v1 dirilis.

1. Jalankan pipeline hanya dengan citra Sentinel-1 2015–2017.
2. Hitung Area Bawah Pasang untuk tahun 2025.
3. Bandingkan dengan area yang benar-benar terendam permanen di 2025, dipetakan dari citra air Sentinel-1 atau Sentinel-2, di Kecamatan Sayung, Demak (termasuk Bedono dan Timbulsloko).
4. **Lulus** kalau minimal `UJI_MINIMAL = 70%` area yang benar-benar terendam juga diprediksi sebagai Area Bawah Pasang.

Catatan:
- Sebagian Bedono kemungkinan sudah terendam sebelum 2015 (cek dari citra lama). Kalau benar, area yang baru terendam di antara 2017 dan 2025 adalah ujian yang lebih adil.
- DeltaDTM lebih baru dari 2017. Tinggi Tanah 2017 dihitung mundur: `Tinggi Tanah(2017) = Tinggi Tanah(t0) + Laju Penurunan × (t0 − 2017)`. Ini membocorkan sedikit informasi masa depan, jadi tulis hasilnya apa adanya.
