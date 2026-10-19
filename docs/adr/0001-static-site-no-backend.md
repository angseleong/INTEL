# Situs statis, tanpa server dan tanpa database

Semua hitungan dilakukan oleh pipeline Python yang jalan terjadwal di GitHub Actions, dengan pengolahan citra radar yang berat diserahkan ke HyP3 milik NASA. Hasilnya berupa file statis (PMTiles, CSV, JSON) yang di-host di Vercel, dengan arsip setiap Rilis Data di GitHub Releases. Browser hanya memfilter fitur yang sudah dihitung. Pengunjung tidak pernah menulis data, jadi tidak ada yang perlu disimpan di server. Dengan cara ini biaya tetap Rp0 dan situs tidak bisa tumbang berapa pun jumlah Pengunjungnya.

## Considered Options

- **Supabase, Firebase, atau backend lain**: ditolak. Tidak ada data dari Pengunjung yang perlu disimpan, Postgres tidak cocok untuk raster, jatah gratisnya kecil, dan fungsi serverless-nya hanya boleh jalan beberapa menit dalam JavaScript, sehingga tidak bisa menjalankan MintPy atau GDAL.
- **Vercel Functions untuk pipeline**: ditolak karena alasan yang sama. Vercel hanya dipakai untuk hosting.
- **Menghitung rumus di browser dari raster mentah**: ditolak untuk v1. Satu poligon per tahun per Skenario sudah cukup untuk slider, dan memfilternya jauh lebih ringan di ponsel.

## Consequences

- Fitur yang menyimpan data Pengunjung (langganan notifikasi, laporan) butuh ADR baru yang menggantikan ADR ini.
- Data di situs hanya sebaru Rilis Data terakhir. Karena itu setiap lapisan wajib menampilkan tanggal pembaruannya.
