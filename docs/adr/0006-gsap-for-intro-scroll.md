# GSAP untuk animasi scroll halaman pembuka

Halaman pembuka adalah scrollytelling: air naik, latar menggelap, dan peta terbang antar kota, semuanya mengikuti posisi scroll. Animasi seperti ini memakai GSAP + ScrollTrigger, satu-satunya library animasi di proyek. GSAP gratis penuh sejak 2025, sekitar 70 KB, dan bisa dipasang di kode TypeScript yang sudah ada tanpa framework UI. Pemilik menyetujui dependensi ini.

GSAP hanya dimuat di halaman pembuka. Halaman peta tetap memakai CSS transition, Web Animations API, dan animasi bawaan MapLibre (`DESIGN.md` bagian Gerak).

## Considered Options

- **React + Framer Motion**: ditolak. React menyusun tampilan, bukan membuat animasi. Kode peta yang sudah jalan harus ditulis ulang, dan halaman jadi lebih berat di ponsel.
- **Tanpa library (CSS + IntersectionObserver)**: ditolak. Cukup untuk muncul-memudar, tapi air dan gradien yang mengikuti scroll sulit dibuat halus di semua browser ponsel.
- **CSS scroll-driven animations**: ditolak untuk sekarang. Dukungannya belum merata di semua browser ponsel.

## Catatan 27 Okt 2026

GSAP dilepas saat Blok 7 (ADR-0007, ADR-0008). Halaman pembuka baru cukup memakai posisi gulir + `transform`/`opacity` yang ditulis sendiri (`motion()` di `src/ui.tsx`), jadi dependensi ini tidak dibutuhkan lagi.
