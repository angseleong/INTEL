// Halaman pembuka (FR-0, USERFLOW.md §1.1): scrollytelling over the main map, before it becomes interactive.
// B1 water rises, B2 background deepens, B3 map flies between cities, B4 photos and 2017/2025 sliders.
// GSAP lives only here (ADR-0006); main.ts imports this file dynamically, so a shared link never loads it.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Map } from "maplibre-gl";

const CITIES: [string, number, number][] = [ // sinking coastal cities, DATA.md §6
  ["Jakarta", 106.85, -6.13], ["Bekasi", 107.0, -6.24], ["Subang", 107.76, -6.57], ["Indramayu", 108.32, -6.33],
  ["Cirebon", 108.55, -6.71], ["Tegal", 109.14, -6.87], ["Pemalang", 109.38, -6.89], ["Pekalongan", 109.67, -6.89],
  ["Semarang", 110.42, -6.97], ["Demak", 110.64, -6.89], ["Medan", 98.67, 3.59],
];
const VIEWS = {
  java: { center: [109.2, -6.6] as [number, number], zoom: innerWidth < 600 ? 5.6 : 6.6 },
  cities: { center: [108.6, -6.5] as [number, number], zoom: innerWidth < 600 ? 5.4 : 6.4 },
  coverage: { center: [110.5, -6.92] as [number, number], zoom: innerWidth < 600 ? 9.4 : 10.4 },
};
const SKY = "rgb(223 233 239 / 0.8)", DEEP = "rgb(11 42 74 / 0.62)", VOID = "rgb(0 0 0 / 1)";

export function runIntro(map: Map, done: (city: string | null) => void) {
  const $ = (id: string) => document.getElementById(id)!;
  const intro = $("intro"), tint = $("tint"), sea = $("sea");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let city: string | null = null;
  intro.hidden = false;
  document.body.classList.add("intro-open");
  try {
    $("skip").hidden = !localStorage.getItem("intel.visited"); // second visit: "Langsung ke peta"
    localStorage.setItem("intel.visited", "1");
  } catch { /* private mode: every visit is the first */ }

  const minZoom = map.getMinZoom();
  map.setMinZoom(2); // the map page never goes below Wilayah Cakupan scale; the intro shows all of Indonesia
  map.jumpTo({ center: [117, -2.5], zoom: innerWidth < 600 ? 2.9 : 4 });
  const addCities = () => {
    map.addSource("introCities", { type: "geojson", data: { type: "FeatureCollection", features: CITIES.map(([name, lon, lat], i) =>
      ({ type: "Feature", properties: { name, i }, geometry: { type: "Point", coordinates: [lon, lat] } })) } });
    map.addLayer({ id: "introCities", type: "circle", source: "introCities", filter: ["<", ["get", "i"], 0],
      paint: { "circle-radius": 6, "circle-color": "#ffb829", "circle-stroke-color": "#000", "circle-stroke-width": 1 } });
  };
  if (map.isStyleLoaded()) addCities(); else map.once("load", addCities);
  const lightCities = (n: number) => map.getLayer("introCities") && map.setFilter("introCities", ["<", ["get", "i"], n]);

  const fly = (view: keyof typeof VIEWS) => (still ? map.jumpTo(VIEWS[view]) : map.flyTo({ ...VIEWS[view], duration: 2000 }));
  const count = (el: HTMLElement) => {
    const to = Number(el.dataset.to);
    if (still) return void (el.textContent = String(to));
    const n = { v: 0 };
    gsap.to(n, { v: to, duration: 1.2, ease: "power2.out", onUpdate: () => void (el.textContent = String(Math.round(n.v))) });
  };
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const s = e.target as HTMLElement;
    if (s.dataset.fly) fly(s.dataset.fly as keyof typeof VIEWS);
    if ("count" in s.dataset) s.querySelectorAll<HTMLElement>(".count").forEach(count);
    if ("cities" in s.dataset) {
      if (still) lightCities(CITIES.length);
      else CITIES.forEach((_, i) => setTimeout(() => lightCities(i + 1), 150 * i)); // B3: one by one
    }
    if (still) tint.style.backgroundColor = s.closest(".story, .read") ? VOID : s.classList.contains("hero") ? SKY : DEEP; // B2 per part
  }), { root: intro, threshold: 0.5 });
  intro.querySelectorAll(".scene").forEach((s) => io.observe(s));

  if (!still) {
    gsap.registerPlugin(ScrollTrigger);
    const hero = intro.querySelector(".hero")!;
    const scroll = { scroller: intro, scrub: true };
    gsap.fromTo(sea, { y: 0, yPercent: 100 }, { y: 0, yPercent: 0, ease: "none", scrollTrigger: { ...scroll, trigger: hero, start: "top top", end: "bottom top" } }); // B1
    gsap.to(sea, { opacity: 0, ease: "none", scrollTrigger: { ...scroll, trigger: hero, start: "bottom top", end: "bottom -50%" } });
    gsap.fromTo(tint, { backgroundColor: SKY }, { backgroundColor: DEEP, ease: "none", // B2
      scrollTrigger: { ...scroll, trigger: hero, start: "center top", end: "bottom top" } });
    gsap.fromTo(tint, { backgroundColor: DEEP }, { backgroundColor: VOID, ease: "none", immediateRender: false, // don't undo the first
      scrollTrigger: { ...scroll, trigger: "#story-demak", start: "top bottom", end: "top top" } });
    intro.querySelectorAll(".photo img").forEach((img) => // B4: photo grows slightly as it passes
      gsap.fromTo(img, { scale: 1 }, { scale: 1.05, ease: "none", scrollTrigger: { ...scroll, trigger: img.parentElement!, start: "top bottom", end: "bottom top" } }));
  }

  intro.querySelectorAll<HTMLInputElement>(".ba-range").forEach((r) => r.addEventListener("input", () => {
    (r.previousElementSibling as HTMLElement).style.setProperty("--cut", `${r.value}%`);
  }));
  intro.querySelectorAll<HTMLAnchorElement>("[data-city]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    city = a.dataset.city!;
    $(`story-${city}`).scrollIntoView({ behavior: still ? "auto" : "smooth" });
  }));
  fetch("/data/upaya.json").then((r) => r.json()).then((u) => {
    const rate = u.sites?.tambaklorok?.lajuSemua;
    if (rate) $("tlRate").textContent = `±${Math.round(rate)}`;
  }).catch(() => {});

  const close = () => {
    io.disconnect();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    if (map.getLayer("introCities")) { map.removeLayer("introCities"); map.removeSource("introCities"); }
    intro.remove();
    map.setMinZoom(minZoom);
    document.body.classList.remove("intro-open");
    done(city);
  };
  $("start").addEventListener("click", close);
  $("skip").addEventListener("click", close);
}
