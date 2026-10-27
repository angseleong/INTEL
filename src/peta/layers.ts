// MapLibre setup for the Peta (docs/DESIGN.md "Lapisan Peta"): darkened satellite basemap and the data layers.
import * as maplibregl from "maplibre-gl";
import type { Level, Scenario } from "../pointCard";

export const AREA = [110.3, -7.02, 110.65, -6.82] as const; // Wilayah Cakupan, same box as the pipeline
export const NOW = 2026;
export const LAST = 2050;

export function mapOptions(container: HTMLElement, center: [number, number], zoom: number): maplibregl.MapOptions {
  return {
    container, center, zoom,
    minZoom: 8,
    maxZoom: 17,
    dragRotate: false, // north stays up: easier to read for Pengunjung, and the compare map only syncs centre and zoom
    pitchWithRotate: false,
    touchPitch: false,
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
      // night: darker and less saturated, so the data and the water are what glows
      layers: [{ id: "basemap", type: "raster", source: "basemap", paint: { "raster-brightness-max": 0.55, "raster-saturation": -0.45 } }],
    },
  };
}

const filter = (level: Level, scenario: Scenario, year: number): maplibregl.FilterSpecification =>
  ["all", ["==", ["get", "level"], level], ["==", ["get", "year"], year], ["==", ["get", "scenario"], scenario]];
const NONE: maplibregl.FilterSpecification = ["==", ["get", "year"], -1];

/** Area Bawah Pasang, Air Nyata, Tanggul and both Garis Pantai, on the main map and on the compare map. */
export function addDataLayers(map: maplibregl.Map, level: Level) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  map.addSource("belowTide", {
    type: "geojson",
    data: `/data/below-tide-${level}.geojson`,
    attribution: "Data: Sentinel-1 via ASF HyP3, DeltaDTM (Deltares), pasang IOC Semarang",
  });
  map.addLayer({ id: "belowTide", type: "fill", source: "belowTide", filter: NONE,
    paint: { "fill-color": "#2fd2c4", "fill-opacity": 0.3, "fill-opacity-transition": { duration: still ? 0 : 300 } } });
  map.addLayer({ id: "belowTideGlow", type: "line", source: "belowTide", filter: NONE,
    paint: { "line-color": "#3cf0d0", "line-width": 7, "line-blur": 7, "line-opacity": 0.35 } });
  map.addSource("water", { type: "geojson", data: "/data/water-2025.geojson", attribution: "Air 2025: Sentinel-2 (ESA)" });
  map.addLayer({ id: "water", type: "fill", source: "water", paint: { "fill-color": "#0a2633", "fill-opacity": 0.9 } });
  map.addSource("dikes", { type: "geojson", data: "/data/dikes.geojson", attribution: "Tanggul © OpenStreetMap contributors (ODbL)" });
  map.addLayer({ id: "dikes", type: "line", source: "dikes", paint: { "line-color": "#b3c2c6", "line-width": 2.5, "line-dasharray": [2, 1.5] } });
  map.addLayer({ id: "coastNow", type: "line", source: "belowTide", filter: NONE,
    paint: { "line-color": "#eef3f2", "line-width": 1.6, "line-opacity": 0.85 } });
  map.addLayer({ id: "coastYear", type: "line", source: "belowTide", filter: NONE,
    layout: { "line-cap": "round" }, paint: { "line-color": "#f2cf8a", "line-width": 2.5, "line-dasharray": [0, 2.5] } });
}

export function showYear(map: maplibregl.Map, level: Level, scenario: Scenario, year: number) {
  if (!map.getLayer("belowTide")) return;
  map.setFilter("belowTide", filter(level, scenario, year));
  map.setFilter("belowTideGlow", filter(level, scenario, year));
  map.setFilter("coastNow", filter(level, scenario, NOW));
  map.setFilter("coastYear", year === NOW ? NONE : filter(level, scenario, year)); // same line as coastNow in 2026
}

export function setLevel(map: maplibregl.Map, level: Level) {
  (map.getSource("belowTide") as maplibregl.GeoJSONSource | undefined)?.setData(`/data/below-tide-${level}.geojson`);
}
