// Kartu titik: what one tapped point shows (docs/USERFLOW.md §2 and §4).

export type Scenario = "continue" | "stop";
export type Level = "rob" | "daily";
export type Points = Record<string, number[]>;

const ALREADY = 0;
const NEVER = 9999;
const RENTANG_MAKS = 10; // years, same as pipeline/compute.py
const FIRST = 2026;
const LAST = 2050;
const MAX_DISTANCE_M = 150; // farther than this from a measured pixel: no data here
const T0 = 2021, STOP_FROM = 2027, HENTI_TAHUN = 10; // same as pipeline/compute.py

/** Metres sunk since T0 by `year`, same formula as compute.subsided. */
function subsided(rateM: number, year: number, scenario: Scenario): number {
  if (scenario === "continue") return rateM * (year - T0);
  const x = Math.min(Math.max(year - STOP_FROM, 0), HENTI_TAHUN);
  return rateM * (Math.min(year, STOP_FROM) - T0) + rateM * (x - (x * x) / (2 * HENTI_TAHUN));
}

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

export const num = (x: number, digits: number) => x.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export type Facts = { year: number; elevation: number; rate: number; rateStd: number; filled: boolean };
export type CardInfo =
  | { kind: "outside" }
  | { kind: "nodata" }
  | { kind: "already"; facts: Facts }
  | { kind: "future"; rob: string; daily: string; facts: Facts };

export function cardInfo(points: Points | null, i: number | null, scenario: Scenario, year: number, insideArea: boolean): CardInfo {
  if (!insideArea) return { kind: "outside" };
  if (points === null || i === null) return { kind: "nodata" };
  const v = (k: string) => points[k][i];
  const facts: Facts = {
    year,
    elevation: v("elevation") - subsided(v("subsidenceRate") / 100, year, scenario),
    rate: v("subsidenceRate"),
    rateStd: v("subsidenceRateStd"),
    filled: v("filled") === 1,
  };
  // Uji Mundur (DATA.md §5.1): once land is already below the tide, elevation no longer tells which plots
  // turn into sea; tanggul, pumps and fill do. So no per-plot years there.
  if (v(`robYear_${scenario}`) === ALREADY) return { kind: "already", facts };
  return {
    kind: "future",
    rob: range(v(`robYearMin_${scenario}`), v(`robYearMax_${scenario}`), "Sudah kena"),
    daily: range(v(`dailyYearMin_${scenario}`), v(`dailyYearMax_${scenario}`), "Sudah"),
    facts,
  };
}
