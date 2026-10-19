# INTEL - Aturan Inti Proyek

**Kamu sedang mengerjakan INTEL: peta web yang memperkirakan kapan pesisir utara Jawa berada di bawah Pasang Tertinggi.**
Pengunjung mencari alamatnya, menggeser tahun, dan melihat Area Bawah Pasang meluas. Semua angka berasal dari data satelit dan data pasang yang bisa dicek ulang.
**Ikuti aturan ini di seluruh proyek.**

## Dokumen Konteks
Baca sebelum mengambil keputusan desain atau memulai tugas:
- **`GLOSSARY.md`**: bahasa domain. Pakai istilahnya di docs, teks tampilan, dan commit.
- **`docs/PRD.md`**: sumber kebenaran untuk ruang lingkup dan kebutuhan.
- **`docs/ARCHITECTURE.md`**: susunan folder, pipeline data, web, penyimpanan, deploy.
- **`docs/DATA.md`**: sumber data, lisensi, rumus, jadwal pembaruan.
- **`docs/DESIGN.md`**: warna peta, label, aturan kejujuran tampilan.
- **`docs/USERFLOW.md`**: apa yang bisa dilakukan Pengunjung dan Peliput.
- **`docs/TODO.md`**: daftar tugas aktif. Kerjakan hanya tugas di blok ACTIVE.
- **`docs/adr/`**: keputusan yang disengaja. Jangan dibalik tanpa ADR baru yang menggantikannya.

## 1. Stack
- **Pipeline**: Python 3 di `pipeline/`. Mengolah data mentah menjadi file statis. Tidak pernah jalan saat Pengunjung membuka situs.
- **Web**: Vite + TypeScript (strict), tanpa framework UI. Peta pakai MapLibre GL JS, data peta dalam PMTiles.
- **Tanpa server, tanpa database** (lihat ADR-0001). Kalau sebuah fitur butuh menulis data dari Pengunjung, berhenti dan tanya pemilik.
- **Hosting**: Vercel, deploy otomatis tiap push. Otomasi pipeline: GitHub Actions (terjadwal, tanpa campur tangan pemilik). Arsip Rilis Data: GitHub Releases.
- **Dependensi**: tanya pemilik sebelum menambah dependensi web selain `maplibre-gl`, `pmtiles`, `vite`, `typescript`.

## 2. Aturan Data
- Setiap angka di layar harus bisa ditelusuri ke sumber di `docs/DATA.md`. Tidak ada angka karangan atau angka contoh di build produksi.
- Setiap lapisan peta menampilkan tanggal "diperbarui".
- Prediksi adalah hitungan fisika, bukan ML (lihat ADR-0002). Jangan menambahkan model terlatih tanpa ADR baru.
- Data mentah satelit tidak disimpan di repo. Hasil olah besar masuk GitHub Releases, bukan git.
- Patuhi lisensi tiap dataset dan cantumkan atribusinya di halaman Tentang.

## 3. Aturan Kejujuran Tampilan
- Tulis "di bawah Pasang Tertinggi", jangan "tenggelam" (lihat ADR-0003). Kata "tenggelam" hanya boleh muncul sebagai pertanyaan di tagline.
- Tahun selalu ditampilkan sebagai Rentang Tahun, tidak pernah satu angka.
- Tanggul ditampilkan sebagai garis informasi. Jangan menyiratkan bahwa area di belakang Tanggul aman atau pasti tergenang.

## 4. Alur Kerja & Ruang Lingkup
- **Ikuti TODO.md**: kerjakan hanya blok ACTIVE. Jangan membangun fitur dari blok berikutnya lebih awal.
- **Cara paling sederhana yang jalan**: tanpa abstraksi spekulatif, konfigurasi, atau sistem plugin. Satu skrip per langkah pipeline.
- **Tumbuh berlapis**: setiap blok berakhir dengan sesuatu yang bisa dibuka atau dijalankan. Jangan mulai blok berikutnya selama checkpoint gagal.
- **Uji Mundur dulu**: v1 tidak boleh dirilis sebelum Uji Mundur Sayung lulus (lihat `docs/PRD.md` §5).
- **Ponsel adalah target utama**: setiap interaksi harus bisa dengan satu ketukan. Tidak ada UI yang hanya bisa di-hover.

## 5. Penamaan di Kode
Kode, nama file, dan nama variabel memakai bahasa Inggris. Teks tampilan dan docs memakai Bahasa Indonesia. Padanan istilah:

| Glossary | Kode |
|---|---|
| Tinggi Tanah | `elevation` |
| Laju Penurunan | `subsidenceRate` |
| Pasang Tertinggi | `highestTide` |
| Pasang Harian | `dailyHighTide` |
| Kenaikan Muka Laut | `seaLevelRise` |
| Tahun Rob | `robYear` |
| Tahun Terendam | `floodedYear` |
| Rentang Tahun | `robYearMin`/`robYearMax`, `floodedYearMin`/`floodedYearMax` |
| Area Bawah Pasang | `belowTide` |
| Skenario Lanjut / Henti | `scenario: "continue" \| "stop"` |
| Rilis Data | `release` |

## 6. Memverifikasi Pekerjaan
- Pipeline: setiap skrip dengan logika hitung punya satu cek `*_check.py` yang bisa dijalankan langsung (`python pipeline/x_check.py`).
- Web: jalankan `npm run dev`, cek di ukuran desktop dan ponsel (375×812). Jalankan `npm run build` sebelum menandai tugas selesai. Error TypeScript memblokir tugas.
