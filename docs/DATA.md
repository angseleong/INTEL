# INTEL — Data & Metode

## 1. Sumber Data

| Data | Sumber | Resolusi | Lisensi | Status |
|---|---|---|---|---|
| Laju Penurunan | Sentinel-1 (ESA Copernicus), diolah jadi interferogram oleh [ASF HyP3](https://hyp3-docs.asf.alaska.edu/) (burst InSAR), deret waktu dengan MintPy | ±80 m | Copernicus: bebas dengan atribusi | ✅ Run pertama 19 Okt 2026: maks 14,7 cm/tahun (Sayung–Genuk), pusat kota ±0,2. Cakupan 10% piksel pada koherensi temporal ≥ 0,7. Celah data di batas dua burst |
| Tinggi Tanah | [DeltaDTM v1.1](https://doi.org/10.4121/21997565) (Deltares/TU Delft), CopernicusDEM yang dikoreksi lidar ICESat-2 dan GEDI. CRS `EPSG:9518` (WGS84 + tinggi EGM2008). Dipotong di +10 m. Galat di Indonesia: MAE 0,50 m, RMSE 0,67 m ([paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC10917791/)) | 30 m | CC BY 4.0 + atribusi Copernicus WorldDEM-30 | ✅ Tile `DeltaDTM_v1_1_S07E110.tif` (8,5 MB, lintang −7…−6, bujur 110…111) diambil langsung dari dalam `Asia.zip` dengan HTTP range request, tanpa mengunduh 17 GB. Nama tile memakai pojok **kiri bawah**. Daerah Demak di selatan −7° ada di tile `S08E110` |
| Pasang | Stasiun **IOC `sema` Semarang** (operator BIG), -6,948 / 110,420. Data per menit, arsip mulai 2015, lewat API `ioc-sealevelmonitoring.org/service.php?query=data&code=sema` | 1 titik | Data IOC, bebas dengan atribusi (cek syaratnya) | ✅ Diunduh 2015–2026 (sensor tekanan `prs`). **Pasang Tertinggi 0,65 m, Pasang Harian 0,34 m** di atas muka laut rata-rata, rata-rata 5 tahun dengan data cukup (2017, 2018, 2019, 2023, 2024). Portal lama BIG (`ina-sealevelmonitoring.big.go.id`) tidak bisa diakses |
| Kenaikan Muka Laut | BRIN: 2,4–4,3 mm/tahun dari analisis altimetri, dipaparkan Agung Syetiawan (Pusat Riset Geoinformatika BRIN) di BRIGHTS Seri 2, 26 Mei 2026 ([Republika](https://news.republika.co.id/berita/tfw5st475/temuan-brin-jakarta-cirebon-hingga-demak-permukaan-tanah-pesisir-pantura-terus-menurun?), [detik](https://inet.detik.com/science/d-8513502/pantura-makin-tenggelam-kenaikan-muka-laut-hingga-4-3-mm-per-tahun)). Pembanding: BMKG 4,3 ± 0,4 mm/tahun untuk seluruh Indonesia, proyeksi IPCC AR6 | – | Publik | ✅ Sumbernya siaran pers, makalahnya belum terbit. Batas atas 4,3 mm sama dengan angka BMKG |
| Selisih geoid–laut (MDT) | [DTU22 MDT](https://ftp.space.dtu.dk/pub/DTU22/MDT/) (DTU Space) | 0,125° (±14 km) | Bebas untuk riset dan non-profit, wajib menyertakan pemberitahuan hak cipta DTU | Dipakai sebagai pembanding saja: 1,008 m, diukur dari geoid XGM2019e. Yang dipakai: **0,75 m** dari ICESat-2 (§2.1) |
| Tanggul | OpenStreetMap, tag `man_made=dyke`, `man_made=embankment`, `embankment=yes`, `man_made=breakwater`, `barrier=wall` + `wall=flood_wall`. **Bukan** dari nama: "Jalan Tanggul …" adalah nama jalan | vektor | ODbL | ✅ 368 garis di Semarang–Demak (309 `man_made=embankment`). Tag embankment juga dipakai untuk tanggul jalan dan rel, jadi difilter dengan jarak ke pantai |
| Batas Kelurahan | [HDX COD-AB Indonesia](https://data.humdata.org/dataset/cod-ab-idn), sumber BPS, file `idn_admin4` (berlaku 1 April 2020) | vektor | CC BY-IGO | ✅ 81.912 desa/kelurahan. Demak (`ID3321`) 249, Kota Semarang (`ID3374`) 177. Bedono `ID3321040015` dan Timbulsloko `ID3321040016` ada. Saring pakai kode, karena nama "Semarang" juga dipakai Kabupaten Semarang (`ID3322`). `idn_admin4.shp` 183 MB terkompresi |
| Peta dasar citra | [EOX Sentinel-2 cloudless](https://s2maps.eu), WMTS tanpa kunci API | ±10 m | Tahun 2018–2025: CC BY-NC-SA 4.0 (INTEL non-komersial, jadi boleh). 2016: CC BY 4.0. Wajib atribusi "Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH" | ✅ Dipilih |
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
Surut Harian(t)     = Surut Harian(2026)     + Kenaikan Muka Laut × (t − 2026)

Tahun Rob      = tahun pertama saat Tinggi Tanah(t) < Pasang Tertinggi(t)
Tahun Terendam = tahun pertama saat Tinggi Tanah(t) < Pasang Harian(t)
Tahun Hilang ke Laut = tahun pertama saat Tinggi Tanah(t) < Surut Harian(t)
```

- Rumus di atas berlaku untuk Masa Perkiraan. Untuk Masa Terukur (2015 sampai tahun Rilis Data), `Laju Penurunan × (t − t0)` diganti dengan penurunan kumulatif yang benar-benar terukur di deret waktu InSAR pada tahun `t`, dan Pasang memakai data pasang tahun itu.
- Pasang Tertinggi dan Pasang Harian dihitung dari data pasang per jam beberapa tahun terakhir: Pasang Tertinggi = pasang tertinggi tahunan rata-rata (tanpa badai), Pasang Harian = rata-rata pasang tinggi harian.
- Peta punya tiga pilihan tingkat: Rob (Pasang Tertinggi, bawaan), Terendam (Pasang Harian), Hilang ke Laut (Surut Harian). Kartu titik menampilkan ketiganya. Dari stasiun Semarang: Pasang Tertinggi +0,65 m, Pasang Harian +0,34 m, Surut Harian −0,31 m terhadap muka laut rata-rata.

- Laju Penurunan dari InSAR diukur searah pandang satelit. v1 menganggap gerakan tanah hanya vertikal. Kalau data orbit naik dan turun tersedia, gabungkan keduanya.

### 2.1 Datum Vertikal

Semua tinggi harus diukur dari acuan yang sama: **rata-rata muka laut (MSL) di pesisir Semarang**. Ada tiga jebakan:

1. **DeltaDTM mengukur dari geoid EGM2008, bukan dari muka laut.** Di perairan Indonesia muka laut rata-rata 0,5–1,2 m di atas EGM2008 ([ITB](https://lppm.itb.ac.id/?p=48618)). Kalau tidak dikoreksi, semua Tinggi Tanah kebaca terlalu tinggi.
   **Koreksi**: `Tinggi Tanah (dari MSL) = DeltaDTM − 0,75 m`. Angka 0,75 m (±0,04) adalah muka laut di depan Semarang di atas EGM2008, dari 7 lintasan ICESat-2 2019–2025 yang masing-masing dikoreksi dengan tinggi pasang saat itu dari stasiun IOC `sema`. DTU22 MDT memberi 1,008 m, tapi diukur dari geoid XGM2019e, bukan EGM2008. Selisih 0,26 m itulah yang membuat hitungan pertama terlalu pesimis.
2. **Stasiun pasang ikut turun bersama tanah, dan datumnya pernah berubah.** Stasiun `sema` dipasang ulang lebih tinggi (catatan IOC: "Re-Installation, same location, but elevated"). Nilai mentahnya sekitar 1,2 m di 2015 dan -4,2 m di 2026, jadi angka mentah tidak bisa dipakai.
   **Koreksi**: sensor ini sering bergeser level, bukan cuma waktu dipasang ulang. Jadi tinggi pasang dihitung **di atas muka laut rata-rata setempat**, yaitu median berjalan 31 hari, tanpa melewati lompatan level. Hari dengan rentang pasang tidak wajar (di bawah 0,2 m atau di atas 2 m) dibuang. Pasang Harian = rata-rata air tinggi harian. Pasang Tertinggi = air tinggi harian tertinggi dalam setahun, dirata-rata antar tahun. Keterbatasan: jendela 31 hari juga menghapus siklus musiman muka laut (±10–15 cm), jadi Pasang Tertinggi sedikit terlalu rendah.
3. **Tahun acuan DeltaDTM (`t0`) tidak tunggal.** Bentuk permukaannya dari CopernicusDEM 2012–2015, lalu dikoreksi titik lidar ICESat-2 dan GEDI 2018–2023. Di tanah yang turun 10 cm/tahun, beda 5 tahun = 50 cm.
   **Hasil (19 Okt 2026)**: dibandingkan dengan 1.604 titik tanah ICESat-2 bertanggal di Sayung–Genuk (laju ≥ 5 cm/tahun), DeltaDTM paling cocok dengan keadaan tanah tahun **±2021** (median 2021,4; dari data 2019: 2021,9; dari data 2020: 2021,0). Dipakai `t0 = 2021`. Kalau DeltaDTM dari 2012–2015, ia akan ±0,6 m lebih tinggi dari ICESat-2 2019–2020, dan itu tidak terjadi.

### 2.2 Skenario
- **Skenario Lanjut**: Laju Penurunan tetap sama setiap tahun.
- **Skenario Henti**: pengambilan air tanah dihentikan mulai 2027, Laju Penurunan menyusut linear sampai nol dalam `HENTI_TAHUN` tahun. Nilai `HENTI_TAHUN = 10`, dari Tokyo: setelah pengambilan air tanah dibatasi mulai awal 1960-an, penurunan tanah berhenti sekitar 10 tahun kemudian ([PIAHS 2015](https://piahs.copernicus.org/articles/372/485/2015/piahs-372-485-2015.pdf), [JICA](https://www.jica.go.jp/english/activities/issues/water/n_files/theme_slides_07.pdf)). Ini skenario optimis. Bangkok, yang mengatur air tanah sejak 1977, sampai sekarang masih turun walau jauh lebih pelan, karena pengaturannya baru efektif setelah ada pasokan air PAM pengganti. Halaman Tentang harus menyebut bahwa Skenario Henti mengikuti kasus Tokyo.

### 2.3 Celah Data InSAR

Satelit radar C-band gagal mengukur sawah, tambak, dan air. Pada run pertama baru 25% daratan di bawah 3 m yang terukur. Titik daratan tanpa data diisi dengan **rata-rata Laju Penurunan titik terukur dalam ±1 km** (±12 piksel), asalkan ada minimal 10 tetangga terukur. Simpangan bakunya = simpangan baku tetangga + sebaran nilai mereka, jadi Rentang Tahun titik isian otomatis lebih lebar. Titik isian ditandai `filled`, dan kartu titik menulis "diperkirakan dari titik terukur dalam ±1 km". Laut tidak pernah diisi. Ini interpolasi sederhana, bukan ML (ADR-0002).

## 3. Ketidakpastian

### 3.1 Sumbernya
- Tinggi Tanah: galat rata-rata DeltaDTM di Indonesia 0,50 m (MAE), RMSE 0,67 m. Dipakai `DEM_SIGMA = 0,50`.
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
