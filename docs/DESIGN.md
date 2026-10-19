# INTEL — Aturan Desain

## 1. Filosofi
Tenang dan bisa dipercaya, bukan menakut-nakuti. INTEL harus terasa seperti alat ukur, bukan film bencana. Kalau ragu antara dramatis dan jujur, pilih jujur.

## 2. Bahasa di Layar
- Pakai istilah `GLOSSARY.md`. Untuk awam boleh ditambah penjelasan pendek, misalnya "Laju Penurunan (seberapa cepat tanah turun)".
- **Jangan** menulis "tenggelam", "hilang", atau "kiamat" di kartu dan legenda (ADR-0003). Tagline "Indonesia Tenggelam?" boleh karena berupa pertanyaan.
- Tahun selalu sebagai Rentang Tahun: "±2031–2035", bukan "2033".
- Setiap kartu dan legenda punya baris kecil "Data: <sumber>, diperbarui <tanggal>".

## 3. Warna Peta

| Lapisan | Warna | Catatan |
|---|---|---|
| Area Bawah Pasang | Biru, opasitas 50% | Satu warna untuk tahun terpilih. Tidak pakai gradien merah |
| Garis Pantai tahun ini | Putih, 2 px | Selalu tampil |
| Garis Pantai tahun terpilih | Oranye, 2 px. **Garis penuh** di Masa Terukur, **putus-putus** di Masa Perkiraan | Kontras dengan biru dan citra satelit |
| Tanggul | Abu-abu putus-putus, 2 px | Hanya informasi |
| Titik terpilih | Lingkaran putih bertepi hitam | |

Semua warna harus terbaca di atas citra satelit, di layar terang maupun gelap. Cek kontrasnya di ponsel di bawah sinar matahari.

## 4. Tata Letak
- **Ponsel dulu.** Peta penuh layar. Slider dan tombol Play menempel di bawah. Kartu titik muncul sebagai lembar yang naik dari bawah.
- **Desktop**: kartu titik di panel kanan, slider tetap di bawah.
- Area ketuk minimal 44×44 px.
- Pilihan Skenario berupa dua tombol berdampingan, bukan dropdown, supaya keduanya selalu kelihatan. Di Masa Terukur tombolnya nonaktif, karena yang tampil hasil ukur.
- Jalur slider terbagi dua: bagian Masa Terukur warna penuh dengan label "terukur", bagian Masa Perkiraan bergaris dengan label "perkiraan". Penanda "hari ini" di batasnya.

## 5. Aksesibilitas
- Slider bisa digeser dengan tombol panah keyboard dan dibacakan pembaca layar ("Tahun 2035").
- Informasi tidak boleh hanya disampaikan lewat warna. Kartu titik selalu menuliskan angkanya.
- Animasi Play mengikuti `prefers-reduced-motion`: kalau aktif, tahun melompat tanpa transisi.

## 6. Tipografi
- Satu font sans-serif sistem (`system-ui`). Tidak memuat font web.
- Angka memakai `font-variant-numeric: tabular-nums` supaya tahun di slider tidak bergoyang.
