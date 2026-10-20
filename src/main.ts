import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { cardHtml, nearest, type Level, type Points, type Scenario } from "./pointCard";
import { searchPlaces } from "./search";
import { showTideBanner } from "./tide";
import { compareMap } from "./compare";

type Meta = { updated: string; years: [number, number]; highestTide: number; dailyHighTide: number; validated: boolean; dailyPrecision: number | null };

const AREA = [110.3, -7.02, 110.65, -6.82] as const; // Wilayah Cakupan, same box as the pipeline
const NOW = 2026;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const slider = $<HTMLInputElement>("year");
let scenario: Scenario = "continue";
let level: Level = "rob";
let meta: Meta | null = null;
let points: Points | null = null;
const sliderB = $<HTMLInputElement>("yearB");
let compare: ReturnType<typeof compareMap> | null = null;

// Link yang bisa dibagikan: #lat,lon,zoom,tahun,skenario (docs/ARCHITECTURE.md §5)
const shared = location.hash.slice(1).split(",");
const [hashLat, hashLon, hashZoom, hashYear] = shared.map(Number);
const fromHash = shared.length >= 4 && [hashLat, hashLon, hashZoom, hashYear].every(Number.isFinite);

maplibregl.setWorkerUrl(workerUrl); // Vite serves the worker as its own file

const options: maplibregl.MapOptions = {
  container: "map",
  center: fromHash ? [hashLon, hashLat] : [110.47, -6.93],
  zoom: fromHash ? hashZoom : 11,
  minZoom: 8,
  maxZoom: 17,
  attributionControl: { compact: true },
  style: {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg"],
        tileSize: 256,
        maxzoom: 15,
        attribution:
          'Sentinel-2 cloudless – <a href="https://s2maps.eu">s2maps.eu</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2024)',
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap", paint: { "raster-brightness-max": 0.8 } }],
  },
};
const map = new maplibregl.Map(options);

const filter = (year: number): maplibregl.FilterSpecification =>
  ["all", ["==", ["get", "level"], level], ["==", ["get", "year"], year], ["==", ["get", "scenario"], scenario]];

const m = (x: number) => `${x < 0 ? "−" : "+"}${Math.abs(x).toLocaleString("id-ID", { maximumFractionDigits: 2 })} m`;
function levelText() {
  if (!meta) return;
  const real = meta.dailyPrecision ? `±${Math.max(1, Math.round(meta.dailyPrecision * 10))} dari 10` : "sebagian kecil";
  $("levelText").textContent = {
    rob: `Biru muda = tanah di bawah pasang tertinggi (${m(meta.highestTide)}). Tanpa tanggul dan pompa, kena rob beberapa kali setahun. Belum tentu tergenang.`,
    daily: `Biru muda = tanah di bawah pasang harian (${m(meta.dailyHighTide)}). Tanpa tanggul dan pompa, terendam tiap pasang. Uji Mundur 2017–2025: hanya ${real} area seperti ini yang benar-benar jadi air, sisanya masih darat berkat tanggul, pompa, urugan, atau tambak.`,
  }[level];
}

/** The part of the map the panels don't cover. */
function visible() {
  const sheet = $("sheet").getBoundingClientRect();
  const wide = innerWidth >= 900;
  return { top: $("top").getBoundingClientRect().bottom + 12, left: 16,
    right: wide ? innerWidth - sheet.left + 16 : 16, bottom: wide ? 16 : innerHeight - sheet.top + 16 };
}
function fitArea(animate: boolean) {
  map.fitBounds([[AREA[0], AREA[1]], [AREA[2], AREA[3]]], { padding: visible(), animate });
}

/** Area Bawah Pasang, Air Nyata, Tanggul and both Garis Pantai, on the main map and on the compare map. */
function addDataLayers(target: maplibregl.Map) {
  target.addSource("belowTide", {
    type: "geojson",
    data: `/data/below-tide-${level}.geojson`,
    attribution: "Data: Sentinel-1 via ASF HyP3, DeltaDTM (Deltares), pasang IOC Semarang",
  });
  target.addLayer({ id: "belowTide", type: "fill", source: "belowTide", filter: filter(NOW),
    paint: { "fill-color": "#4da3ff", "fill-opacity": 0.45, "fill-opacity-transition": { duration: reducedMotion ? 0 : 300 } } });
  target.addSource("water", { type: "geojson", data: "/data/water-2025.geojson", attribution: "Air 2025: Sentinel-2 (ESA)" });
  target.addLayer({ id: "water", type: "fill", source: "water", paint: { "fill-color": "#123f86", "fill-opacity": 0.9 } });
  target.addSource("dikes", { type: "geojson", data: "/data/dikes.geojson", attribution: "Tanggul © OpenStreetMap contributors (ODbL)" });
  target.addLayer({ id: "dikes", type: "line", source: "dikes",
    paint: { "line-color": "#9a9a9a", "line-width": 2, "line-dasharray": [2, 1.5] } });
  target.addLayer({ id: "coastNow", type: "line", source: "belowTide", filter: filter(NOW),
    paint: { "line-color": "#ffffff", "line-width": 2 } });
  target.addLayer({ id: "coastYear", type: "line", source: "belowTide", filter: filter(NOW),
    paint: { "line-color": "#ffb829", "line-width": 2, "line-dasharray": [3, 2] } });
}

function showYear(target: maplibregl.Map, year: number) {
  if (!target.getLayer("belowTide")) return;
  target.setFilter("belowTide", filter(year));
  target.setFilter("coastYear", year === NOW ? ["==", ["get", "year"], -1] : filter(year)); // same as coastNow in 2026
  target.setFilter("coastNow", filter(NOW));
}

map.on("load", async () => {
  if (fromHash) map.jumpTo({ center: [hashLon, hashLat], zoom: hashZoom, padding: visible() });
  else fitArea(false);
  addDataLayers(map);
  setYear(Number(slider.value));

  const [loadedMeta, pts] = await Promise.all([
    fetch("/data/meta.json").then((r) => r.json() as Promise<Meta>),
    fetch("/data/points.json").then((r) => r.json() as Promise<Points>),
  ]);
  points = pts;
  meta = loadedMeta;
  levelText();
  showCard(); // a point picked from the link before the data arrived
  showTideBanner($("tide"), meta.highestTide).catch(() => {}); // no banner beats a broken one
  $("unvalidated").hidden = meta.validated;
  $("source").textContent = `Data: Sentinel-1 (InSAR), DeltaDTM, pasang IOC Semarang. Diperbarui ${new Date(meta.updated).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.${meta.validated ? "" : " Belum lulus Uji Mundur: angka bisa berubah."}`;
});

function setYear(year: number) {
  slider.value = String(year);
  $("yearOut").textContent = $("cmpA").textContent = String(year);
  slider.setAttribute("aria-valuetext", `Tahun ${year}, perkiraan`);
  showCard(); // Tinggi Tanah in the card follows the year
  writeHash();
  showYear(map, year);
  if (compare) showYear(compare.map, Number(sliderB.value)); // Skenario and tingkat changes reach the right side too
}
slider.addEventListener("input", () => setYear(Number(slider.value)));

let timer: number | undefined;
$("play").addEventListener("click", () => {
  clearInterval(timer);
  let year = Number(slider.value) >= Number(slider.max) ? NOW : Number(slider.value);
  if (reducedMotion) return setYear(Number(slider.max));
  setYear(year);
  timer = window.setInterval(() => {
    if (++year > Number(slider.max)) return clearInterval(timer);
    setYear(year);
  }, 300);
});

let lastTap: [number, number] | null = null;

/** The tapped point if there is one, so the receiver of a link sees the same Kartu titik; else the map center. */
function writeHash() {
  const [lon, lat] = lastTap ?? map.getCenter().toArray();
  history.replaceState(null, "", `#${lat.toFixed(5)},${lon.toFixed(5)},${map.getZoom().toFixed(2)},${slider.value},${scenario}`);
}
map.on("moveend", writeHash);
function showCard() {
  if (!lastTap) return;
  const [lon, lat] = lastTap;
  const inside = lon >= AREA[0] && lon <= AREA[2] && lat >= AREA[1] && lat <= AREA[3];
  $("card").innerHTML = cardHtml(points, points && inside ? nearest(points, lon, lat) : null, scenario, Number(slider.value), inside);
}

function toggleGroup(attr: string, onPick: (value: string) => void) {
  const buttons = document.querySelectorAll<HTMLButtonElement>(`[${attr}]`);
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      buttons.forEach((x) => {
        x.classList.toggle("on", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      onPick(b.getAttribute(attr)!);
      setYear(Number(slider.value));
      showCard();
    }),
  );
}
toggleGroup("data-level", (v) => {
  level = v as Level;
  levelText();
  for (const target of compare ? [map, compare.map] : [map])
    (target.getSource("belowTide") as maplibregl.GeoJSONSource | undefined)?.setData(`/data/below-tide-${level}.geojson`);
});
toggleGroup("data-scenario", (v) => { scenario = v as Scenario; });

const marker = new maplibregl.Marker({ element: Object.assign(document.createElement("div"), { className: "pin" }) });
function pick(lon: number, lat: number) {
  lastTap = [lon, lat];
  marker.setLngLat(lastTap).addTo(map);
  showCard();
  writeHash();
}
map.on("click", (e: maplibregl.MapMouseEvent) => pick(e.lngLat.lng, e.lngLat.lat));

if (fromHash) {
  if (shared[4] === "stop") document.querySelector<HTMLButtonElement>('[data-scenario="stop"]')?.click();
  setYear(Math.min(Math.max(Math.round(hashYear), Number(slider.min)), Number(slider.max)));
  pick(hashLon, hashLat);
}

const results = $<HTMLUListElement>("results");
$<HTMLFormElement>("search").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $<HTMLInputElement>("q").value.trim();
  if (!q) return;
  results.hidden = false;
  results.innerHTML = `<li class="caption">Mencari…</li>`;
  let places;
  try {
    places = await searchPlaces(q, AREA);
  } catch {
    results.innerHTML = `<li class="caption">Pencarian gagal. Coba lagi sebentar lagi.</li>`;
    return;
  }
  if (!places.length) {
    results.innerHTML = `<li class="caption">Tidak ditemukan di Wilayah Cakupan (Demak dan Semarang).</li>`;
    return;
  }
  results.replaceChildren(...places.map((p) => {
    const b = Object.assign(document.createElement("button"), { type: "button", className: "result", textContent: p.name });
    b.addEventListener("click", () => {
      results.hidden = true;
      (document.activeElement as HTMLElement | null)?.blur(); // close the phone keyboard
      const view = { center: [p.lon, p.lat] as [number, number], zoom: 15, padding: visible() };
      if (reducedMotion) map.jumpTo(view); else map.flyTo({ ...view, duration: 1200 });
      pick(p.lon, p.lat);
    });
    const li = document.createElement("li");
    li.append(b);
    return li;
  }));
});

// Geser bandingkan: left side follows the main slider, right side its own small slider (USERFLOW.md §3).
function setYearB(year: number) {
  sliderB.value = String(year);
  $("yearBOut").textContent = $("cmpB").textContent = String(year);
  if (compare) showYear(compare.map, year);
}
sliderB.addEventListener("input", () => setYearB(Number(sliderB.value)));
$("compareBtn").addEventListener("click", (e) => {
  const on = document.body.classList.toggle("comparing");
  (e.currentTarget as HTMLElement).setAttribute("aria-pressed", String(on));
  $("compareRow").hidden = !on;
  if (!on) return compare?.close();
  if (!compare) {
    compare = compareMap(map, options, $("map2"), $("divider"));
    compare.map.on("load", () => { addDataLayers(compare!.map); setYearB(Number(sliderB.value)); });
  }
  const sheet = $("sheet").getBoundingClientRect();
  compare.open(innerWidth >= 900 ? sheet.left / 2 : innerWidth / 2); // middle of the map the panel leaves visible
});
