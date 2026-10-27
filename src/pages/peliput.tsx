// Halaman Peliput (FR-7): sortable Kelurahan ranking from ranking.csv, Laju Penurunan per kota, downloads.
import "../app.css";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Footer, Label, Nav, Part, container, dateId, panel, useMotion } from "../ui";

type Row = Record<string, string>;
type Meta = { updated: string; kota: { kota: string; titik: number; lajuMedian: number; lajuP90: number }[] };

const NUM = ["laju_penurunan_median_cm", "persen_bawah_pasang_2026", "persen_bawah_pasang_2050_lanjut", "persen_bawah_pasang_2050_henti"];
const fmt = (x: string | number) => Number(x).toLocaleString("id-ID");
/** Sort key for "separuh": already below first, then the earliest year, then the uncertain and beyond 2050. */
const half = (r: Row) => ({ sudah: 0, ">2050": 9999, "belum bisa diperkirakan": 9000 })[r.separuh_rob_paling_cepat] ?? Number(r.separuh_rob_paling_cepat);
const halfText = (r: Row) => {
  const [a, b] = [r.separuh_rob_paling_cepat, r.separuh_rob_paling_lambat];
  if (a === "sudah") return "Sudah";
  if (a === ">2050") return "Tidak sebelum 2050";
  if (a === "belum bisa diperkirakan") return "Belum bisa diperkirakan";
  return `±${a}–${b}`;
};
function parse(csv: string): Row[] {
  const [head, ...lines] = csv.trim().split("\n").map((l) => l.split(",")); // ponytail: no quoted commas in ranking.csv
  return lines.map((cells) => Object.fromEntries(head.map((h, i) => [h, cells[i]])));
}

const COLUMNS: [string, string, boolean][] = [
  ["kelurahan", "Kelurahan", false],
  ["separuh", "Separuh di bawah Pasang Tertinggi", false],
  ["laju_penurunan_median_cm", "Laju Penurunan (cm/tahun)", true],
  ["persen_bawah_pasang_2026", "Di bawah pasang 2026", true],
  ["persen_bawah_pasang_2050_lanjut", "2050 Lanjut", true],
  ["persen_bawah_pasang_2050_henti", "2050 Henti", true],
];

function Peliput() {
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [sort, setSort] = useState({ key: "separuh", ascending: true });
  useEffect(() => {
    Promise.all([
      fetch("/data/ranking.csv").then((r) => r.text()),
      fetch("/data/meta.json").then((r) => r.json() as Promise<Meta>),
    ]).then(([csv, m]) => { setRows(parse(csv)); setMeta(m); }).catch(() => {});
  }, []);
  useMotion([!!meta]);

  const sorted = useMemo(() => {
    const key = (r: Row) => (sort.key === "separuh" ? half(r) : NUM.includes(sort.key) ? Number(r[sort.key]) : r[sort.key]);
    return [...rows].sort((a, b) => {
      const [x, y] = [key(a), key(b)];
      const tie = Number(b.persen_bawah_pasang_2026) - Number(a.persen_bawah_pasang_2026); // more land already below first
      return (x < y ? -1 : x > y ? 1 : 0) * (sort.ascending ? 1 : -1) || tie;
    });
  }, [rows, sort]);
  // numbers read best biggest first; names and years earliest first
  const pick = (k: string) => setSort((s) => ({ key: k, ascending: k === s.key ? !s.ascending : !NUM.includes(k) }));
  const max = meta ? Math.max(...meta.kota.map((k) => k.lajuP90)) : 1;

  return (
    <div className="min-h-svh bg-night text-foam">
      <Nav current="/peliput.html" />
      <main className="pt-36">
        <Part h1 label="Untuk jurnalis, peneliti, dan pemda" title="Peringkat Kelurahan">
          <p>Kelurahan dan desa di Wilayah Cakupan (Demak dan Kota Semarang) yang punya cukup titik data. <b>Separuh di bawah Pasang Tertinggi</b> adalah Rentang Tahun ketika separuh daratannya lebih rendah dari Pasang Tertinggi, tanpa menghitung Tanggul dan pompa. Ketuk nama Kelurahan untuk membukanya di peta.</p>
          {meta && <p className="caption">{rows.length} Kelurahan. Data: Sentinel-1 (InSAR), DeltaDTM, pasang IOC Semarang, batas Kelurahan BPS. Diperbarui {dateId(meta.updated)}.</p>}
        </Part>

        <section className={`${container} pb-12`}>
          <div data-motion="left" className={`${panel} flex flex-col gap-4 p-7`}>
            <div className="flex flex-wrap justify-between gap-2">
              <Label>Laju Penurunan per kabupaten/kota</Label>
              <span className="flex gap-4 text-xs font-light text-haze">
                <span className="flex items-center gap-1.5"><span className="h-2 w-[18px] rounded bg-linear-to-r from-tide-glow to-tide-deep" />median</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-gold" />1 dari 10 titik lebih cepat</span>
              </span>
            </div>
            {meta?.kota.map((k) => (
              <div key={k.kota} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex-[0_0_140px] text-sm font-light">{k.kota}</span>
                <span className="relative h-3 flex-[1_1_260px] rounded-md bg-[rgb(200_225_235/0.08)]">
                  <span className="absolute inset-y-0 left-0 rounded-md bg-linear-to-r from-tide-glow to-tide-deep" style={{ width: `${(k.lajuMedian / max) * 100}%` }} />
                  <span className="absolute -top-1 h-5 w-0.5 bg-gold" style={{ left: `calc(${(k.lajuP90 / max) * 100}% - 2px)` }} />
                </span>
                <span className="text-sm">{fmt(k.lajuMedian)} <span className="font-light text-haze">· {fmt(k.lajuP90)} cm/tahun</span></span>
              </div>
            ))}
            <p className="caption">Median titik yang benar-benar terukur Sentinel-1 (tanpa isian dari tetangga), di dalam Wilayah Cakupan saja. Garis tipis: 1 dari 10 titik turun lebih cepat dari angka ini.</p>
          </div>
        </section>

        <section className={`${container} pb-24`}>
          <div data-motion="right" className={`${panel} overflow-x-auto`}>
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-haze">
                  {COLUMNS.map(([k, text, num]) => (
                    <th key={k} scope="col" className={`px-4 py-4 font-normal first:pl-6 last:pr-6 ${num ? "text-right" : ""}`}>
                      <button type="button" onClick={() => pick(k)} aria-sort={sort.key === k ? (sort.ascending ? "ascending" : "descending") : "none"}
                        className={`min-h-11 bg-transparent p-0 font-[inherit] ${sort.key === k ? "text-moon" : "text-haze"}`}>
                        {text}{sort.key === k && (sort.ascending ? " ↑" : " ↓")}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.kode} className="border-t border-hairline">
                    <td className="py-3.5 pr-4 pl-6">
                      <a href={`/#${r.lat},${r.lon},14,2026,continue`} className="font-medium text-foam no-underline">{r.kelurahan}</a>
                      <br /><span className="text-xs font-light text-driftwood">{r.kecamatan}, {r.kota}</span>
                    </td>
                    <td className={`px-4 py-3.5 ${r.separuh_rob_paling_cepat === "sudah" ? "text-haze" : "text-gold"}`}>{halfText(r)}</td>
                    {NUM.map((k, i) => <td key={k} className="px-4 py-3.5 text-right last:pr-6">{i === 0 ? fmt(r[k]) : `${r[k]}%`}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="caption mt-3.5">Persen = bagian daratan Kelurahan (yang ada di Wilayah Cakupan) di bawah Pasang Tertinggi. Lanjut: tanah terus turun secepat sekarang. Henti: pengambilan air tanah dihentikan mulai 2027. Laju Penurunan median, termasuk titik yang diisi dari titik terukur dalam ±1 km.</p>
        </section>

        <Part title="Unduh data">
          <p><a href="/data/ranking.csv" download>ranking.csv</a> satu baris per Kelurahan, semua kolom di atas plus luas (ha), jumlah titik, dan persen isian.</p>
          <p><a href="/data/below-tide-rob.geojson" download>below-tide-rob.geojson</a> Area Bawah Pasang Tertinggi per tahun 2026–2050, per Skenario.</p>
          <p><a href="/data/below-tide-daily.geojson" download>below-tide-daily.geojson</a> sama, untuk Pasang Harian.</p>
          <p>Semua Rilis Data lama ada di <a href="https://github.com/angseleong/INTEL/releases">GitHub Releases</a>, supaya perkiraan antar rilis bisa dibandingkan. Cara hitung dan sumber: <a href="/tentang.html">Tentang</a>. Mohon sebut "INTEL, dari data Sentinel-1, DeltaDTM, dan pasang IOC Semarang" bila memakai angka ini.</p>
        </Part>
      </main>
      <Footer />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Peliput />);
