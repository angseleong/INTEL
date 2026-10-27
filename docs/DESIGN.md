---
name: INTEL
description: Peta kapan pesisir utara Jawa berada di bawah Pasang Tertinggi, dari data satelit.
colors:
  night: "#050b10"
  night-sky: "#060c12"
  night-panel: "#07121a"
  glass: "rgba(14,28,38,0.55)"
  glass-map: "rgba(8,18,26,0.6)"
  hairline: "rgba(200,225,235,0.10)"
  foam: "#eef3f2"
  mist: "#d5e0e2"
  haze: "#b3c2c6"
  driftwood: "#8ea1a8"
  tidewrack: "#9fb8c0"
  moonlight: "#f3ead2"
  moon-gold: "#f2cf8a"
  ink: "#06121a"
  tide-glow: "#3cf0d0"
  tide-deep: "#1f8bff"
  sea-real: "#061b26"
  water-real: "#0a2633"
typography:
  display:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(88px, 17vw, 250px)"
    fontWeight: 600
    lineHeight: 0.86
    letterSpacing: "-0.055em"
  headline:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(44px, 6vw, 104px)"
    fontWeight: 300
    lineHeight: 0.96
    letterSpacing: "-0.05em"
  number:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(44px, 7vw, 112px)"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.045em"
    fontFeature: "tnum"
  title:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(24px, 3vw, 40px)"
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 300
    lineHeight: 1.6
  label:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.14em"
  caption:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 300
    lineHeight: 1.5
rounded:
  inner: "20px"
  panel: "24px"
  card: "28px"
  photo: "32px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "36px"
  2xl: "64px"
  section: "120px"
components:
  button-primary:
    backgroundColor: "{colors.moonlight}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.mist}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 16px"
  chip-covered:
    backgroundColor: "{colors.moonlight}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "46px"
  chip-uncovered:
    backgroundColor: "transparent"
    textColor: "{colors.haze}"
    rounded: "{rounded.pill}"
    height: "46px"
  panel-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.foam}"
    rounded: "{rounded.card}"
    padding: "32px"
  map-control:
    backgroundColor: "{colors.glass-map}"
    textColor: "{colors.foam}"
    rounded: "{rounded.pill}"
    height: "44px"
  point-card:
    backgroundColor: "{colors.night-panel}"
    textColor: "{colors.foam}"
    rounded: "{rounded.panel}"
    padding: "24px"
---

# Design System: INTEL

> Ditulis ulang 27 Okt 2026 untuk Blok 7 (ADR-0007, ADR-0008). Gaya "void" yang lama sudah pensiun. Acuan visual: canvas mockup "INTEL Mockup Gaya Baru" (Beranda, Peta, Upaya, Peliput, Tentang, dan Prototipe Air).

## Overview

**Creative North Star: "Laut Malam"**

INTEL adalah malam di pesisir Demak–Semarang. Laut gelap, diterangi cahaya bulan. Pengunjung pertama kali melihat huruf INTEL berdiri di atas laut yang bisa disentuh, lalu air naik menenggelamkannya saat halaman digulir. Setelah itu seluruh situs tetap berada di malam yang sama: latar biru laut yang sangat gelap, panel kaca yang buram, tombol berwarna krem cahaya bulan.

Yang menyala hanya dua hal: **cahaya bulan** untuk aksi dan angka penting, dan **toska bercahaya** untuk data perkiraan. Tenang dan bisa dipercaya, bukan film bencana. Kalau ragu antara dramatis dan jujur, pilih jujur.

Ditolak dengan sengaja: gradien neon di tombol (terasa template AI), merah dan warna alarm, air realistis untuk daerah yang belum tentu tergenang, dan latar hitam polos tanpa suasana.

**Key Characteristics:**
- Satu malam yang sama dari halaman pembuka sampai halaman Peliput.
- Laut WebGL realistis hanya untuk air sungguhan.
- Krem cahaya bulan adalah satu-satunya warna aksi.
- Toska bercahaya hanya untuk data perkiraan.
- Satu keluarga huruf (Sora), hierarki dari ukuran dan tracking, bukan ketebalan.

## Colors

Biru laut malam yang hampir hitam, teks putih kebiruan, satu aksen krem cahaya bulan, dan satu warna data toska.

### Primary
- **Cahaya Bulan** (`#f3ead2`): tombol aksi utama ("Cek", "Cek lokasimu", Play), chip kota yang sudah tercakup, pilihan aktif (Lanjut/Henti, Rob/Pasang harian, menu aktif), pegangan slider, titik di logo. Teks di atasnya selalu Tinta `#06121a`.
- **Emas Bulan** (`#f2cf8a`): angka besar (Rentang Tahun, 55 juta, 266 KK), garis pantai tahun terpilih, titik ukur yang turun cepat di Konstelasi Titik.

### Tertiary (hanya data)
- **Toska Pasang** (`#3cf0d0`) → **Biru Dalam** (`#1f8bff`): gradien Area Bawah Pasang dan semua yang mewakili Skenario Lanjut di grafik. Tidak pernah untuk tombol atau hiasan.

### Neutral
- **Malam** (`#050b10`): latar halaman.
- **Langit Malam** (`#060c12`): langit di atas laut halaman pembuka.
- **Panel Malam** (`#07121a`): panel samping peta dan kartu titik.
- **Kaca** (`rgba(14,28,38,0.55)`) dan **Kaca Peta** (`rgba(8,18,26,0.6)` + blur 18px): panel di atas latar dan di atas peta.
- **Garis Rambut** (`rgba(200,225,235,0.10)`): tepi panel dan pemisah.
- **Buih** (`#eef3f2`): teks utama. **Kabut** (`#d5e0e2`): teks badan. **Halimun** (`#b3c2c6`): teks sekunder. **Kayu Apung** (`#8ea1a8`): keterangan sumber. **Sampah Pasang** (`#9fb8c0`): label kecil kapital.
- **Laut Sungguhan** (`#061b26`) dan **Air Nyata** (`#0a2633`): warna dasar air realistis di peta, sebelum shader menambah ombak dan kilau.

### Named Rules
**The Moonlight Rule.** Krem Cahaya Bulan hanya untuk aksi dan pilihan aktif. Kalau sesuatu berwarna krem, itu bisa diketuk.

**The Data Glow Rule.** Toska–biru hanya untuk data perkiraan. Tombol, ikon, garis hiasan, dan latar tidak pernah toska.

**The No Alarm Rule.** Tidak ada merah, oranye peringatan, atau gradien di komponen UI. Gradien hanya di data (Area Bawah Pasang) dan di gelap foto.

## Typography

**Display Font:** Sora (dengan `system-ui`), variable, lisensi OFL, di-self-host sebagai satu file `woff2` di `public/fonts/`.

**Character:** geometris dan ringan. Huruf besar tipis (300) terasa tenang, judul INTEL tebal (600) terasa kokoh berdiri di atas air.

### Hierarchy
- **Display** (600, `clamp(88px, 17vw, 250px)`, 0.86): hanya kata INTEL di halaman pembuka, digambar di dalam laut WebGL. Selalu ada `<h1>` tersembunyi untuk pembaca layar.
- **Headline** (300, `clamp(44px, 6vw, 104px)`, 0.96, -0.05em): judul halaman Upaya, Peliput, Tentang.
- **Number** (300, `clamp(44px, 7vw, 112px)`, -0.045em, `tabular-nums`): Rentang Tahun dan angka besar, berwarna Emas Bulan.
- **Lead** (300, `clamp(24px, 3vw, 40px)`, 1.2): kalimat cerita di halaman pembuka.
- **Title** (400–500, 26px): nama Kelurahan, judul kartu upaya.
- **Body** (300, 15–17px, 1.6, maks. 65ch): paragraf.
- **Label** (400, 12px, 0.14em, KAPITAL, Sampah Pasang): "MASALAHNYA", "KELURAHAN", "TINGKAT".
- **Caption** (300, 11–12px, Kayu Apung): "Data: Sentinel-1 InSAR, diperbarui …".

### Named Rules
**The Light Weight Rule.** Hierarki datang dari ukuran dan tracking. Teks badan berat 300, tidak pernah 200 (terlalu tipis di ponsel di luar ruangan). Hanya Display yang tebal.

**The Steady Numbers Rule.** Semua angka memakai `tabular-nums` supaya tahun di slider tidak bergoyang.

## Layout

- **Ponsel dulu.** Lebar acuan 375–390px. Setiap interaksi bisa dengan satu ketukan, area ketuk minimal 44×44px.
- Konten halaman teks di kolom maksimal 1200px dengan gutter 24px. Bagian dipisah jarak (120px di desktop, 64px di ponsel), bukan garis.
- Pola dua kolom asimetris di desktop: judul atau angka di kiri, teks di kanan. Di ponsel menumpuk.
- **Halaman pembuka**: laut WebGL setinggi satu layar ditahan (sticky) selama dua layar gulir. Air naik dan layar menggelap, lalu bagian "Masalahnya" naik dari bawah. Ujung bawah laut memudar ke warna Malam supaya tidak ada sambungan.
- **Peta**: peta penuh layar. Di ponsel kartu titik naik dari bawah sebagai lembar. Di desktop kartu titik di panel kanan 360–380px. Slider tahun dan Play menempel di bawah peta.

## Elevation & Depth

Kedalaman dari kaca dan cahaya, bukan bayangan. Panel di atas peta dan foto memakai Kaca + `backdrop-filter: blur(18px)` + Garis Rambut. Tidak ada `box-shadow` gelap.

Satu-satunya "bayangan" adalah pendar cahaya bulan: `box-shadow: 0 0 32px rgba(243,234,210,0.18)` di tombol utama besar dan `0 0 12px rgba(243,234,210,0.6)` di titik logo.

### Named Rules
**The Glass Over Light Rule.** Panel buram hanya di atas sesuatu yang bergerak atau bercahaya (laut, peta, foto). Di atas latar Malam polos, panel memakai Kaca tanpa blur.

## Shapes

- Tombol, chip, kontrol peta, dan kolom cari: pil (`9999px`).
- Panel dan kartu: 24–28px. Isi di dalam kartu: 20px. Foto cerita: 32px.
- Garis tepi hanya Garis Rambut 1px. Tidak ada garis tebal atau garis kiri berwarna.

## Components

- **Tombol utama**: pil Cahaya Bulan, teks Tinta 14–16px berat 500, tinggi 52–56px. Satu per tampilan.
- **Tombol hantu**: transparan, tepi Garis Rambut, teks Kabut. Untuk aksi sekunder (Bandingkan, Cara menghitung).
- **Pilihan segmen** (Lanjut/Henti, Beranda/Peta): wadah `rgba(200,225,235,0.06)` pil, pilihan aktif Cahaya Bulan.
- **Chip kota**: tercakup = Cahaya Bulan, bisa diketuk. Belum tercakup = tepi Garis Rambut + teks Halimun + "belum tercakup".
- **Kolom cari**: pil Kaca 52–60px, ikon kaca pembesar Kabut, tombol "Cek" Cahaya Bulan di dalamnya.
- **Slider tahun**: jalur 4px `rgba(200,225,235,0.18)`, bagian terlewati Cahaya Bulan, pegangan bulat Cahaya Bulan 22px dengan pendar. Tahun 30px berat 300 di sampingnya, label "perkiraan" atau "terukur" di bawahnya.
- **Kartu titik**: label KELURAHAN → nama (30px) → kecamatan → pilihan Skenario → kotak Rentang Tahun Emas Bulan → dua kotak kecil (persen 2050, Laju Penurunan) → Tingkat → keterangan sumber.
- **Panel kaca**: Kaca, radius 28px, padding 32–36px. Untuk angka besar, kartu upaya, cara membaca peta.
- **Banner pasang**: pil Kaca Peta, titik Emas Bulan, "Pasang tinggi minggu ini" + waktu + tinggi.

## Do's and Don'ts

- **Do** tulis "di bawah Pasang Tertinggi". **Don't** tulis "tenggelam", kecuali tagline "Indonesia Tenggelam?" yang berupa pertanyaan (ADR-0003).
- **Do** tampilkan tahun sebagai Rentang Tahun ("±2032–2041"). **Don't** tampilkan satu angka tahun.
- **Do** gambar laut dan Air Nyata realistis. **Don't** gambar Area Bawah Pasang seperti air sungguhan (ADR-0008).
- **Do** pakai Cahaya Bulan untuk satu aksi utama per tampilan. **Don't** pakai gradien neon, toska, atau biru di tombol.
- **Do** tampilkan Tanggul sebagai garis informasi. **Don't** siratkan bahwa area di belakangnya aman atau pasti tergenang.
- **Do** beri setiap kartu dan legenda baris "Data: <sumber>, diperbarui <tanggal>". **Don't** tampilkan angka contoh di build produksi.
- **Don't** pakai merah, ikon peringatan, atau efek gemetar.

---

## Laut WebGL

Satu modul shader dipakai di tiga tempat. Ditulis sendiri dengan WebGL 1, tanpa three.js (ADR-0007). Acuan: artboard "Prototipe Air" di canvas mockup.

| Tempat | Pandangan | Isi |
|---|---|---|
| Halaman pembuka | Perspektif ke cakrawala | Huruf INTEL dan bulan memantul di laut. Air dekat garis air tenang (pantulan bersih), makin dekat ke Pengunjung makin berombak. Bagian huruf di bawah air terlihat samar. |
| Peta | Dari atas | Laut dan Air Nyata berombak dengan kilau kecil, mengikuti bentuk poligon. |
| Halaman Upaya | Perspektif, diam | Potongan laut kecil di blok "Berhenti menyedot air tanah", tanpa sentuhan. |

- **Ombak**: 8 gelombang berarah, panjang gelombang menurun, kecepatan mengikuti rumus laut dalam. Gelombang yang lebih kecil dari ±3px di layar dipudarkan supaya tidak berkedip.
- **Sentuhan**: simulasi riak di grid kecil (±96×208 sel), dua langkah per frame. Ketuk = riak, geser ke samping = jejak ombak, geser ke atas/bawah = gulir halaman (`touch-action: pan-y`). Di desktop kursor membuat riak kecil. Di halaman pembuka sel grid dua kali lebih lebar dari tingginya, supaya riak terlihat pipih seperti dilihat dari samping.
- **Peta**: ketuk titik → satu cincin riak keluar dari titik itu, sekaligus jadi tanda titik terpilih.
- **Cadangan**: `prefers-reduced-motion` → air diam, tanpa riak. WebGL gagal → gradien statis. Tab tersembunyi atau laut di luar layar → berhenti menggambar.
- **Anggaran**: 60 fps di ponsel kelas menengah, piksel dibatasi `devicePixelRatio ≤ 2`.

## Lapisan Peta

| Lapisan | Gaya |
|---|---|
| Peta dasar | Citra satelit EOX, digelapkan dan dikurangi warnanya supaya data menyala |
| Laut dan Air Nyata 2025 | Air realistis (Laut WebGL, dari atas). Legenda: "Air sungguhan (foto satelit 2025)" |
| Area Bawah Pasang | Gradien Toska Pasang → Biru Dalam, transparan ±35%, pendar lembut, kilau pelan. Tanpa garis tepi |
| Garis Pantai tahun ini | Buih, 1,6px |
| Garis Pantai tahun terpilih | Emas Bulan, titik-titik bulat |
| Tanggul | Halimun, 2,5px, putus-putus |
| Titik ukur (zoom ≥ 14) | Titik 2px Kabut, opasitas 30% |
| Titik terpilih | Lingkaran Cahaya Bulan 10px + lingkaran pendar 30px + cincin riak |

## Gerak

Animasi menunjukkan perubahan waktu atau menanggapi sentuhan, bukan hiasan.

| # | Di mana | Apa yang bergerak |
|---|---|---|
| B1 | Halaman pembuka | Air naik mengikuti gulir sampai INTEL tenggelam, lalu layar menggelap ke warna Malam |
| B2 | Halaman pembuka | Teks "Tanah turun beberapa cm tiap tahun" muncul di tengah gulir, lalu hilang |
| B3 | Cerita kota | Foto muncul pelan dan sedikit membesar. Geser sebelum/sesudah 2017 vs 2025 |
| B4 | Bagian "Masalahnya" | Peta Indonesia terbang antar kota, titik kota menyala satu per satu (Emas Bulan), angka menghitung naik |
| A1 | Pembuka peta (kunjungan pertama) | Peta terbuka di 2015 lalu berjalan sampai tahun ini, berhenti dengan "Ini yang sudah terjadi". Bisa dilewati dengan satu ketukan. Menunggu Masa Terukur |
| A2 | Slider & Play | Area Bawah Pasang meluas, garis pantai tahun terpilih bergeser. 300ms per tahun |
| A3 | Garis Pantai Masa Perkiraan | Titik-titik garis pelan-pelan berjalan, tanda ini perkiraan, bukan hasil ukur. Loop 2 dtk |
| A4 | Pencarian | Peta terbang ke alamat (`flyTo`, 1,2 dtk) |
| A5 | Ketuk titik | Cincin riak dari titik, kartu naik dari bawah, Rentang Tahun menghitung naik |
| A6 | Ganti Skenario | Area Bawah Pasang berubah bentuk dengan pudar silang, angka menghitung ke nilai baru |
| A7 | Geser bandingkan | Pembatas mengikuti jari tanpa jeda. Saat dibuka, pembatas meluncur dari kanan ke tengah (400ms) |
| A8 | Hero Tentang | Konstelasi Titik: titik ukur InSAR asli turun sesuai Laju Penurunan masing-masing, tahun berjalan 2015 → 2050 |
| A9 | Halaman teks | Setiap bagian muncul pelan (naik 12px + pudar) saat digulir ke layar |

- Kurva `cubic-bezier(0.2, 0.7, 0.2, 1)`. Durasi 150 / 300 / 600ms.
- Animasi DOM hanya `opacity` dan `transform`. Animasi gulir (B1–B3) pakai GSAP + ScrollTrigger (ADR-0006).
- `prefers-reduced-motion`: B1 jadi pergantian per bagian tanpa air bergerak, A1/A3/A8/A9/B2/B3/B4 mati, A2/A5/A6 langsung lompat, A4 jadi `jumpTo`.
- A1 hanya sekali per perangkat, diingat di `localStorage` (dibungkus `try/catch`). Link dengan hash langsung membuka keadaan di hash, tanpa halaman pembuka dan tanpa A1.

## Bahasa di Layar

- Pakai istilah `GLOSSARY.md`. Untuk awam boleh ditambah penjelasan pendek, misalnya "Laju Penurunan (seberapa cepat tanah turun)".
- Jangan menulis "tenggelam", "hilang", atau "kiamat" di kartu, legenda, dan petunjuk.
- Setiap kartu dan legenda punya baris "Data: <sumber>, diperbarui <tanggal>".

## Aksesibilitas

- Kontras teks minimal 4,5:1 di atas Malam: Buih, Kabut, Halimun, Kayu Apung, dan Sampah Pasang semuanya lolos. Teks di atas Cahaya Bulan selalu Tinta.
- Huruf INTEL di kanvas laut selalu punya `<h1>` tersembunyi. Laut diberi `aria-hidden`.
- Slider bisa digeser dengan tombol panah dan dibacakan ("Tahun 2035, perkiraan").
- Informasi tidak hanya lewat warna: kartu selalu menulis angkanya, legenda selalu punya teks.

## Foto

- Sumber: Wikimedia Commons berlisensi CC dan foto milik pemilik proyek. Tidak mengambil foto media berita atau LSM tanpa izin tertulis.
- Setiap foto punya keterangan: tempat, tahun, fotografer, lisensi.
- Foto didinginkan supaya senada dengan malam: `saturate(0.8) brightness(0.85)` + lapisan `rgba(8,26,40,0.28)` + gradasi ke Malam di sepertiga bawah.
- Format `webp`, lebar maksimal 1600px, `loading="lazy"` kecuali foto pertama.

## Logo

Sementara: titik Cahaya Bulan berpendar + wordmark "INTEL" 14–15px berat 600, tracking 0.08em. Logo pulau Jawa yang terpotong garis air (versi lama) ditinjau ulang di Blok 7.
