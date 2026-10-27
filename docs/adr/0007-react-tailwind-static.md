# Web pakai React + Tailwind + shadcn/ui, tetap statis

Tampilan INTEL dirombak total (Blok 7). Web ditulis ulang dengan Vite + React + TypeScript strict + Tailwind CSS 4 + komponen shadcn/ui. Situs tetap statis tanpa server (ADR-0001): React hanya menyusun tampilan di browser, semua data tetap dibaca dari file di `public/data/`. MapLibre GL JS dan PMTiles tetap dipakai untuk peta. GSAP tetap dipakai untuk animasi yang mengikuti scroll (ADR-0006). Pemilik menyetujui stack ini pada 27 Okt 2026.

ADR ini menggantikan alasan penolakan React di ADR-0006. Alasan itu ("kode peta yang sudah jalan harus ditulis ulang") tidak berlaku lagi karena seluruh tampilan memang ditulis ulang.

## Considered Options

- **Tetap vanilla TypeScript, cuma ganti gaya**: ditolak. Tampilan baru punya banyak komponen yang dipakai ulang (panel kaca, kartu titik, slider, tombol Skenario). Menulisnya tanpa komponen membuat kode cepat berantakan.
- **Next.js seperti proyek referensi Wave**: ditolak. Kelebihan utama Next.js ada di server, sedangkan INTEL sengaja tanpa server. Static export Next.js menambah aturan tanpa menambah manfaat.
- **three.js untuk air**: ditolak. Laut dan riak cukup ditulis dengan shader WebGL sendiri (sekitar 300 baris), tanpa tambahan sekitar 150 KB di ponsel (ADR-0008).

## Consequences

- Dependensi web baru: `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`, dan dependensi bawaan komponen shadcn/ui (`radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`). Dependensi lain tetap harus ditanyakan ke pemilik.
- Seluruh `src/` lama diganti. Selama Blok 7 berjalan, halaman lama tetap ada sampai penggantinya lulus checkpoint.
- Ukuran JavaScript di ponsel naik sekitar 60 KB gzip karena React. Batasnya dijaga di checkpoint Blok 7.
