// Halaman Tentang. Hero: Konstelasi Titik (DESIGN.md Gerak A8): measured InSAR points sinking at their own
// Laju Penurunan while the year runs 2015 → 2050.
import "../app.css";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Footer, Label, Nav, Part, container, dateId, panel, still, useMotion } from "../ui";

type Constellation = { updated: string; points: [number, number, number][] }; // lon, lat, cm/tahun
const LOOP_MS = 12000;

function Stars({ onUpdated }: { onUpdated: (iso: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [year, setYear] = useState(2015);
  useEffect(() => {
    let raf = 0, dead = false;
    fetch("/data/constellation.json").then((r) => r.json()).then((c: Constellation) => {
      if (dead) return;
      onUpdated(c.updated);
      const cv = canvas.current!;
      const ctx = cv.getContext("2d")!;
      const lons = c.points.map((p) => p[0]), lats = c.points.map((p) => p[1]);
      const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
      const color = (rate: number) => (rate > 8 ? "#f2cf8a" : rate > 3 ? "#3cf0d0" : "#5b7380"); // pelan, sedang, > 8 cm/tahun
      const draw = (y: number) => {
        const w = (cv.width = cv.clientWidth * devicePixelRatio), h = (cv.height = cv.clientHeight * devicePixelRatio);
        const s = Math.min(w / (x1 - x0), (h * 0.6) / (y1 - y0));
        const drop = (h * 0.3) / (15 * 35); // the fastest point (±15 cm/tahun) sinks 30% of the height by 2050
        const d = devicePixelRatio * 1.6;
        for (const [lon, lat, rate] of c.points) {
          ctx.fillStyle = color(rate);
          ctx.fillRect((lon - x0) * s + (w - (x1 - x0) * s) / 2, (y1 - lat) * s + h * 0.08 + Math.max(rate, 0) * (y - 2015) * drop, d, d);
        }
        setYear(Math.floor(y));
      };
      if (still) return draw(2026);
      const start = performance.now();
      const frame = (now: number) => { draw(2015 + (((now - start) % LOOP_MS) / LOOP_MS) * 35); raf = requestAnimationFrame(frame); };
      raf = requestAnimationFrame(frame);
    }).catch(() => canvas.current?.remove());
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="relative">
      <canvas ref={canvas} aria-hidden="true" className="block aspect-[1000/470] w-full" />
      <span aria-hidden="true" className="absolute top-0 right-0 text-[clamp(40px,6vw,80px)] leading-none font-light tracking-[-0.04em] text-gold">{year}</span>
    </div>
  );
}

function Tentang() {
  const [updated, setUpdated] = useState("");
  useMotion([updated]);
  return (
    <div className="min-h-svh bg-night text-foam">
      <Nav current="/tentang.html" />
      <main className="pt-20">
        <header className={`${container} flex flex-col gap-2 pt-12 pb-24`}>
          <Stars onUpdated={setUpdated} />
          <div className="flex flex-wrap items-end gap-8">
            <h1 data-motion="left" className="m-0 flex-[2_1_520px] text-[clamp(44px,6vw,88px)] leading-[0.98] font-light tracking-[-0.05em]">Titik-titik ukur yang pelan-pelan turun.</h1>
            <div data-motion="right" className="flex flex-[1_1_300px] flex-col gap-3">
              <div className="flex flex-wrap gap-3.5 text-xs font-light text-haze">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#5b7380]" />pelan</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-tide-glow" />sedang</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-gold" />&gt; 8 cm/tahun</span>
              </div>
              <p className="caption">Setiap titik adalah satu tempat di pesisir Demak–Semarang yang diukur satelit radar Sentinel-1. Titik turun sesuai Laju Penurunan yang terukur di tempat itu. Diperbarui {updated ? dateId(updated) : "–"}.</p>
            </div>
          </div>
        </header>

        <Part title="Kenapa namanya INTEL">
          <p>Di kampus ITB ada kolam yang dijuluki <b>Kolam Intel</b>, singkatan dari "Indonesia Tenggelam". Nama itu dipinjam di sini sebagai pertanyaan, bukan jawaban: apakah benar, dan kapan? INTEL mencoba menjawabnya dengan angka yang bisa dicek ulang.</p>
        </Part>

        <Part title="Cara menghitung">
          <Label>Tiga bahan</Label>
          <ul>
            <li><b>Tinggi Tanah</b>: seberapa tinggi tanah di atas rata-rata muka laut, dari peta ketinggian DeltaDTM (keadaan sekitar 2021).</li>
            <li><b>Laju Penurunan</b>: seberapa cepat tanah turun, diukur satelit radar Sentinel-1 sejak 2014. Di Sayung dan Genuk sekitar 10 cm per tahun.</li>
            <li><b>Pasang</b>: dari stasiun pasang Semarang. Pasang Tertinggi dalam setahun +0,65 m, Pasang Harian +0,34 m di atas muka laut rata-rata. Laut naik 2,4–4,3 mm per tahun (BRIN).</li>
          </ul>
          <Label>Satu hitungan</Label>
          <p>Untuk setiap titik dan setiap tahun: tinggi tanah tahun itu = tinggi tanah sekarang dikurangi penurunannya. Tahun pertama tanah lebih rendah dari Pasang Tertinggi disebut <b>Tahun Rob</b>: tanpa Tanggul dan pompa, tempat itu mulai kena rob beberapa kali setahun. Tahun pertama tanah lebih rendah dari Pasang Harian disebut <b>Tahun Bawah Pasang Harian</b>.</p>
          <p>Ini hitungan fisika biasa, bukan kecerdasan buatan. Semua rumus dan angkanya ada di <a href="https://github.com/angseleong/INTEL/blob/main/docs/DATA.md">docs/DATA.md</a>.</p>
          <Label>Kenapa tahunnya berupa rentang</Label>
          <p>Peta ketinggian bisa meleset sekitar ±0,5 m, ukuran satelit punya galat, dan laju naiknya laut belum pasti. Karena itu tahun selalu ditulis sebagai Rentang Tahun, misalnya ±2031–2035. Kalau rentangnya lebih dari 10 tahun, kartu menulis "belum bisa diperkirakan".</p>
          <Label>Dua Skenario</Label>
          <p><b>Lanjut</b>: tanah terus turun secepat sekarang. <b>Henti</b>: pengambilan air tanah dihentikan mulai 2027 dan penurunan melambat sampai berhenti dalam 10 tahun. Angka 10 tahun ini dari Tokyo, yang tanahnya berhenti turun sekitar 10 tahun setelah pengambilan air tanah dibatasi. Ini skenario optimis: Bangkok, yang mengatur air tanah sejak 1977, sampai sekarang masih turun walau lebih pelan.</p>
        </Part>

        <section className={`${container} pb-24`}>
          <div data-motion="up" className={`${panel} flex flex-wrap items-center gap-10 border-[rgb(243_234_210/0.16)] bg-[#0a1822] p-[clamp(28px,5vw,56px)]`}>
            <div className="flex flex-[1_1_340px] flex-col gap-2.5">
              <Label>Diuji dengan masa lalu</Label>
              <span className="text-[clamp(80px,10vw,140px)] leading-[0.85] font-light tracking-[-0.06em] text-gold">3,9×</span>
              <span className="text-lg font-light">lebih tepat dari tebakan acak</span>
              <span className="text-xs font-light text-haze">di seluruh pesisir Semarang–Demak (skor pembeda AUC 0,87)</span>
            </div>
            <div className="prose-intel flex flex-[1_1_420px] flex-col gap-3.5">
              <p>Sebelum peta ini dibuka, rumusnya diuji mundur: dihitung hanya dengan data satelit 2015–2017, lalu dicocokkan dengan lahan yang benar-benar jadi air di 2025 menurut foto satelit Sentinel-2. Artinya rumus bisa membedakan kawasan yang rawan dari kawasan yang aman.</p>
              <p>Tapi di kawasan yang sudah rendah, seperti Sayung, rumus <b>tidak bisa</b> menebak petak mana yang duluan jadi air. Di sana Tanggul, pompa, urugan, dan pembuatan tambak lebih menentukan daripada tinggi tanah. Karena itu tanah yang sudah di bawah Pasang Tertinggi tidak diberi tahun di kartu titik. Dan dari lahan yang dihitung di bawah Pasang Harian, hanya sekitar 1 dari 10 yang benar-benar jadi air dalam 8 tahun.</p>
            </div>
          </div>
        </section>

        <Part title="Yang tidak dihitung">
          <ul>
            <li><b>Tanggul, pompa, dan urugan.</b> Peta menunjukkan tanah yang lebih rendah dari laut, bukan tempat yang pasti tergenang. Garis Tanggul hanya menunjukkan letaknya.</li>
            <li><b>Banjir karena hujan dan sungai.</b> Hanya air laut pasang.</li>
            <li><b>Tempat yang tidak terukur satelit.</b> Radar sulit mengukur sawah, tambak, dan air. Di sana Laju Penurunan diisi dari rata-rata titik terukur dalam ±1 km, dan kartu titik menuliskannya.</li>
            <li><b>Arah gerak tanah.</b> Satelit mengukur dari samping. INTEL menganggap tanah hanya bergerak turun.</li>
            <li><b>Musim.</b> Muka laut naik-turun ±10–15 cm antar musim. Angka pasang di sini rata-rata setahun, jadi rob musiman bisa sedikit lebih tinggi.</li>
            <li><b>Kenaikan Muka Laut</b> 2,4–4,3 mm per tahun diambil dari paparan BRIN Mei 2026. Makalahnya belum terbit.</li>
          </ul>
        </Part>

        <Part title="Sumber data dan lisensi">
          <ul>
            <li><b>Laju Penurunan</b>: citra radar Copernicus Sentinel-1 (ESA), diolah jadi interferogram oleh <a href="https://hyp3-docs.asf.alaska.edu/">ASF HyP3</a> dan jadi deret waktu dengan MintPy. Berisi data Copernicus Sentinel yang telah diolah.</li>
            <li><b>Tinggi Tanah</b>: <a href="https://doi.org/10.4121/21997565">DeltaDTM v1.1</a> (Deltares / TU Delft), CC BY 4.0. Dibuat dari Copernicus WorldDEM-30 © DLR e.V. 2010–2014 dan © Airbus Defence and Space GmbH 2014–2018, disediakan dalam program COPERNICUS oleh Uni Eropa dan ESA.</li>
            <li><b>Muka laut rata-rata</b>: titik lidar NASA ICESat-2, dipakai untuk menyamakan acuan tinggi. DTU22 MDT © DTU Space hanya dipakai sebagai pembanding.</li>
            <li><b>Pasang</b>: stasiun Semarang (<code>sema</code>, operator BIG) dari <a href="https://www.ioc-sealevelmonitoring.org">IOC Sea Level Station Monitoring Facility</a> (VLIZ/IOC-UNESCO).</li>
            <li><b>Kenaikan Muka Laut</b>: BRIN, BRIGHTS Seri 2, 26 Mei 2026.</li>
            <li><b>Air Nyata 2017 dan 2025</b>: citra Copernicus Sentinel-2 (ESA).</li>
            <li><b>Tanggul</b> dan <b>pencarian alamat</b>: © kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, ODbL. Pencarian lewat Nominatim.</li>
            <li><b>Batas Kelurahan</b>: <a href="https://data.humdata.org/dataset/cod-ab-idn">COD-AB Indonesia</a> (BPS, via OCHA HDX), CC BY-IGO.</li>
            <li><b>Foto Cerita Kota</b>: rumah di Desa Bedono, 2025, Tim LindungiHutan, <a href="https://commons.wikimedia.org/wiki/File:Rumah_Mak_Jah_di_Desa_Bedono_yang_Tenggelam_karena_abrasi.jpg">CC BY 4.0</a>; nelayan Tambak Lorok, 2023, Djunaidibd, <a href="https://commons.wikimedia.org/wiki/File:Nelayan_Tambak_Lorok.jpg">CC BY-SA 4.0</a>. Keduanya diperkecil.</li>
            <li><b>Peta dasar</b>: <a href="https://s2maps.eu">Sentinel-2 cloudless</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2024), CC BY-NC-SA 4.0.</li>
            <li><b>Huruf</b>: Sora, SIL Open Font License.</li>
          </ul>
          <p>Kode INTEL terbuka dengan lisensi MIT di <a href="https://github.com/angseleong/INTEL">GitHub</a>. Proyek pribadi, tanpa iklan, tanpa menyimpan data Pengunjung.</p>
        </Part>
      </main>
      <Footer />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Tentang />);
