// Shared pieces of the Laut Malam pages (docs/DESIGN.md Components): top nav, footer, label, A9 reveal.
import { useEffect, type ReactNode, type RefObject } from "react";

export const glass = "border border-hairline bg-glass backdrop-blur-[18px]";
export const panel = "rounded-[28px] border border-hairline bg-glass";
export const moonButton =
  "inline-flex h-[52px] items-center gap-2.5 rounded-full bg-moon px-6 text-[15px] font-medium text-ink no-underline shadow-[0_0_32px_rgb(243_234_210/0.18)] transition-transform duration-150 active:scale-[0.97]";
export const container = "mx-auto box-border w-full max-w-[1200px] px-6";

export const dateId = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
export const n = (x: number) => x.toLocaleString("id-ID");

export const Label = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`m-0 text-xs uppercase tracking-[0.14em] text-tidewrack ${className}`}>{children}</p>
);

const PAGES = [
  ["/#peta", "Peta", "Peta"],
  ["/upaya.html", "Apa yang bisa dilakukan", "Upaya"], // the short label keeps the nav on one row on phones
  ["/peliput.html", "Peliput", "Peliput"],
  ["/tentang.html", "Tentang", "Tentang"],
] as const;

/** Always on screen, on every page and over the map (one row, also on phones: the brand shrinks to its dot).
 *  `full`: spans the whole width instead of the 1200px column (the Peta, whose panel sits at the right edge). */
export function Nav({ current, full = false }: { current?: (typeof PAGES)[number][0]; full?: boolean }) {
  return (
    <header className={`pointer-events-none fixed inset-x-0 top-0 z-40 ${full ? "px-3" : ""}`}>
      <div className={`${full ? "" : container} flex items-center justify-between gap-2 py-3 wide:py-4`}>
        <a href="/" aria-label="INTEL, halaman pembuka" className={`${glass} pointer-events-auto flex h-11 flex-none items-center gap-2.5 rounded-full px-4 text-sm font-semibold tracking-[0.08em] text-foam no-underline`}>
          <span className="size-[11px] rounded-full bg-moon shadow-[0_0_10px_rgb(243_234_210/0.6)]" /><span className="hidden min-[420px]:inline">INTEL</span>
        </a>
        <nav className={`${glass} pointer-events-auto flex min-w-0 items-center overflow-x-auto rounded-full p-1 text-xs whitespace-nowrap [scrollbar-width:none] wide:gap-1 wide:text-[13px]`}>
        {PAGES.map(([href, text, short]) => (
          <a key={href} href={href} aria-current={href === current ? "page" : undefined} aria-label={text}
            className={`rounded-full px-3 py-2.5 no-underline wide:px-4 ${href === current ? "bg-moon font-medium text-ink" : "text-mist"}`}>
            <span className="wide:hidden">{short}</span><span className="hidden wide:inline">{text}</span>
          </a>
        ))}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="snap-end border-t border-hairline">
      <div className={`${container} flex flex-wrap justify-between gap-4 py-8 text-xs font-light text-driftwood`}>
        <span>INTEL · kode terbuka MIT · tanpa iklan · tanpa menyimpan data Pengunjung</span>
        <span className="flex gap-5">
          <a href="/tentang.html" className="text-moon">Sumber data</a>
          <a href="/peliput.html" className="text-moon">Unduh data</a>
        </span>
      </div>
    </footer>
  );
}

export const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const out3 = (t: number) => 1 - (1 - clamp01(t)) ** 3;

/** One element's motion (DESIGN.md Gerak A9): `e` 0→1 while it comes in from `from`, `x` 1→0 while it leaves upwards.
 *  Text arrives from the side with a little blur and leaves the same way, so the words move and the page doesn't. */
export function motion(el: HTMLElement, e: number, x: number) {
  const v = e * x;
  el.style.opacity = String(still ? (v > 0.5 ? 1 : 0) : v);
  if (still) return;
  const side = { left: -1, right: 1, up: 0 }[el.dataset.motion as "left" | "right" | "up"] ?? 0;
  const travel = Math.min(140, innerWidth * 0.25);
  el.style.transform = `translate(${((1 - e) * side * travel).toFixed(1)}px, ${((1 - e) * (side ? 0 : 40) - (1 - x) * 50).toFixed(1)}px)`;
  el.style.filter = v > 0.98 ? "" : `blur(${((1 - v) * 8).toFixed(1)}px)`;
}

/** Every [data-motion] under `root` (default: the page) comes in as its top rises into the screen and fades out
 *  as its bottom leaves it. `scroller`: the element that scrolls, when it is not the window. */
export function useMotion(deps: unknown[] = [], root?: RefObject<HTMLElement | null>, scroller?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const els = [...(root?.current ?? document).querySelectorAll<HTMLElement>("[data-motion]")];
    const target: HTMLElement | Window = scroller?.current ?? window;
    const frame = () => {
      const vh = innerHeight;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        motion(el, out3((vh - r.top) / (vh * 0.3)), out3(r.bottom / (vh * 0.3)));
      }
    };
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); };
    frame();
    target.addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { target.removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, deps);
}

/** Two-column part of a text page: heading from the left, body from the right (stacks on phones). */
export function Part({ title, label, children, h1 = false }: { title: ReactNode; label?: string; children: ReactNode; h1?: boolean }) {
  const H = h1 ? "h1" : "h2";
  return (
    <section className={`${container} flex flex-wrap gap-x-10 gap-y-5 pb-24`}>
      <div data-motion="left" className="flex flex-[1_1_320px] flex-col gap-4">
        {label && <Label>{label}</Label>}
        <H className={h1 ? "m-0 text-[clamp(48px,6.4vw,96px)] leading-[0.96] font-light tracking-[-0.05em]" : "m-0 text-[clamp(28px,3vw,34px)] leading-[1.1] font-light tracking-[-0.03em]"}>{title}</H>
      </div>
      <div data-motion="right" className="prose-intel flex flex-[2_1_480px] flex-col gap-4">{children}</div>
    </section>
  );
}
