// Halaman Tentang. Hero: Konstelasi Titik (docs/DESIGN.md §8, A8): measured InSAR points sinking at their own
// Laju Penurunan while the year runs 2015 → 2050.
import { dateId } from "./page";

type Constellation = { updated: string; points: [number, number, number][] }; // lon, lat, cm/tahun

const canvas = document.getElementById("stars") as HTMLCanvasElement;
const yearEl = document.getElementById("heroYear")!;
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const LOOP_MS = 12000;

fetch("/data/constellation.json").then((r) => r.json()).then((c: Constellation) => {
  document.getElementById("updated")!.textContent = dateId(c.updated);
  const ctx = canvas.getContext("2d")!;
  const lons = c.points.map((p) => p[0]), lats = c.points.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  const color = (rate: number) => { // Kabut (slow) → Sorot (fast)
    const t = Math.min(Math.max(rate / 12, 0), 1);
    return `rgb(${189 + (255 - 189) * t},${189 + (184 - 189) * t},${189 + (41 - 189) * t})`;
  };
  let year = 2026;
  const size = () => {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    draw(year);
  };
  addEventListener("resize", size);
  function draw(y: number) {
    year = y;
    const w = canvas.width, h = canvas.height;
    const s = Math.min(w / (x1 - x0), (h * 0.6) / (y1 - y0));
    const drop = (h * 0.3) / (15 * 35); // the fastest point (±15 cm/tahun) sinks 30% of the height by 2050
    ctx.clearRect(0, 0, w, h);
    for (const [lon, lat, rate] of c.points) {
      ctx.fillStyle = color(rate);
      ctx.fillRect((lon - x0) * s + (w - (x1 - x0) * s) / 2, (y1 - lat) * s + h * 0.1 + Math.max(rate, 0) * (year - 2015) * drop, devicePixelRatio * 1.5, devicePixelRatio * 1.5);
    }
    yearEl.textContent = String(Math.floor(year));
  }
  size();
  if (still) return;
  const start = performance.now();
  const frame = (now: number) => {
    draw(2015 + (((now - start) % LOOP_MS) / LOOP_MS) * 35);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}).catch(() => canvas.remove());
