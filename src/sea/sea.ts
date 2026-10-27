// Laut WebGL in perspective (docs/DESIGN.md "Laut WebGL", ADR-0008): a night sea seen from the shore, with the
// sky canvas (moon, and on the halaman pembuka the word INTEL) mirrored in it. Scroll raises the water and darkens
// the scene (Gerak B1); a tap makes a ripple, a sideways drag leaves a wake. Same shader as the canvas prototype.
import { PRECISION, SEA_GRAD, quadProgram, texture } from "./glsl.ts";
import { Ripples } from "./ripples.ts";

const FS = PRECISION + `
varying vec2 vUv;
uniform sampler2D uBg; uniform sampler2D uSim;
uniform float uTime; uniform float uLevel; uniform float uAspect; uniform float uH; uniform float uDark;
uniform vec3 L;
const float F = 1.6;
const vec3 MOON = vec3(1.0, 0.95, 0.84);
` + SEA_GRAD + `
vec3 sky(vec2 uv) {
  vec3 c = texture2D(uBg, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
  vec2 mp = vec2(0.5 + (L.x / L.z) / F / uAspect, uLevel - (L.y / L.z) / F);
  float d = length((uv - mp) * vec2(uAspect, 1.0));
  return c + MOON * (smoothstep(0.021, 0.017, d) + exp(-d * 10.0) * 0.22);
}
void main() {
  vec4 s = texture2D(uSim, vUv);
  vec2 n = (s.rg - 0.5) * 2.0;
  float h = (s.b - 0.5) * 2.0;
  // the waterline wobbles a little where it crosses the letters, so it never reads as a ruler line
  float line = uLevel + 0.0011 * sin(vUv.x * 41.0 * uAspect + uTime * 1.3) + 0.0005 * sin(vUv.x * 97.0 * uAspect - uTime * 2.2) - h * 0.003;
  float sy = vUv.y - line;
  float syc = max(sy, 0.0015);
  float sx = (vUv.x - 0.5) * uAspect;
  // camera one unit above the water, looking at the horizon (the waterline)
  vec2 P = vec2(sx / syc, 1.0 / (syc * F));
  float calm = mix(0.1, 1.0, smoothstep(0.0, 0.09, sy)); // calm near the line: a clean mirror under the letters
  vec2 g = seaGrad(P, uTime, 1.0 / (F * syc * syc * uH)) * 0.6 * calm + vec2(n.x, -n.y) * 0.6;
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 I = normalize(vec3(sx * F, -syc * F, 1.0));
  vec3 R = reflect(I, N);
  R.y = max(R.y, 0.004);
  vec2 ruv = vec2(0.5 + (R.x / R.z) / F / uAspect, uLevel - (R.y / R.z) / F);
  float fres = 0.02 + 0.98 * pow(1.0 - clamp(dot(-I, N), 0.0, 1.0), 5.0);
  vec3 body = mix(vec3(0.03, 0.15, 0.20), vec3(0.01, 0.04, 0.07), smoothstep(0.0, 0.45, sy)) * (0.75 + 0.9 * clamp(g.y + 0.15, 0.0, 0.6));
  vec3 sea = mix(body, sky(ruv) * 0.85, fres);
  // the submerged part of the letters stays faintly visible, fading with depth
  sea += texture2D(uBg, vec2(vUv.x + g.x * 0.012, vUv.y + g.y * 0.008)).rgb * vec3(0.32, 0.62, 0.6) * (1.0 - fres) * exp(-sy * 16.0);
  float rl = max(dot(R, L), 0.0);
  sea += MOON * (pow(rl, 900.0) * 3.0 + pow(rl, 90.0) * 0.12);
  sea += vec3(0.8, 0.95, 0.92) * smoothstep(0.55, 0.85, length(g)) * smoothstep(0.02, 0.12, sy) * 0.14;
  vec3 col = mix(sky(vUv), sea, smoothstep(-0.0008, 0.0018, sy));
  gl_FragColor = vec4(mix(col, vec3(0.0196, 0.0431, 0.0627), uDark), 1.0); // night: #050b10
}`;

type Options = {
  /** Draw INTEL and the place line in the sky, standing on the water. */
  title?: boolean;
  /** Ripples from taps and drags on `target`. */
  target?: HTMLElement;
  /** Waves move. Off: one still frame, redrawn on resize (Upaya strip, prefers-reduced-motion). */
  animate?: boolean;
  /** Horizon height (0 = top) when there is no title. */
  horizon?: number;
};

export function createSea(cv: HTMLCanvasElement, { title = false, target, animate = true, horizon = 0.3 }: Options) {
  const gl = cv.getContext("webgl", { antialias: false });
  const u = gl && quadProgram(gl, FS, ["uBg", "uSim", "uTime", "uLevel", "uAspect", "uH", "uDark", "L"]);
  if (!gl || !u) return null; // the caller keeps its CSS gradient
  const moving = animate && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  texture(gl, 0); texture(gl, 1);
  gl.uniform1i(u.uBg, 0); gl.uniform1i(u.uSim, 1);

  const bg = document.createElement("canvas");
  let cw = 0, ch = 0, base = horizon, covered = horizon, p = 0, raf = 0, visible = true;
  let ripples = new Ripples(1, 1), px = new Uint8Array(4);
  const t0 = performance.now();

  const level = () => p < 0.4 ? base + (covered - base) * (p / 0.4) : covered - Math.min(1, (p - 0.4) / 0.22) * 0.12;

  function resize() {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    cw = r.width; ch = r.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = bg.width = cw * dpr;
    cv.height = bg.height = ch * dpr;
    const c = bg.getContext("2d")!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = "#060c12";
    c.fillRect(0, 0, cw, ch);
    let moonY = horizon - 0.18;
    if (title) {
      // INTEL stands on the water, left-aligned with the 1200px content column
      const fs = Math.min(cw * 0.31, ch * 0.34);
      const x = Math.max(16, (cw - 1200) / 2 + 18);
      const baseline = Math.round(ch * (cw < 700 ? 0.5 : 0.58));
      c.fillStyle = "#c7d8dd";
      c.font = "300 13px Sora, sans-serif";
      if ("letterSpacing" in c) c.letterSpacing = "2px";
      c.fillText("PESISIR UTARA JAWA · SEMARANG & DEMAK", x + 4, baseline - fs * 0.74 - 22);
      c.fillStyle = "#f4f6f2";
      c.font = `600 ${fs}px Sora, sans-serif`;
      if ("letterSpacing" in c) c.letterSpacing = `${-fs * 0.055}px`;
      c.fillText("INTEL", x, baseline);
      base = baseline / ch; // no gap between the letters and their reflection
      covered = (baseline - fs * 0.74 - 44) / ch; // the place line goes under too
      moonY = Math.max(0.12, (baseline - fs * 0.75) / ch - 0.08);
    } else {
      base = covered = horizon;
    }
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, bg);
    // the moon sits above the right end of the title; the light direction is derived from where it should appear
    const lx = ((cw / ch > 1 ? 0.8 : 0.78) - 0.5) * 1.6 * (cw / ch), ly = (base - moonY) * 1.6, ln = Math.hypot(lx, ly, 1);
    gl!.uniform3f(u!.L, lx / ln, ly / ln, 1 / ln);
    gl!.uniform1f(u!.uAspect, cw / ch);
    gl!.uniform1f(u!.uH, ch);
    // perspective ripples: grid cells about twice as wide as tall on screen
    ripples = new Ripples(Math.max(32, Math.round(cw / ((2 * ch) / 208))), 208);
    px = new Uint8Array(ripples.w * ripples.h * 4);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, ripples.w, ripples.h, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, px);
    draw();
  }

  function draw() {
    if (moving) {
      ripples.step(); ripples.step();
      ripples.pack(px);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.texSubImage2D(gl!.TEXTURE_2D, 0, 0, 0, ripples.w, ripples.h, gl!.RGBA, gl!.UNSIGNED_BYTE, px);
    }
    gl!.uniform1f(u!.uTime, moving ? ((performance.now() - t0) / 1000) % 1000 : 4);
    gl!.uniform1f(u!.uLevel, level());
    gl!.uniform1f(u!.uDark, title ? Math.max(0, Math.min(1, (p - 0.4) / 0.22)) : 0);
    gl!.viewport(0, 0, cv.width, cv.height);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (visible && !document.hidden) draw();
  };
  if (moving) raf = requestAnimationFrame(frame);

  const ro = new ResizeObserver(resize);
  ro.observe(cv);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(cv);
  document.fonts?.load("600 100px Sora").then(resize).catch(() => {}); // the title is drawn once the font is in

  let down = false;
  const pos = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  const onUi = (e: PointerEvent) => (e.target as HTMLElement).closest?.("a, button, input, label, nav");
  const hit = (x: number, y: number, s: number) => { if (moving && y > level() + 0.01) ripples.drop(x, y, s); };
  const handlers: [string, (e: PointerEvent) => void][] = [
    ["pointerdown", (e) => { if (onUi(e)) return; down = true; const [x, y] = pos(e); hit(x, y, 2.6); }],
    ["pointermove", (e) => { const [x, y] = pos(e); if (down) hit(x, y, 0.9); else if (e.pointerType === "mouse") hit(x, y, 0.22); }],
    ["pointerup", () => { down = false; }],
    ["pointercancel", () => { down = false; }], // a vertical drag became a scroll
  ];
  if (target) for (const [k, f] of handlers) target.addEventListener(k, f as EventListener);

  return {
    /** 0 → 1 over the halaman pembuka's sea section: water rises over INTEL, then the scene goes dark. */
    setProgress(v: number) {
      p = v;
      if (!moving) draw();
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      if (target) for (const [k, f] of handlers) target.removeEventListener(k, f as EventListener);
    },
  };
}
