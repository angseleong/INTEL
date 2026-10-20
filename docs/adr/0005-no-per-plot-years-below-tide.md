# Tahun per titik hanya untuk tanah yang masih di atas Pasang Tertinggi

Uji Mundur (DATA.md §5.2) lulus di seluruh pesisir Semarang–Demak (AUC 0,87), tapi tidak punya daya beda di dalam Sayung (AUC 0,50). Di kawasan yang sudah setinggi muka laut, petak mana yang duluan jadi air ditentukan oleh Tanggul, pompa, urugan, dan tambak, bukan oleh Tinggi Tanah. Galat DeltaDTM (±0,5 m) juga lebih besar dari beda tinggi antar petak. Karena itu kartu titik tidak menampilkan Rentang Tahun untuk tanah yang sudah di bawah Pasang Tertinggi. Kartu hanya menulis bahwa tanah itu sudah di bawah pasang dan nasibnya bergantung pada Tanggul, pompa, dan urugan.

## Considered Options

- **Tetap tampilkan tahun dengan label tidak pasti**: ditolak. Angka yang terbukti setara tebakan acak tetap terbaca sebagai prediksi.
- **Kriteria lama (tertangkap ≥ 70% di Sayung)**: ditolak. Kriteria itu bisa dicapai dengan menebak semuanya. Kriteria baru membandingkan dengan tebakan acak.

## Consequences

- Peta Area Bawah Pasang tetap tampil untuk semua tingkat. Batasan ini hanya berlaku untuk kartu titik.
- Kalau nanti ada data Tanggul dan pompa, ADR ini bisa diganti dan Uji Mundur diulang.
