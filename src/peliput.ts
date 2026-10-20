// Halaman Peliput (FR-7): sortable Kelurahan ranking from ranking.csv and Laju Penurunan per kota.
import { dateId } from "./page";

type Row = Record<string, string>;
type Meta = { updated: string; kota: { kota: string; titik: number; lajuMedian: number; lajuP90: number }[] };

const NUM = ["laju_penurunan_median_cm", "persen_bawah_pasang_2026", "persen_bawah_pasang_2050_lanjut", "persen_bawah_pasang_2050_henti"];
const fmt = (x: string) => Number(x).toLocaleString("id-ID");

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

const tbody = document.querySelector("#ranking tbody")!;
let rows: Row[] = [];
let sortKey = "separuh";
let ascending = true;

function render() {
  const key = (r: Row) => (sortKey === "separuh" ? half(r) : NUM.includes(sortKey) ? Number(r[sortKey]) : r[sortKey]);
  const sorted = [...rows].sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1);
  });
  tbody.innerHTML = sorted.map((r) => `<tr>
    <td><a href="/#${r.lat},${r.lon},14,2026,continue">${r.kelurahan}</a><br /><span class="caption">${r.kecamatan}, ${r.kota}</span></td>
    <td>${halfText(r)}</td>
    <td class="num">${fmt(r.laju_penurunan_median_cm)}</td>
    <td class="num">${r.persen_bawah_pasang_2026}%</td>
    <td class="num">${r.persen_bawah_pasang_2050_lanjut}%</td>
    <td class="num">${r.persen_bawah_pasang_2050_henti}%</td>
  </tr>`).join("");
  document.querySelectorAll<HTMLButtonElement>("th button").forEach((b) => {
    b.setAttribute("aria-sort", b.dataset.key === sortKey ? (ascending ? "ascending" : "descending") : "none");
  });
}

document.querySelectorAll<HTMLButtonElement>("th button").forEach((b) => b.addEventListener("click", () => {
  const k = b.dataset.key!;
  // numbers read best biggest first; names and years earliest first
  ascending = k === sortKey ? !ascending : !NUM.includes(k);
  sortKey = k;
  render();
}));

Promise.all([
  fetch("/data/ranking.csv").then((r) => r.text()),
  fetch("/data/meta.json").then((r) => r.json() as Promise<Meta>),
]).then(([csv, meta]) => {
  rows = parse(csv);
  render();
  document.getElementById("source")!.textContent =
    `${rows.length} Kelurahan. Data: Sentinel-1 (InSAR), DeltaDTM, pasang IOC Semarang, batas Kelurahan BPS. Diperbarui ${dateId(meta.updated)}.`;
  const max = Math.max(...meta.kota.map((k) => k.lajuP90));
  document.getElementById("kota")!.innerHTML = meta.kota.map((k) => `<div class="bar">
    <span>${k.kota}</span>
    <span class="track"><i style="width:${(k.lajuMedian / max) * 100}%"></i><b style="left:${(k.lajuP90 / max) * 100}%"></b></span>
    <span class="num">${fmt(String(k.lajuMedian))} cm/tahun</span>
  </div>`).join("");
});
