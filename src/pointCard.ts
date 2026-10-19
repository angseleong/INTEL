// Kartu titik: what one tapped point shows (docs/USERFLOW.md §2 and §4).

export type Scenario = "continue" | "stop";
export type Points = Record<string, number[]>;

const ALREADY = 0;
const NEVER = 9999;
const RENTANG_MAKS = 10; // years, same as pipeline/compute.py
const FIRST = 2026;
const LAST = 2050;
const MAX_DISTANCE_M = 150; // farther than this from a measured pixel: no data here

export function nearest(points: Points, lon: number, lat: number): number | null {
  const kx = 111320 * Math.cos((lat * Math.PI) / 180);
  let best = -1;
  let bestD = Infinity;
  const { lon: xs, lat: ys } = points;
  for (let i = 0; i < xs.length; i++) {
    const d = ((xs[i] - lon) * kx) ** 2 + ((ys[i] - lat) * 111320) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best >= 0 && Math.sqrt(bestD) <= MAX_DISTANCE_M ? best : null;
}

function range(min: number, max: number, already: string): string {
  if (min === ALREADY && max === ALREADY) return already;
  if (min === NEVER) return "Tidak sebelum 2050";
  const a = min === ALREADY ? FIRST : min;
  const b = max === NEVER ? LAST + 1 : max === ALREADY ? FIRST : max;
  if (b - a > RENTANG_MAKS) return "Belum bisa diperkirakan";
  return `±${min === ALREADY ? "sekarang" : a}–${max === NEVER ? ">2050" : b}`;
}

const num = (x: number, digits: number) => x.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function cardHtml(points: Points | null, i: number | null, scenario: Scenario, insideArea: boolean): string {
  if (!insideArea) {
    return `<p class="label">Di luar Wilayah Cakupan</p>
      <p class="ui">Wilayah ini belum dihitung. Saat ini: Demak dan Semarang.</p>`;
  }
  if (points === null || i === null) {
    return `<p class="label">Belum ada data</p>
      <p class="ui">Data penurunan tanah belum tersedia di titik ini. Satelit radar sulit mengukur sawah, tambak, dan air.</p>`;
  }
  const v = (k: string) => points[k][i];
  const rob = range(v(`robYearMin_${scenario}`), v(`robYearMax_${scenario}`), "Sudah kena");
  const flooded = range(v(`floodedYearMin_${scenario}`), v(`floodedYearMax_${scenario}`), "Sudah terendam");
  const elevation = v("elevation");
  return `<p class="label">Mulai kena Rob sesekali</p>
    <p class="big">${rob}</p>
    <div class="row"><span>Terendam tiap hari</span><b>${flooded}</b></div>
    <div class="row"><span>Tinggi Tanah</span><b>${num(Math.abs(elevation), 2)} m ${elevation < 0 ? "di bawah" : "di atas"} laut</b></div>
    <div class="row"><span>Laju Penurunan</span><b>${num(v("subsidenceRate"), 1)} ± ${num(v("subsidenceRateStd"), 1)} cm/tahun</b></div>`;
}
