# INTEL

Bahasa domain untuk memperkirakan kapan daratan pesisir turun sampai di bawah laut. Istilah di sini dipakai di docs, teks tampilan, dan commit.

## Laut

**Rob**:
Banjir di pesisir karena air laut pasang naik ke darat, bukan karena hujan atau sungai.
_Hindari_: banjir laut, ombak, tsunami

**Pasang Tertinggi**:
Ketinggian air laut tertinggi yang dicapai pasang dalam setahun biasa, di luar badai.
_Hindari_: pasang maksimum, HAT, puncak pasang

**Pasang Harian**:
Rata-rata ketinggian pasang tinggi yang terjadi hampir setiap hari.
_Hindari_: pasang normal, MHHW, pasang rata-rata

**Kenaikan Muka Laut**:
Seberapa cepat rata-rata permukaan laut naik dari tahun ke tahun, dalam mm per tahun.
_Hindari_: sea level rise, naiknya air laut

**Tanggul**:
Bangunan penahan air laut di pesisir. INTEL hanya menunjukkan letaknya dan tidak menghitung efeknya.
_Hindari_: sea wall, giant sea wall (kecuali nama proyek)

## Tanah

**Tinggi Tanah**:
Ketinggian permukaan tanah terhadap rata-rata muka laut pada satu titik dan satu tahun.
_Hindari_: elevasi, DEM, ketinggian

**Laju Penurunan**:
Seberapa cepat Tinggi Tanah berkurang, dalam cm per tahun.
_Hindari_: subsidence, amblesan, penurunan muka tanah (versi panjang boleh di teks awam)

## Prediksi

**Tahun Rob**:
Tahun pertama sebuah titik punya Tinggi Tanah di bawah Pasang Tertinggi, sehingga mulai kena Rob sesekali.
_Hindari_: tahun tenggelam, tanggal tenggelam

**Tahun Terendam**:
Tahun pertama sebuah titik punya Tinggi Tanah di bawah Pasang Harian, sehingga air tidak lagi surut.
_Hindari_: tahun hilang, rob permanen, tenggelam total

**Rentang Tahun**:
Tahun Rob atau Tahun Terendam paling cepat sampai paling lambat, dihitung dari ketidakpastian Tinggi Tanah dan Laju Penurunan.
_Hindari_: margin error, ± tahun

**Masa Terukur**:
Tahun-tahun sampai Rilis Data terakhir, ketika Tinggi Tanah dihitung dari penurunan yang benar-benar diukur satelit.
_Hindari_: historis, data lama, masa lalu

**Masa Perkiraan**:
Tahun-tahun setelah Rilis Data terakhir, ketika Tinggi Tanah diproyeksikan dengan Laju Penurunan.
_Hindari_: prediksi (sebagai nama bagian), masa depan

**Area Bawah Pasang**:
Semua titik yang Tinggi Tanah-nya di bawah Pasang Tertinggi pada tahun yang dipilih.
_Hindari_: area tenggelam, genangan, zona banjir

**Garis Pantai**:
Batas antara Area Bawah Pasang dan daratan kering pada tahun yang dipilih.
_Hindari_: shoreline, bibir pantai

**Skenario**:
Asumsi tentang Laju Penurunan ke depan. Ada dua: **Skenario Lanjut** (laju tetap seperti sekarang) dan **Skenario Henti** (pengambilan air tanah dihentikan sehingga penurunan melambat).
_Hindari_: mode, kasus, simulasi

**Uji Mundur**:
Menjalankan prediksi dengan data lama lalu mencocokkannya dengan Rob yang sudah terjadi, contohnya di Kecamatan Sayung, Demak.
_Hindari_: hindcast, backtest, validasi (terlalu umum)

## Tempat

**Wilayah Cakupan**:
Daerah yang sudah dihitung dan tampil di peta. Saat ini Demak dan Semarang.
_Hindari_: area, region, pilot

**Kelurahan**:
Satuan wilayah administrasi terkecil yang dipakai untuk peringkat, termasuk desa.
_Hindari_: desa (sebagai istilah terpisah), kampung, RW

## Data

**Rilis Data**:
Satu kali pembaruan hasil hitung yang diarsipkan dengan nama kuartal, contohnya `data-2026Q4`.
_Hindari_: snapshot, versi data, update

## Orang

**Pengunjung**:
Siapa saja yang membuka peta, kebanyakan warga yang mengecek lokasinya sendiri.
_Hindari_: user, pengguna

**Peliput**:
Jurnalis, peneliti, atau pegawai pemda yang memakai peringkat dan unduhan data.
_Hindari_: stakeholder, admin
