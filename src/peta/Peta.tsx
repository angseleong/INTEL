// Halaman Peta (docs/USERFLOW.md §2–4) in the Laut Malam style: full-screen map, Kartu titik in a bottom sheet
// on phones and a right panel from 900px, year slider + Play, Skenario, tingkat, pencarian, URL hash, Bandingkan.
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { cardInfo, nearest, type Level, type Points, type Scenario } from "../pointCard";
import { searchPlaces, type Place } from "../search";
import { weekHigh, type WeekHigh } from "../tide";
import { compareMap } from "../compare";
import { mapWater } from "../sea/mapWater";
import { AREA, LAST, NOW, addDataLayers, mapOptions, setLevel, showYear } from "./layers";
import { Label, PointCard } from "./PointCard";

type Meta = { updated: string; highestTide: number; dailyHighTide: number; validated: boolean; dailyPrecision: number | null };
type Search = { state: "idle" | "loading" | "error" | "empty" } | { state: "ok"; places: Place[] };

maplibregl.setWorkerUrl(workerUrl); // Vite serves the worker as its own file
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Link yang bisa dibagikan: #lat,lon,zoom,tahun,skenario (docs/ARCHITECTURE.md §5)
const shared = location.hash.slice(1).split(",");
const [hashLat, hashLon, hashZoom, hashYear] = shared.map(Number);
const fromHash = shared.length >= 4 && [hashLat, hashLon, hashZoom, hashYear].every(Number.isFinite);
const clampYear = (y: number) => Math.min(Math.max(Math.round(y), NOW), LAST);

const glass = "border border-hairline bg-glass-map backdrop-blur-[18px]";
const m = (x: number) => `${x < 0 ? "−" : "+"}${Math.abs(x).toLocaleString("id-ID", { maximumFractionDigits: 2 })} m`;

function useWide() {
  const q = "(min-width: 900px)";
  const [wide, setWide] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const f = () => setWide(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return wide;
}

function Toggle<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full bg-[rgb(200_225_235/0.06)] p-1">
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}
          className={`h-11 flex-1 rounded-full text-sm transition-colors duration-150 ${v === value ? "bg-moon font-medium text-ink" : "font-light text-mist"}`}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function Peta() {
  const wide = useWide();
  const mapEl = useRef<HTMLDivElement>(null);
  const map2El = useRef<HTMLDivElement>(null);
  const dividerEl = useRef<HTMLDivElement>(null);
  const topEl = useRef<HTMLElement>(null);
  const sheetEl = useRef<HTMLElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const compareRef = useRef<ReturnType<typeof compareMap> | null>(null);
  const waterRef = useRef<ReturnType<typeof mapWater>>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const [ready, setReady] = useState(false);
  const [year, setYear] = useState(fromHash ? clampYear(hashYear) : NOW);
  const [yearB, setYearB] = useState(LAST);
  const [scenario, setScenario] = useState<Scenario>(fromHash && shared[4] === "stop" ? "stop" : "continue");
  const [level, setLevelState] = useState<Level>("rob");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [points, setPoints] = useState<Points | null>(null);
  const [kelurahan, setKelurahan] = useState<string[][]>([]); // [code, name, kecamatan, kota], indexed by points.kelurahan
  const [tap, setTap] = useState<[number, number] | null>(fromHash ? [hashLon, hashLat] : null);
  const [comparing, setComparing] = useState(false);
  const [tide, setTide] = useState<WeekHigh | null>(null);
  const [search, setSearch] = useState<Search>({ state: "idle" });
  const [query, setQuery] = useState("");

  const now = useRef({ year, scenario, tap, level, yearB });
  now.current = { year, scenario, tap, level, yearB };

  /** The part of the map the panels don't cover. */
  const visible = () => {
    const top = topEl.current!.getBoundingClientRect();
    const sheet = sheetEl.current!.getBoundingClientRect();
    const isWide = innerWidth >= 900;
    return { top: top.bottom + 12, left: 16, right: isWide ? innerWidth - sheet.left + 16 : 16, bottom: isWide ? 120 : innerHeight - sheet.top + 16 };
  };

  /** The tapped point if there is one, so the receiver of a link sees the same Kartu titik; else the map centre. */
  const writeHash = () => {
    const map = mapRef.current;
    if (!map) return;
    const { tap, year, scenario } = now.current;
    const [lon, lat] = tap ?? map.getCenter().toArray();
    history.replaceState(null, "", `#${lat.toFixed(5)},${lon.toFixed(5)},${map.getZoom().toFixed(2)},${year},${scenario}`);
  };

  const pick = (lon: number, lat: number) => {
    setTap([lon, lat]);
    markerRef.current?.setLngLat([lon, lat]).addTo(mapRef.current!);
    waterRef.current?.tap(lon, lat);
  };

  useEffect(() => {
    const center: [number, number] = fromHash ? [hashLon, hashLat] : [110.47, -6.93];
    const map = new maplibregl.Map(mapOptions(mapEl.current!, center, fromHash ? hashZoom : 11));
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    markerRef.current = new maplibregl.Marker({ element: Object.assign(document.createElement("div"), { className: "pin" }) });
    if (import.meta.env.DEV) Object.assign(window, { map }); // for poking at it from the console

    map.on("load", () => {
      // compact attribution opens itself on small screens, over the sheet; close it once the map has settled
      map.once("idle", () => map.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"));
      addDataLayers(map, now.current.level);
      if (fromHash) map.jumpTo({ center, zoom: hashZoom, padding: visible() });
      else map.fitBounds([[AREA[0], AREA[1]], [AREA[2], AREA[3]]], { padding: visible(), animate: false });
      if (now.current.tap) markerRef.current!.setLngLat(now.current.tap).addTo(map);
      setReady(true);
      fetch("/data/water-2025.geojson").then((r) => r.json()).then((data) => {
        if (!mapRef.current) return;
        waterRef.current = mapWater(map, data, AREA);
        if (waterRef.current) map.setPaintProperty("water", "fill-opacity", 0); // the sea layer draws it instead
        if (waterRef.current && now.current.tap) waterRef.current.tap(...now.current.tap);
      }).catch(() => {}); // the plain fill stays
    });
    map.on("moveend", writeHash);
    map.on("click", (e) => pick(e.lngLat.lng, e.lngLat.lat));

    Promise.all([
      fetch("/data/meta.json").then((r) => r.json() as Promise<Meta>),
      fetch("/data/points.json").then((r) => r.json() as Promise<Points>),
      fetch("/data/kelurahan.json").then((r) => r.json() as Promise<string[][]>).catch(() => []), // names only: the card works without
    ]).then(([meta, pts, kel]) => { setMeta(meta); setPoints(pts); setKelurahan(kel); });
    weekHigh().then(setTide).catch(() => {}); // no banner beats a broken one

    return () => {
      clearInterval(timer.current);
      waterRef.current?.destroy();
      compareRef.current?.map.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    showYear(mapRef.current!, level, scenario, year);
    if (compareRef.current) showYear(compareRef.current.map, level, scenario, yearB); // Skenario and tingkat reach the right side too
    writeHash();
  }, [ready, year, yearB, level, scenario, tap]);

  useEffect(() => {
    if (!ready) return;
    setLevel(mapRef.current!, level);
    if (compareRef.current) setLevel(compareRef.current.map, level);
  }, [ready, level]);

  const info = useMemo(() => {
    if (!tap) return null;
    const [lon, lat] = tap;
    const inside = lon >= AREA[0] && lon <= AREA[2] && lat >= AREA[1] && lat <= AREA[3];
    return cardInfo(points, points && inside ? nearest(points, lon, lat) : null, scenario, year, inside);
  }, [tap, points, scenario, year]);
  const place = useMemo(() => {
    if (!tap || !points || !info || info.kind === "outside" || info.kind === "nodata") return undefined;
    const i = nearest(points, tap[0], tap[1]);
    return i === null ? undefined : kelurahan[points.kelurahan[i]];
  }, [info, tap, points, kelurahan]);

  const play = () => {
    clearInterval(timer.current);
    if (still) return setYear(LAST);
    let y = year >= LAST ? NOW : year;
    setYear(y);
    timer.current = window.setInterval(() => {
      if (++y > LAST) return clearInterval(timer.current);
      setYear(y);
    }, 300);
  };

  const toggleCompare = () => {
    const map = mapRef.current!;
    const on = !comparing;
    setComparing(on);
    if (!on) return compareRef.current?.close();
    if (!compareRef.current) {
      const c = compareMap(map, mapOptions(map2El.current!, map.getCenter().toArray() as [number, number], map.getZoom()), map2El.current!, dividerEl.current!);
      compareRef.current = c;
      c.map.on("load", () => {
        addDataLayers(c.map, now.current.level);
        showYear(c.map, now.current.level, now.current.scenario, now.current.yearB);
      });
    }
    const sheet = sheetEl.current!.getBoundingClientRect();
    compareRef.current.open(innerWidth >= 900 ? sheet.left / 2 : innerWidth / 2); // middle of the map the panel leaves visible
  };

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearch({ state: "loading" });
    try {
      const places = await searchPlaces(q, AREA);
      setSearch(places.length ? { state: "ok", places } : { state: "empty" });
    } catch {
      setSearch({ state: "error" });
    }
  };
  const goTo = (p: Place) => {
    setSearch({ state: "idle" });
    (document.activeElement as HTMLElement | null)?.blur(); // close the phone keyboard
    const view = { center: [p.lon, p.lat] as [number, number], zoom: 15, padding: visible() };
    if (still) mapRef.current!.jumpTo(view); else mapRef.current!.flyTo({ ...view, duration: 1200 });
    pick(p.lon, p.lat);
  };

  const levelText = meta && {
    rob: `Toska = tanah di bawah pasang tertinggi (${m(meta.highestTide)}). Tanpa Tanggul dan pompa, kena rob beberapa kali setahun. Belum tentu tergenang.`,
    daily: `Toska = tanah di bawah pasang harian (${m(meta.dailyHighTide)}). Tanpa Tanggul dan pompa, terendam tiap pasang. Uji Mundur 2017–2025: hanya ${meta.dailyPrecision ? `±${Math.max(1, Math.round(meta.dailyPrecision * 10))} dari 10` : "sebagian kecil"} area seperti ini yang benar-benar jadi air, sisanya masih darat berkat Tanggul, pompa, urugan, atau tambak.`,
  }[level];
  const updated = meta && new Date(meta.updated).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const timeBar = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" onClick={play} aria-label="Putar tahun sampai 2050"
          className="grid size-[52px] flex-none place-items-center rounded-full bg-moon shadow-[0_0_20px_rgb(243_234_210/0.25)] transition-transform duration-150 active:scale-95">
          <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.5L13.5 8L5 13.5Z" fill="#06121a" /></svg>
        </button>
        <div className="flex min-w-[76px] flex-col">
          <span className="text-[30px] leading-none font-light tracking-[-0.03em]">{year}</span>
          <span className="text-[11px] font-light text-haze">perkiraan</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <input className="range" type="range" min={NOW} max={LAST} step={1} value={year} aria-label="Tahun"
            aria-valuetext={`Tahun ${year}, perkiraan`} onChange={(e) => setYear(Number(e.target.value))} />
          <div className="flex justify-between text-[11px] font-light text-haze"><span>{NOW}</span><span>{LAST}</span></div>
        </div>
        <button type="button" aria-pressed={comparing} onClick={toggleCompare}
          className={`h-11 basis-full rounded-full border px-4 text-[13px] wide:basis-auto wide:flex-none ${comparing ? "border-moon bg-moon font-medium text-ink" : "border-[rgb(200_225_235/0.2)] text-mist"}`}>
          Bandingkan
        </button>
      </div>
      {comparing && (
        <div className="flex items-center gap-4 pl-1">
          <span className="w-[120px] text-xs font-light text-haze">Kanan: <b className="text-base font-normal text-gold">{yearB}</b></span>
          <input className="range" type="range" min={NOW} max={LAST} step={1} value={yearB} aria-label="Tahun sisi kanan"
            onChange={(e) => setYearB(Number(e.target.value))} />
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-night font-sans text-foam">
      {/* wrappers: maplibre-gl.css sets the map container to position: relative, which beats Tailwind's layered utilities */}
      <div className="absolute inset-0"><div ref={mapEl} className="size-full" aria-label="Peta Area Bawah Pasang Demak–Semarang" /></div>
      <div className="pointer-events-none absolute inset-0"><div ref={map2El} hidden aria-hidden="true" className="size-full" /></div>
      <div ref={dividerEl} hidden role="slider" tabIndex={0} aria-label="Garis pembatas bandingkan" aria-valuemin={0} aria-valuemax={100}
        className="fixed top-0 bottom-0 -left-[22px] flex w-11 cursor-ew-resize touch-none justify-center">
        <span className="h-full w-0.5 bg-moon shadow-[0_0_12px_rgb(243_234_210/0.6)]" />
        <span className="absolute top-[35%] grid size-11 -translate-y-1/2 place-items-center rounded-full bg-moon text-ink" aria-hidden="true">‹ ›</span>
        <span className="absolute top-[22%] right-[34px] text-[30px] font-light">{year}</span>
        <span className="absolute top-[22%] left-[34px] text-[30px] font-light text-gold">{yearB}</span>
      </div>

      <header ref={topEl} className="pointer-events-none fixed top-3 right-3 left-3 flex flex-col gap-2 wide:right-[calc(380px+24px)] wide:max-w-[640px]">
        <div className="flex items-center gap-2">
          <a href="/" className={`${glass} pointer-events-auto flex h-[52px] flex-none items-center gap-2.5 rounded-full px-[18px] text-sm font-semibold tracking-[0.08em] text-foam no-underline`}>
            <span className="size-[11px] rounded-full bg-moon shadow-[0_0_10px_rgb(243_234_210/0.6)]" />INTEL
          </a>
          <form role="search" onSubmit={onSearch} className={`${glass} pointer-events-auto flex h-[52px] min-w-0 flex-1 items-center gap-2.5 rounded-full px-[18px]`}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#c7d3d6" strokeWidth="1.5" aria-hidden="true"><circle cx="7" cy="7" r="5" /><path d="M11 11L14.5 14.5" /></svg>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari alamat atau kelurahan"
              aria-label="Cari alamat atau kelurahan" enterKeyHint="search" autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent text-base font-light text-foam outline-none placeholder:text-haze" />
          </form>
        </div>
        {search.state !== "idle" && (
          <ul className={`${glass} pointer-events-auto m-0 list-none rounded-3xl p-1.5`}>
            {search.state === "ok" ? search.places.map((p) => (
              <li key={`${p.lon},${p.lat}`}>
                <button type="button" onClick={() => goTo(p)} className="block min-h-11 w-full rounded-2xl px-3 py-2 text-left text-[15px] font-light text-foam hover:bg-[rgb(200_225_235/0.08)]">{p.name}</button>
              </li>
            )) : (
              <li className="px-3 py-2 text-xs font-light text-mist">
                {{ loading: "Mencari…", error: "Pencarian gagal. Coba lagi sebentar lagi.", empty: "Tidak ditemukan di Wilayah Cakupan (Demak dan Semarang)." }[search.state]}
              </li>
            )}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {tide && (
            <p className={`${glass} pointer-events-auto m-0 flex items-center gap-2 rounded-full px-4 py-2 text-xs whitespace-nowrap`}>
              <span className="size-2 rounded-full bg-gold" />
              <span className="text-haze">Pasang tinggi<span className="hidden wide:inline"> minggu ini</span></span>
              <span className="font-medium">{tide.when} WIB · ±{tide.height.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m</span>
            </p>
          )}
          {meta && !meta.validated && <span className={`${glass} rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-gold`}>Belum tervalidasi</span>}
        </div>
        <p className="m-0 pl-1 text-xs font-light text-mist [text-shadow:0_0_6px_#050b10]">Wilayah Cakupan: sementara baru Semarang &amp; Demak</p>
      </header>

      {wide && <div className={`${glass} fixed right-[calc(380px+16px)] bottom-4 left-4 max-w-[760px] rounded-[30px] py-3 pr-5 pl-3`}>{timeBar}</div>}

      <aside ref={sheetEl} aria-live="polite"
        className={`${glass} fixed right-2 bottom-2 left-2 flex max-h-[52svh] flex-col gap-5 overflow-y-auto rounded-[28px] p-4
          wide:top-0 wide:right-0 wide:bottom-0 wide:left-auto wide:max-h-none wide:w-[380px] wide:rounded-none wide:border-y-0 wide:border-r-0 wide:bg-night-panel wide:p-6`}>
        <PointCard info={info} place={place} />
        {!wide && timeBar}
        <div className="flex flex-col gap-2.5">
          <Label>Skenario</Label>
          <Toggle label="Skenario" value={scenario} onChange={setScenario}
            options={[["continue", "Lanjut"], ["stop", "Henti"]]} />
          <p className="m-0 text-xs font-light text-haze">
            {scenario === "continue" ? "Tanah terus turun secepat sekarang." : "Pengambilan air tanah dihentikan mulai 2027, tanah berhenti turun dalam 10 tahun."}
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <Label>Tingkat</Label>
          <Toggle label="Tingkat" value={level} onChange={setLevelState}
            options={[["rob", "Rob"], ["daily", "Pasang harian"]]} />
          {levelText && <p className="m-0 text-xs leading-relaxed font-light text-haze">{levelText}</p>}
        </div>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-xs text-mist">
          <li className="flex items-center gap-2.5"><span className="size-3 flex-none rounded border border-[rgb(200_225_235/0.3)] bg-[radial-gradient(circle_at_70%_30%,rgb(243_234_210/0.7),transparent_40%),#0a2633]" />Air sungguhan menurut foto satelit 2025, termasuk tambak</li>
          <li className="flex items-center gap-2.5"><span className="size-3 flex-none rounded bg-linear-to-b from-tide-glow to-tide-deep opacity-75" />Di bawah {level === "rob" ? "Pasang Tertinggi" : "pasang harian"}, {year}</li>
          <li className="flex items-center gap-2.5"><span className="w-3 flex-none border-t-2 border-foam" />Garis pantai {NOW}</li>
          <li className="flex items-center gap-2.5"><span className="w-3 flex-none border-t-2 border-dotted border-gold" />Garis pantai {year}</li>
          <li className="flex items-center gap-2.5"><span className="w-3 flex-none border-t-2 border-dashed border-haze" />Tanggul menurut OpenStreetMap. Hanya letaknya: INTEL tidak menghitung apa yang ditahannya.</li>
        </ul>
        {updated && <p className="m-0 text-[11px] leading-normal font-light text-driftwood">Data: Sentinel-1 (InSAR), DeltaDTM, pasang IOC Semarang. Diperbarui {updated}.</p>}
        <nav className="mt-auto flex flex-wrap gap-x-5 border-t border-hairline pt-3 text-sm">
          <a href="/upaya.html" className="flex min-h-11 items-center text-moon">Apa yang bisa dilakukan?</a>
          <a href="/peliput.html" className="flex min-h-11 items-center text-haze no-underline">Peliput</a>
          <a href="/tentang.html" className="flex min-h-11 items-center text-haze no-underline">Tentang</a>
        </nav>
      </aside>
    </div>
  );
}
