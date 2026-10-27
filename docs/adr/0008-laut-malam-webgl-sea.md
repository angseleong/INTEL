# Gaya "Laut Malam" dengan laut WebGL yang bisa disentuh

Gaya "void" (hitam pekat, satu tombol biru) diganti gaya **Laut Malam**: seluruh situs berada di malam hari di pesisir, diterangi cahaya bulan. Halaman pembuka dibuka dengan laut realistis yang digambar shader WebGL: huruf INTEL berdiri di atas air, memantul di permukaan, lalu air naik dan menenggelamkannya saat Pengunjung menggulir. Laut bisa disentuh: ketukan membuat riak, geseran ke samping meninggalkan jejak ombak. Pemilik memilih arah ini dari prototipe di canvas mockup pada 27 Okt 2026.

Air dibagi dua supaya tetap jujur (ADR-0003):

- **Air sungguhan** di halaman pembuka digambar realistis: ombak, pantulan, kilau. Di peta, Air Nyata tetap isian diam: laut WebGL di peta sudah dicoba dan ditolak pemilik pada 27 Okt 2026 karena malah terlihat jelek.
- **Area Bawah Pasang** tetap lapisan data toska bercahaya yang transparan. Lapisan ini tidak boleh terlihat seperti air sungguhan, karena artinya tanah lebih rendah dari pasang, bukan tergenang.

## Considered Options

- **Tetap gaya void**: ditolak oleh pemilik. Tampilannya terasa polos dan airnya tidak meyakinkan.
- **Kaca Laut dengan gradien neon toska–biru di tombol**: dipakai di mockup pertama, lalu ditolak. Gradien neon terasa seperti template AI dan membuat halaman pembuka yang realistis terlihat terputus dari halaman lain.
- **Air realistis untuk Area Bawah Pasang juga**: ditolak. Peta akan terbaca "daerah ini sudah tenggelam".
- **Gyroscope (air ikut miring)**: ditolak. Di iPhone butuh izin lewat pop-up dan tidak menambah informasi.

## Consequences

- `DESIGN.md` ditulis ulang. Token warna lama (Void, Biru Pasang, Sorot `#ffb829`) tidak dipakai lagi.
- Krem cahaya bulan menjadi satu-satunya warna aksi. Toska–biru hanya untuk data perkiraan.
- Laut WebGL wajib punya cadangan: diam kalau "kurangi gerakan" aktif, gradien statis kalau WebGL gagal, dan berhenti menggambar saat tidak terlihat.
- Bulan di halaman pembuka adalah hiasan cahaya, bukan data. Posisinya tidak boleh dikira menunjukkan waktu atau pasang.
