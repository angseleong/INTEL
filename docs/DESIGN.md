# INTEL — Aturan Desain

> Titik-titik ukur yang melayang di atas laut malam.

## 1. Filosofi
Panggung hitam pekat. Peta satelit dan data adalah satu-satunya yang menyala. Ini diadaptasi dari gaya "void" (referensi: Dala, Linear, Vercel): latar hitam murni, satu warna aksi, satu warna sorot, tipografi besar yang ringan, tanpa kartu bergaris atau bayangan.

Tetap tenang dan bisa dipercaya, bukan film bencana. Gelap di sini artinya fokus, bukan seram. Kalau ragu antara dramatis dan jujur, pilih jujur.

### 1.1 Halaman Pembuka: makin dalam makin gelap
Halaman pembuka bercerita lewat warna latar. Awalnya terang seperti langit di atas daratan. Tiap kali digeser, latar bergeser pelan ke biru tua, seolah Pengunjung ikut turun ke bawah air. Peta yang void gelap di akhir terasa seperti dasar laut.

- Gradien latar dikendalikan posisi scroll, dari Langit `#dfe9ef` → Laut Dalam `#0b2a4a` → Void `#000000`. Ini satu-satunya gradien di luar logo.
- Teks di bagian terang memakai Void. Begitu latar cukup gelap, teks berganti ke Tulang. Kontras teks tetap minimal 4,5:1 di setiap titik gradien.
- Foto ditampilkan full layar dengan gradasi gelap di bagian bawah supaya teks Tulang terbaca (§13).
- Pilihan lain yang ditolak: void gelap dari awal (dingin, kurang manusiawi untuk foto warga), dokumenter terang ala long-read (kurang terasa "pelan-pelan tenggelam"), foto hitam-putih dengan warna alarm (terasa menakut-nakuti).

## 2. Warna

| Nama | Nilai | Token | Peran |
|---|---|---|---|
| Void | `#000000` | `--color-void` | Latar halaman, panel di atas peta. Hitam murni, bukan abu gelap |
| Tulang | `#ffffff` | `--color-bone` | Judul, teks utama, Garis Pantai tahun ini |
| Abu | `#9a9a9a` | `--color-ash` | Teks sekunder, link hantu, label nonaktif, Tanggul |
| Kabut | `#bdbdbd` | `--color-mist` | Teks pendukung, keterangan sumber data |
| Biru Pasang | `#1f6bff` | `--color-tide` | **Satu-satunya** warna tombol terisi (Play, Bandingkan). Teks putih di atasnya 4,56:1 |
| Air | `#4da3ff` | `--color-water` | Area Bawah Pasang (opasitas 45%). Hanya untuk data, tidak pernah untuk tombol |
| Laut Pasang | `#123f86` | `--color-sea` | Air Nyata dari foto satelit. Hanya untuk data |
| Sorot | `#ffb829` | `--color-spark` | Garis Pantai tahun terpilih, angka Rentang Tahun, label kecil kapital. 12,1:1 di atas hitam |
| Laut Dalam | `#0b2a4a` | `--color-deep` | Ujung gradien logo dan titik tengah gradien halaman pembuka |
| Langit | `#dfe9ef` | `--color-sky` | Awal gradien halaman pembuka saja |

Aturan:
- Biru Pasang hanya untuk tombol aksi utama, satu per tampilan. Air hanya untuk data. Keduanya sengaja beda terang supaya tombol tidak terbaca sebagai data.
- Tidak ada merah. Tidak ada gradien di komponen UI. Gradien hanya di logo dan latar halaman pembuka (§1.1).
- Link berwarna Sorot atau Tulang, tidak pernah biru bawaan browser.

## 3. Lapisan Peta

| Lapisan | Gaya |
|---|---|
| Peta dasar | Citra satelit, digelapkan 20% supaya data menyala |
| Area Bawah Pasang | Air `#4da3ff`, opasitas 45%, tanpa garis tepi |
| Air Nyata 2025 | Laut Pasang `#123f86`, opasitas 90%, di atas Area Bawah Pasang. Legenda: "Sudah jadi air menurut foto satelit 2025, termasuk tambak" |
| Garis Pantai tahun ini | Tulang, 2 px |
| Garis Pantai tahun terpilih | Sorot, 2 px. **Garis penuh** di Masa Terukur, **putus-putus** di Masa Perkiraan |
| Tanggul | Abu, 2 px, putus-putus |
| Titik ukur (zoom ≥ 14) | Titik 2 px Kabut, opasitas 30%. Menunjukkan di mana satelit benar-benar mengukur |
| Titik terpilih | Lingkaran Tulang 12 px, tanpa isi |

## 4. Tipografi

**Inter** (variable, lisensi OFL), di-self-host sebagai satu file `woff2` di `public/fonts/`. Satu keluarga huruf untuk semua. Fallback: `system-ui`.

Seperti referensi, hierarki datang dari **ukuran dan tracking, bukan ketebalan**. Judul tidak pernah tebal.

| Peran | Ukuran | Berat | Line height | Tracking | Dipakai di |
|---|---|---|---|---|---|
| Display | 96px (desktop) / 48px (ponsel) | 400 | 1.0 | -0.04em | Hero halaman Tentang |
| Angka besar | 42px / 36px | 400 | 1.0 | -0.04em | Rentang Tahun di kartu titik, berwarna Sorot |
| Judul | 27px | 400 | 1.1 | -0.02em | Nama Kelurahan di kartu, judul halaman Peliput |
| Badan | 16px | 300 | 1.5 | normal | Paragraf di halaman Tentang |
| UI | 15px | 400 | 1.3 | normal | Isi kartu, tabel |
| Label | 12px | 600 | 1.2 | 0.06em, KAPITAL | "TERUKUR", "PERKIRAAN", "MULAI KENA ROB" |
| Keterangan | 12px | 400 | 1.5 | normal | "Data: Sentinel-1, diperbarui …", warna Kabut |

- Badan memakai berat 300, bukan 200 seperti referensi. Berat 200 terlalu tipis untuk dibaca di ponsel di luar ruangan.
- Semua angka memakai `font-variant-numeric: tabular-nums` supaya tahun di slider tidak bergoyang.

## 5. Bentuk & Jarak
- **Unit dasar 6px.** Skala: 6, 12, 18, 24, 30, 36, 60, 96.
- **Radius 24px** untuk panel dan kartu. Tombol berbentuk pil (`9999px`).
- **Tanpa garis tepi, tanpa bayangan.** Panel di atas peta: Void dengan opasitas 85%, supaya teks terbaca di atas citra satelit tanpa harus pakai kotak bergaris.
- Area ketuk minimal 44×44 px.

## 6. Komponen

| Komponen | Bentuk |
|---|---|
| **Tombol utama** | Pil Biru Pasang, teks Tulang 14px berat 600 kapital, padding 14×18px. Satu per tampilan |
| **Tombol hantu** | Tanpa latar, teks Abu (nonaktif) atau Tulang (aktif). Untuk menu dan aksi sekunder |
| **Tombol Skenario** | Dua pil hantu berdampingan. Yang aktif: teks Tulang + garis bawah Sorot 2px. Di Masa Terukur keduanya nonaktif |
| **Slider tahun** | Jalur 4px. Bagian Masa Terukur: Tulang penuh, label "TERUKUR". Bagian Masa Perkiraan: Abu bergaris, label "PERKIRAAN". Penanda "hari ini" di batasnya. Pegangan: lingkaran Tulang 24px dengan tahun di atasnya (angka 27px) |
| **Kartu titik** | Panel Void 85%, radius 24. Label Sorot kapital → angka besar Rentang Tahun → baris UI untuk Tinggi Tanah dan Laju Penurunan → keterangan sumber |
| **Banner pasang** | Satu baris di atas peta: label "PASANG TINGGI" Sorot + waktu dalam teks Tulang |

## 7. Tata Letak

### Halaman Peta (utama)
- **Ponsel dulu.** Peta penuh layar. Logo dan menu hantu di kiri atas, langsung di atas peta. Slider dan tombol Play menempel di bawah. Kartu titik naik dari bawah sebagai lembar.
- **Desktop**: kartu titik di panel kanan selebar 380px, slider tetap di bawah.

### Halaman Pembuka
- Scrollytelling: setiap bagian setinggi satu layar (`100svh`), satu ide per layar. Urutan di `USERFLOW.md` §1.1.
- Peta Indonesia di hero dan bagian "Masalahnya" adalah satu instance MapLibre yang menempel di belakang teks. Peta pindah dengan `flyTo` antar bagian, interaksi dimatikan supaya scroll tidak tertelan.
- Chip kota: pil hantu. Yang tercakup: teks Tulang. Yang belum: teks Abu + label "BELUM TERCAKUP".
- Cerita kota: foto full layar, teks pendek di atasnya (maksimal ±40 kata per layar), satu angka besar Sorot per layar.

### Halaman Tentang & Peliput
- Latar Void penuh, lebar konten maksimal 1200px.
- Pola dua kolom asimetris seperti referensi: judul besar di kiri, teks badan di kanan, label Sorot kecil di atas teks badan. Jarak antar bagian 60–96px.
- Tabel Peliput: baris dipisah jarak, bukan garis. Header kolom memakai gaya Label.

## 8. Visual Khas: Konstelasi Titik
Pengganti "otak partikel" di referensi. Ribuan titik ukur InSAR di sepanjang pesisir Demak–Semarang, digambar sebagai titik 1–2px di atas hitam, diwarnai dari Kabut (turun pelan) sampai Sorot (turun cepat). Saat halaman Tentang dibuka, titik-titik itu pelan-pelan turun sesuai Laju Penurunan masing-masing.

- Hanya di hero halaman Tentang. Peta utama tetap peta.
- Datanya titik ukur asli dari `points.pmtiles`, bukan dekorasi acak. Ini menjaga aturan "setiap angka bisa ditelusuri".
- Mengikuti `prefers-reduced-motion`: kalau aktif, titik diam.

## 9. Animasi

Animasi dipakai untuk **menunjukkan perubahan waktu**, bukan hiasan. Setiap animasi harus menjawab "apa yang bergerak, dan kenapa".

### 9.1 Daftar

| # | Di mana | Apa yang bergerak | Durasi |
|---|---|---|---|
| A1 | Pembuka peta (kunjungan pertama) | Peta terbuka di 2015, lalu otomatis berjalan sampai tahun ini. Garis Pantai maju dan Area Bawah Pasang meluas. Berhenti di tahun ini dengan teks "Ini yang sudah terjadi". Bisa dilewati dengan satu ketukan | ±4 dtk |
| A2 | Slider & Play | Pergantian tahun: poligon tahun lama memudar keluar, tahun baru memudar masuk. Garis Pantai tahun terpilih ikut bergeser | 300 ms per tahun |
| A3 | Garis Pantai Masa Perkiraan | Garis putus-putus pelan-pelan "berjalan" (dash bergeser), menandakan ini perkiraan, bukan hasil ukur | loop 2 dtk |
| A4 | Pencarian | Peta terbang ke alamat (`flyTo` MapLibre) | 1,2 dtk |
| A5 | Ketuk titik | Cincin titik terpilih berdenyut sekali. Kartu naik dari bawah. Angka Rentang Tahun menghitung naik dari 2026 ke nilainya | 300 / 600 ms |
| A6 | Ganti Skenario | Area Bawah Pasang berubah bentuk dengan pudar silang. Angka di kartu menghitung ke nilai baru | 400 ms |
| A7 | Geser bandingkan | Pembatas mengikuti jari tanpa jeda. Saat dibuka, pembatas meluncur dari kanan ke tengah | 400 ms |
| A8 | Hero halaman Tentang | Konstelasi Titik (§8): titik ukur turun sesuai Laju Penurunan masing-masing, sambil tahun di pojok berjalan 2015 → 2050 | loop 12 dtk |
| A9 | Halaman Tentang & Peliput | Setiap bagian muncul pelan (naik 12px + pudar) saat digulir ke layar | 400 ms |
| B1 | Hero halaman pembuka | Air naik dari bawah layar mengikuti scroll sampai menutup judul INTEL. Permukaannya bergelombang pelan | ikut scroll |
| B2 | Halaman pembuka | Latar bergeser Langit → Laut Dalam → Void (§1.1) | ikut scroll |
| B3 | Bagian "Masalahnya" | Peta Indonesia `flyTo` antar kota, titik kota menyala satu per satu, angka menghitung naik | ikut scroll |
| B4 | Cerita kota | Foto muncul pelan dan sedikit membesar (zoom 1,0 → 1,05). Geser sebelum/sesudah 2017 vs 2025 | ikut scroll |
| A10 | Tombol | Ditekan: mengecil ke 0,97. Hover (desktop): terang sedikit | 150 ms |

### 9.2 Aturan Gerak
- Kurva: `cubic-bezier(0.2, 0.7, 0.2, 1)` untuk semuanya. Masuk cepat, berhenti halus.
- Token durasi: `--dur-fast: 150ms`, `--dur-base: 300ms`, `--dur-slow: 600ms`.
- Hanya animasikan `opacity` dan `transform` di DOM, dan properti cat (`fill-opacity`, `line-dasharray`) di MapLibre. Jangan animasikan ukuran atau tata letak.
- Animasi yang mengikuti scroll (B1–B4) memakai GSAP + ScrollTrigger (ADR-0006). Sisanya cukup CSS transition, Web Animations API, dan animasi bawaan MapLibre. GSAP tidak dimuat di halaman peta.
- **`prefers-reduced-motion`**: A1, A3, A8, A9, B1, B3, B4 mati. B2 langsung berganti per bagian tanpa gradien bergerak. A2, A5, A6 langsung lompat tanpa transisi. A4 jadi `jumpTo`.
- A1 hanya sekali per perangkat. Ingatannya disimpan di `localStorage` (dibungkus `try/catch`). Link dengan hash langsung membuka keadaan di hash, tanpa A1.

## 10. Logo
Peta pulau Jawa yang separuh bawahnya terpotong garis air, seperti Kolam Intel di ITB. Gradien Tulang ke Laut Dalam di bagian bawah garis air. Wordmark "INTEL" 14px berat 600, tracking 0.06em.

## 11. Bahasa di Layar
- Pakai istilah `GLOSSARY.md`. Untuk awam boleh ditambah penjelasan pendek, misalnya "Laju Penurunan (seberapa cepat tanah turun)".
- **Jangan** menulis "tenggelam", "hilang", atau "kiamat" di kartu dan legenda (ADR-0003). Tagline "Indonesia Tenggelam?" boleh karena berupa pertanyaan.
- Tahun selalu sebagai Rentang Tahun: "±2031–2035", bukan "2033".
- Setiap kartu dan legenda punya baris keterangan "Data: <sumber>, diperbarui <tanggal>".

## 12. Aksesibilitas
- Hitam dan putih sudah kontras maksimal. Warna lain dicek minimal 4,5:1 untuk teks (lihat §2).
- Slider bisa digeser dengan tombol panah keyboard dan dibacakan pembaca layar ("Tahun 2035, perkiraan").
- Informasi tidak boleh hanya disampaikan lewat warna. Kartu titik selalu menuliskan angkanya, dan Masa Terukur/Perkiraan selalu punya label teks.
- Animasi Play dan Konstelasi Titik mengikuti `prefers-reduced-motion`.

## 13. Foto
- Sumber: Wikimedia Commons berlisensi CC (CC0, CC BY, CC BY-SA) dan foto milik pemilik proyek. **Tidak** mengambil foto media berita atau LSM tanpa izin tertulis.
- Setiap foto punya keterangan kecil (gaya Keterangan): tempat, tahun, fotografer, lisensi. Daftar lengkap juga ada di halaman Tentang.
- Hanya foto kejadian nyata di tempat yang disebut. Tidak memakai foto kota lain sebagai ilustrasi.
- Wajah warga yang bisa dikenali hanya dipakai kalau fotonya dari Commons dengan izin yang jelas atau difoto sendiri dengan persetujuan.
- Full layar, `object-fit: cover`, gradasi Void 0 → 80% di sepertiga bawah. Format `webp`, lebar maksimal 1600px, dimuat `loading="lazy"` kecuali foto pertama.

## 14. Token CSS

```css
:root {
  --color-void: #000000;
  --color-bone: #ffffff;
  --color-ash: #9a9a9a;
  --color-mist: #bdbdbd;
  --color-tide: #1f6bff;
  --color-water: #4da3ff;
  --color-sea: #123f86;
  --color-spark: #ffb829;
  --color-deep: #0b2a4a;
  --color-sky: #dfe9ef;
  --panel: rgb(0 0 0 / 0.85);

  --font: "Inter", system-ui, sans-serif;

  --space-1: 6px;  --space-2: 12px; --space-3: 18px; --space-4: 24px;
  --space-5: 30px; --space-6: 36px; --space-7: 60px; --space-8: 96px;

  --radius: 24px;
  --radius-pill: 9999px;

  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
  --dur-fast: 150ms;
  --dur-base: 300ms;
  --dur-slow: 600ms;
}
```
