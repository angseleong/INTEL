import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { cardHtml, nearest, type Level, type Points, type Scenario } from "./pointCard";

type Meta = { updated: string; years: [number, number]; highestTide: number; dailyHighTide: number; dailyLowTide: number; validated: boolean };

const AREA = [110.3, -7.02, 110.65, -6.82] as const; // Wilayah Cakupan, same box as the pipeline
const NOW = 2026;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const slider = $<HTMLInputElement>("year");
let scenario: Scenario = "continue";
let level: Level = "rob";
let meta: Meta | null = null;
let points: Points | null = null;

maplibregl.setWorkerUrl(workerUrl); // Vite serves the worker as its own file

const map = new maplibregl.Map({
  container: "map",
  center: [110.47, -6.93],
  zoom: 11,
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
});

const filter = (year: number): maplibregl.FilterSpecification =>
  ["all", ["==", ["get", "level"], level], ["==", ["get", "year"], year], ["==", ["get", "scenario"], scenario]];

const m = (x: number) => `${x < 0 ? "−" : "+"}${Math.abs(x).toLocaleString("id-ID", { maximumFractionDigits: 2 })} m`;
function levelText() {
  if (!meta) return;
  $("levelText").textContent = {
    rob: `Biru = tanah di bawah Pasang Tertinggi (${m(meta.highestTide)}). Tanpa tanggul dan pompa, kena Rob beberapa kali setahun.`,
    flooded: `Biru = tanah di bawah Pasang Harian (${m(meta.dailyHighTide)}). Tanpa tanggul dan pompa, terendam tiap kali pasang.`,
    lost: `Biru = tanah di bawah Surut Harian (${m(meta.dailyLowTide)}). Tanpa tanggul dan pompa, air tidak pernah surut lagi.`,
  }[level];
}

// Keep the Wilayah Cakupan in the part of the map the panel doesn't cover.
function fitArea(animate: boolean) {
  const sheet = $("sheet").getBoundingClientRect();
  const wide = innerWidth >= 900;
  map.fitBounds([[AREA[0], AREA[1]], [AREA[2], AREA[3]]], {
    padding: { top: 48, left: 16, right: wide ? innerWidth - sheet.left + 16 : 16, bottom: wide ? 16 : innerHeight - sheet.top + 16 },
    animate,
  });
}
addEventListener("resize", () => fitArea(false));

map.on("load", async () => {
  fitArea(false);
  map.addSource("belowTide", {
    type: "geojson",
    data: `/data/below-tide-${level}.geojson`,
    attribution: "Data: Sentinel-1 via ASF HyP3, DeltaDTM (Deltares), pasang IOC Semarang",
  });
  map.addLayer({ id: "belowTide", type: "fill", source: "belowTide", filter: filter(NOW),
    paint: { "fill-color": "#4da3ff", "fill-opacity": 0.45, "fill-opacity-transition": { duration: reducedMotion ? 0 : 300 } } });
  map.addLayer({ id: "coastNow", type: "line", source: "belowTide", filter: filter(NOW),
    paint: { "line-color": "#ffffff", "line-width": 2 } });
  map.addLayer({ id: "coastYear", type: "line", source: "belowTide", filter: filter(NOW),
    paint: { "line-color": "#ffb829", "line-width": 2, "line-dasharray": [3, 2] } });

  const [loadedMeta, pts] = await Promise.all([
    fetch("/data/meta.json").then((r) => r.json() as Promise<Meta>),
    fetch("/data/points.json").then((r) => r.json() as Promise<Points>),
  ]);
  points = pts;
  meta = loadedMeta;
  levelText();
  $("unvalidated").hidden = meta.validated;
  $("source").textContent = `Data: Sentinel-1 (InSAR), DeltaDTM, pasang IOC Semarang. Diperbarui ${new Date(meta.updated).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.${meta.validated ? "" : " Belum lulus Uji Mundur: angka bisa berubah."}`;
});

function setYear(year: number) {
  slider.value = String(year);
  $("yearOut").textContent = String(year);
  slider.setAttribute("aria-valuetext", `Tahun ${year}, perkiraan`);
  if (!map.getLayer("belowTide")) return;
  map.setFilter("belowTide", filter(year));
  map.setFilter("coastYear", year === NOW ? ["==", ["get", "year"], -1] : filter(year)); // same as coastNow in 2026
  map.setFilter("coastNow", filter(NOW));
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
function showCard() {
  if (!lastTap) return;
  const [lon, lat] = lastTap;
  const inside = lon >= AREA[0] && lon <= AREA[2] && lat >= AREA[1] && lat <= AREA[3];
  $("card").innerHTML = cardHtml(points, points && inside ? nearest(points, lon, lat) : null, scenario, inside);
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
  (map.getSource("belowTide") as maplibregl.GeoJSONSource | undefined)?.setData(`/data/below-tide-${level}.geojson`);
});
toggleGroup("data-scenario", (v) => { scenario = v as Scenario; });

const marker = new maplibregl.Marker({ element: Object.assign(document.createElement("div"), { className: "pin" }) });
map.on("click", (e: maplibregl.MapMouseEvent) => {
  lastTap = [e.lngLat.lng, e.lngLat.lat];
  marker.setLngLat(e.lngLat).addTo(map);
  showCard();
});
