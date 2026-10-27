// Halaman pembuka (FR-0, docs/USERFLOW.md §1.1) over the Peta. One pinned stage for the whole story, so it never
// feels like scrolling a page: the night sea with INTEL standing on it, the water rising until the scene goes dark
// (Gerak B1, B2), then scenes one after another: their text slides in from the sides and fades out upwards, photos
// cross-fade behind (B3). After the stage: how to read the map and "Cek lokasimu", which opens the Peta behind.
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createSea } from "../sea/sea";
import { Footer, Label, Nav, container, motion, moonButton, n, panel, still, useMotion } from "../ui";

type City = "demak" | "semarang";
type Upaya = { sites: Record<string, { lajuSemua: number | null }>; scenario: { haLanjut2050: number; haHenti2050: number; haAlready: number } };

const SEA_LEN = 4.5; // screens of scroll for the sea's progress 0→1 (sea.ts: letters covered at 40%, dark at 62% ≈ 2.8 screens)
const SEA = 3.5; // the first scene starts here: after the sea is fully dark and a stretch of plain night
const SCENE = 1.4; // screens of scroll per scene
const REST = 0.55; // where a scene rests: all of its text is in (enter ends ≤ 0.54), none is leaving yet (from 0.78)
/** Rest points in screens of scroll: the start, INTEL just under water (sea 40% of SEA_LEN), each scene. */
const rests = (scenes: number) => [0, 0.4 * SEA_LEN, ...Array.from({ length: scenes }, (_, i) => SEA + (i + REST) * SCENE)];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const out3 = (t: number) => 1 - (1 - clamp01(t)) ** 3;

const Big = ({ children }: { children: ReactNode }) => (
  <span className="block text-[clamp(64px,9vw,128px)] leading-[0.9] font-light tracking-[-0.05em] text-gold">{children}</span>
);
const Lead = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`m-0 text-[clamp(22px,3vw,40px)] leading-[1.2] font-light tracking-[-0.02em] ${className}`}>{children}</p>
);

/** Geser sebelum/sesudah (B3): Air Nyata 2017 under 2025. */
function BeforeAfter({ city, place }: { city: City; place: string }) {
  const [cut, setCut] = useState(50);
  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-water-real">
        <img src={`/story/${city}-2017.png`} alt={`Air Nyata di ${place} tahun 2017`} loading="lazy" className="absolute inset-0 size-full object-cover" />
        <img src={`/story/${city}-2025.png`} alt={`Air Nyata di ${place} tahun 2025`} loading="lazy" className="absolute inset-0 size-full object-cover" style={{ clipPath: `inset(0 0 0 ${cut}%)` }} />
        <span className="absolute top-0 bottom-0 w-0.5 bg-moon" style={{ left: `${cut}%` }} />
      </div>
      <input className="range" type="range" min={0} max={100} value={cut} onChange={(e) => setCut(Number(e.target.value))} aria-label="Geser antara 2017 dan 2025" />
      <figcaption className="flex justify-between text-[13px] text-mist"><span>2017</span><span>2025</span></figcaption>
    </figure>
  );
}

export function Beranda({ onDone }: { onDone: (city: City | null) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const city = useRef<City | null>(null);
  const [noGL, setNoGL] = useState(false);
  const [upaya, setUpaya] = useState<Upaya | null>(null);
  const [visited] = useState(() => {
    try {
      const v = !!localStorage.getItem("intel.visited");
      localStorage.setItem("intel.visited", "1");
      return v;
    } catch { return false; } // private mode: every visit is the first
  });

  const rate = upaya?.sites.tambaklorok?.lajuSemua;
  const sc = upaya?.scenario;
  const scenes: { id?: string; photo?: [string, string]; body: ReactNode }[] = [
    { body: (
      <>
        <div data-motion="left" className="flex max-w-[760px] flex-col gap-3.5">
          <Label>Masalahnya</Label>
          <Lead>Tanah di pesisir utara Jawa turun pelan-pelan, beberapa sentimeter tiap tahun.</Lead>
        </div>
        <Lead className="self-end text-right text-[#9fb0b6]"><span data-motion="right" className="inline-block">Tidak terasa. Sampai rob datang tiap bulan.</span></Lead>
        <div data-motion="left" className={`${panel} flex max-w-[520px] flex-col gap-2.5 p-6`}>
          <span className="text-[64px] leading-[0.95] font-light tracking-[-0.05em] text-gold">55 juta</span>
          <p className="m-0 text-sm leading-relaxed font-light text-mist">orang di 20 kabupaten dan 5 kota Pantura tinggal di kawasan yang berisiko rob dan penurunan tanah. 115.000 ha sawah sudah terdampak rob.</p>
          <p className="caption">Sumber: Menko Infrastruktur dan Pembangunan Kewilayahan, 4 Mei 2026 (<a href="https://news.republika.co.id/berita/tey68d484/menko-ahy-penurunan-tanah-dan-banjir-rob-ancaman-puluhan-juta-warga-pantura">Republika</a>, <a href="https://www.cnbcindonesia.com/news/20260504140644-4-732033/kondisi-pantura-jawa-lagi-genting-ahy-cemas-nasib-sawah-di-karawang">CNBC</a>).</p>
        </div>
      </>
    ) },
    { body: (
      <>
        <div data-motion="right" className="flex max-w-[860px] flex-col gap-3.5">
          <Label>Kota yang tanahnya turun</Label>
          <Lead>Jakarta, Bekasi, Subang, Indramayu, Cirebon, Tegal, Pemalang, Pekalongan, Semarang, Demak. Cirebon, Pekalongan, Tegal, dan Semarang turun 2–3 kali lebih cepat dari Jakarta.</Lead>
        </div>
        <p data-motion="left" className="m-0 max-w-[640px] text-[15px] font-light text-mist">Di luar Jawa juga: Medan turun rata-rata ±6,4 cm per tahun. INTEL sementara baru menghitung Semarang dan Demak. Pilih untuk melihat ceritanya:</p>
        <div data-motion="left" className="flex flex-wrap items-center gap-2.5">
          {(["semarang", "demak"] as City[]).map((c) => (
            <a key={c} href={`#story-${c}`} data-city={c} className="flex h-[46px] items-center rounded-full bg-moon px-5 text-sm font-medium text-ink no-underline">{c === "demak" ? "Demak" : "Semarang"}</a>
          ))}
          <span className="text-[13px] font-light text-haze">Belum tercakup: Jakarta, Pekalongan, Cirebon, Tegal, Medan</span>
        </div>
        <p data-motion="up" className="caption">Sumber: BRIN, 26 Mei 2026 (<a href="https://news.republika.co.id/berita/tfw5st475/temuan-brin-jakarta-cirebon-hingga-demak-permukaan-tanah-pesisir-pantura-terus-menurun">Republika</a>); abstrak <a href="https://meetingorganizer.copernicus.org/EGU26/EGU26-8826.html">EGU26-8826</a>; <a href="https://www.bio-conferences.org/10.1051/bioconf/202622005009">BIO Web of Conferences 2026</a>.</p>
      </>
    ) },
    { id: "story-demak", photo: ["/photos/bedono.webp", "Rumah bata di Desa Bedono, Demak, berdiri di tengah air dan mangrove"], body: (
      <div className="flex max-w-[640px] flex-col gap-3 self-start wide:mt-[30svh]">
        <Label className="text-[#c7d8dd]"><span data-motion="left" className="inline-block">Demak · Bedono, Sayung</span></Label>
        <div data-motion="left"><Big>266 KK</Big></div>
        <p data-motion="right" className="m-0 text-lg leading-snug font-light">direlokasi dari Dusun Tambaksari dan Rejosari Senik: 65 KK pada 1999, 201 KK pada 2006.</p>
        <p data-motion="up" className="caption text-haze">Sumber: <a href="https://mongabay.co.id/2024/12/28/keluarga-mak-jah-penyintas-terakhir-dusun-rejosari-kami-akan-tetap-tanam-mangrove/">Mongabay, Desember 2024</a>. Foto: rumah di Desa Bedono, 2025, Tim LindungiHutan, <a href="https://commons.wikimedia.org/wiki/File:Rumah_Mak_Jah_di_Desa_Bedono_yang_Tenggelam_karena_abrasi.jpg">CC BY 4.0</a>.</p>
      </div>
    ) },
    { body: (
      <div className="flex max-w-[640px] flex-col gap-3">
        <Label><span data-motion="right" className="inline-block">Demak · Timbulsloko</span></Label>
        <div data-motion="right"><Big>±140 KK</Big></div>
        <Lead><span data-motion="left" className="inline-block">masih tinggal di tengah genangan rob.</span></Lead>
        <p data-motion="up" className="caption">Sumber: <a href="https://www.metrotvnews.com/read/bVDCjqW2-menolak-tenggelam-kisah-warga-timbulsloko-demak-bertahan-di-tengah-laut">Metro TV, Juni 2025</a>.</p>
      </div>
    ) },
    { body: (
      <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <div data-motion="left" className="flex flex-[1_1_300px] flex-col gap-3">
          <Label>Sayung dari satelit</Label>
          <p className="m-0 text-base leading-normal font-light text-mist">Biru = sudah jadi air sepanjang tahun menurut foto satelit Sentinel-2, termasuk tambak. Tanah di Sayung turun ±11 cm per tahun. Geser untuk membandingkan.</p>
          <p className="caption">Hitungan INTEL dari Sentinel-1 dan Sentinel-2.</p>
        </div>
        <div data-motion="right" className="flex-[1_1_320px]"><BeforeAfter city="demak" place="Sayung" /></div>
      </div>
    ) },
    { id: "story-semarang", photo: ["/photos/tambak-lorok.webp", "Perahu nelayan di Kampung Tambak Lorok, Semarang"], body: (
      <div className="flex max-w-[640px] flex-col gap-3 self-start wide:mt-[30svh]">
        <Label className="text-[#c7d8dd]"><span data-motion="right" className="inline-block">Semarang · Tambak Lorok</span></Label>
        <div data-motion="right"><Big>{rate ? `±${Math.round(rate)}` : "–"} cm<span className="text-[0.35em] tracking-[-0.01em] text-foam"> /tahun</span></Big></div>
        <p data-motion="left" className="m-0 text-lg leading-snug font-light">Kampung nelayan di Semarang Utara. Tanggul laut dibangun di depannya 2022–2024, tapi tanah di sini tetap turun.</p>
        <p data-motion="up" className="caption text-haze">Hitungan INTEL dari Sentinel-1. Foto: Nelayan Tambak Lorok, 2023, Djunaidibd, <a href="https://commons.wikimedia.org/wiki/File:Nelayan_Tambak_Lorok.jpg">CC BY-SA 4.0</a>.</p>
      </div>
    ) },
    { body: (
      <div className="flex max-w-[680px] flex-col gap-3">
        <Label><span data-motion="left" className="inline-block">Semarang · Genuk dan Kaligawe</span></Label>
        <div data-motion="left"><Big>±10 cm</Big></div>
        <p data-motion="right" className="m-0 text-lg leading-snug font-light text-mist">per tahun. Kawasan industri dan permukiman di timur kota turun sekitar 10 cm tiap tahun. Pusat kota dan perbukitan di selatan hampir tidak turun.</p>
        <p data-motion="up" className="caption">Hitungan INTEL dari Sentinel-1, Oktober 2026.</p>
      </div>
    ) },
    { body: (
      <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <div data-motion="right" className="flex-[1_1_320px] wide:order-2"><BeforeAfter city="semarang" place="pesisir Semarang" /></div>
        <div data-motion="left" className="flex flex-[1_1_300px] flex-col gap-3">
          <Label>Pesisir Semarang dari satelit</Label>
          <p className="m-0 text-base leading-normal font-light text-mist">Biru = sudah jadi air sepanjang tahun menurut foto satelit Sentinel-2, termasuk tambak. Geser untuk membandingkan.</p>
        </div>
      </div>
    ) },
    { body: sc ? (
      <div className="flex flex-col gap-6">
        <div data-motion="left" className="flex max-w-[720px] flex-col gap-3">
          <Label>Hitungan INTEL</Label>
          <Lead>Daratan di bawah Pasang Tertinggi, Semarang &amp; Demak.</Lead>
        </div>
        <div className="flex flex-wrap gap-x-5">
          {([["Sekarang", sc.haAlready, "border-[rgb(200_225_235/0.2)]", "left"], ["2050 · Skenario Lanjut", sc.haLanjut2050, "border-tide-glow", "up"], ["2050 · Skenario Henti", sc.haHenti2050, "border-gold", "right"]] as const).map(([t, ha, line, from]) => (
            <div key={t} data-motion={from} className={`flex flex-[1_1_240px] flex-col gap-2 border-t-2 py-5 wide:py-7 ${line}`}>
              <span className="text-[13px] text-haze">{t}</span>
              <span className="text-[clamp(40px,5vw,56px)] leading-none font-light tracking-[-0.04em]">{n(ha)} <span className="text-xl text-haze">ha</span></span>
            </div>
          ))}
        </div>
        <p data-motion="up" className="caption">Di Wilayah Cakupan, tanpa menghitung Tanggul dan pompa. Henti = pengambilan air tanah dihentikan mulai 2027. Data: Sentinel-1 InSAR, DeltaDTM, pasang IOC Semarang.</p>
      </div>
    ) : null },
  ];

  const sea = useRef<ReturnType<typeof createSea>>(null);
  const after = useRef<HTMLElement>(null);
  useEffect(() => {
    fetch("/data/upaya.json").then((r) => r.json()).then(setUpaya).catch(() => {});
    sea.current = createSea(canvas.current!, { title: true, target: stage.current! });
    if (!sea.current) setNoGL(true);
    return () => sea.current?.destroy();
  }, []);

  useEffect(() => {
    const el = scroller.current!;
    const st = stage.current!;
    const intro = st.querySelector<HTMLElement>("[data-intro]")!;
    const sceneEls = [...st.querySelectorAll<HTMLElement>("[data-scene]")];
    const frame = () => {
      const vh = el.clientHeight, y = el.scrollTop;
      const p = clamp01(y / (SEA_LEN * vh));
      sea.current?.setProgress(p);
      intro.style.opacity = String(clamp01(1 - p * 6));
      sceneEls.forEach((scene, i) => {
        const q = (y - (SEA + i * SCENE) * vh) / (SCENE * vh); // 0..1 while this scene is on stage
        const last = i === sceneEls.length - 1;
        const leave = last ? 1 : out3((1 - q) / 0.22);
        scene.style.visibility = q > -0.05 && q < 1.05 ? "visible" : "hidden";
        scene.style.pointerEvents = q > 0.15 && (last || q < 0.82) ? "auto" : "none";
        const bg = scene.querySelector<HTMLElement>("[data-bg]");
        if (bg) {
          bg.style.opacity = String(Math.min(out3(q / 0.2), leave));
          if (!still) bg.style.transform = `scale(${(1 + 0.06 * clamp01(q)).toFixed(4)})`;
        }
        scene.querySelectorAll<HTMLElement>("[data-motion]").forEach((m, k) => motion(m, out3((q - k * 0.06) / 0.3), leave));
      });
    };
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); };
    frame();
    el.addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { el.removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [upaya]);

  useMotion([upaya], after, scroller); // the parts after the stage

  // "Peta" in the nav and "Cek lokasimu" open the map behind; city chips jump to their story scene
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    if (a.getAttribute("href") === "/#peta") { e.preventDefault(); onDone(city.current); return; }
    const c = a.dataset.city as City | undefined;
    if (!c) return;
    e.preventDefault();
    city.current = c;
    const i = scenes.findIndex((s) => s.id === `story-${c}`);
    const el = scroller.current!;
    el.scrollTo({ top: (SEA + (i + REST) * SCENE) * el.clientHeight, behavior: still ? "auto" : "smooth" });
  };

  return (
    <div ref={scroller} onClick={onClick} className="fixed inset-0 z-50 snap-y snap-mandatory overflow-y-auto overscroll-contain bg-night font-sans text-foam [touch-action:pan-y]">
      <Nav />
      {visited && (
        <button type="button" onClick={() => onDone(null)}
          className="fixed right-4 bottom-4 z-20 h-11 rounded-full border border-hairline bg-glass-map px-5 text-[13px] text-mist backdrop-blur-[18px]">
          Langsung ke peta
        </button>
      )}

      <section className="relative" style={{ height: `${(1 + SEA + scenes.length * SCENE) * 100}svh` }}>
        {/* magnet: the scroll always comes to rest on a whole moment, never half-way through a transition */}
        {rests(scenes.length).map((r) => <div key={r} aria-hidden="true" className="absolute inset-x-0 h-px snap-start snap-always" style={{ top: `${r * 100}svh` }} />)}
        <div ref={stage} className="sticky top-0 h-svh overflow-hidden bg-night-sky">
          <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 size-full" />
          {noGL && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-[#0b2a33] to-night" />}
          <h1 className="sr-only">INTEL</h1>

          <div data-intro className={`${container} pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-6 pb-10`}>
            <div className="flex max-w-[540px] flex-[1_1_320px] flex-col gap-2.5">
              <p className="m-0 text-[clamp(28px,3.2vw,42px)] leading-[1.08] font-normal tracking-[-0.03em]">Indonesia Tenggelam?<br />Cek datanya.</p>
              <p className="m-0 text-[15px] leading-normal font-light text-mist">Peta kapan pesisir utara Jawa berada di bawah Pasang Tertinggi, dihitung dari data penurunan tanah satelit.</p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-[rgb(255_255_255/0.1)] px-4 py-2 text-xs font-light text-[#e6f4f1] backdrop-blur-[12px]">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M8 2V13M4 9L8 13L12 9" /></svg>
              Ketuk airnya · gulir ke bawah
            </span>
          </div>

          {scenes.map((s, i) => (
            <div key={i} id={s.id} data-scene={i} className="invisible absolute inset-0 flex items-center">
              {s.photo && (
                <div data-bg style={{ opacity: 0 }} className="absolute inset-0">
                  <img src={s.photo[0]} alt={s.photo[1]} className="absolute inset-0 size-full object-cover [filter:saturate(0.8)_brightness(0.8)]" />
                  <div className="absolute inset-0 bg-[rgb(8_26_40/0.32)]" />
                  <div className="absolute inset-0 bg-linear-to-b from-transparent via-[rgb(5_11_16/0.35)] to-[rgb(5_11_16/0.95)]" />
                </div>
              )}
              <div className={`${container} relative flex flex-col gap-5 pt-24 pb-10`}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section ref={after} className={`${container} flex snap-start flex-col gap-7 py-28`}>
        <Label className="opacity-90">Cara membaca peta</Label>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {([
            [<span className="size-7 rounded-[9px] bg-linear-to-b from-tide-glow to-tide-deep opacity-85" />, "Rob", "Tanah lebih rendah dari pasang tertinggi setahun. Tanpa Tanggul dan pompa, kena rob sesekali.", "left"],
            [<span className="size-7 rounded-[9px] bg-tide-deep opacity-85" />, "Pasang harian", "Tanah lebih rendah dari pasang yang datang hampir tiap hari.", "right"],
            [<span className="size-7 rounded-[9px] border border-[rgb(200_225_235/0.3)] bg-water-real" />, "Air Nyata", "Yang sudah jadi air menurut foto satelit 2025, termasuk tambak.", "left"],
            [<span className="text-xl leading-7 font-light text-gold">±2031–35</span>, "Selalu rentang", "Ukuran punya galat, jadi tahun selalu berupa rentang. Tanggul dan pompa tidak dihitung.", "right"],
          ] as const).map(([mark, t, body, from]) => (
            <div key={t} data-motion={from} className={`${panel} flex flex-col gap-2.5 rounded-3xl p-6`}>
              {mark}
              <span className="text-lg font-medium">{t}</span>
              <p className="m-0 text-sm leading-normal font-light text-mist">{body}</p>
            </div>
          ))}
        </div>
        <a href="/#peta" data-motion="up" className={`${moonButton} self-start`}>
          Cek lokasimu
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 8H13M9 4L13 8L9 12" /></svg>
        </a>
      </section>
      <Footer />
    </div>
  );
}
