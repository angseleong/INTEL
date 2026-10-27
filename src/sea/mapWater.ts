// Air sungguhan on the map (ADR-0008): the sea and Air Nyata 2025 drawn as moving water on a WebGL canvas laid
// over the MapLibre canvas. The water polygons are rasterised into a mask each time the map moves; the waves are
// anchored to the map so they don't slide while panning. A tap sends a ring out from the Titik terpilih.
// The map must not rotate or pitch (Peta disables both): the projection below is a plain Web Mercator offset.
import type { Map as MapLibre } from "maplibre-gl";
import { PRECISION, SEA_GRAD, quadProgram, texture } from "./glsl.ts";
import { Ripples } from "./ripples.ts";

const FS = PRECISION + `
varying vec2 vUv;
uniform sampler2D uMask; uniform sampler2D uSim;
uniform float uTime; uniform float uTapT;
uniform vec2 uRes; uniform vec2 uPan; uniform vec2 uTap; uniform vec4 uBox;
` + SEA_GRAD + `
void main() {
  vec2 px = vUv * uRes;
  float edge = min(min(px.x - uBox.x, uBox.z - px.x), min(px.y - uBox.y, uBox.w - px.y));
  // the water data stops at the Wilayah Cakupan box; fade out there instead of ending in a straight line
  float a = smoothstep(0.25, 0.75, texture2D(uMask, vUv).r) * smoothstep(0.0, 60.0, edge);
  vec2 n = (texture2D(uSim, vUv).rg - 0.5) * 2.0;
  vec2 g = seaGrad((px + uPan) / 34.0, uTime * 0.8, 1.0 / 34.0) * 0.7 + vec2(n.x, -n.y) * 0.5;
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 R = reflect(vec3(0.0, -1.0, 0.0), N);
  vec3 col = vec3(0.035, 0.13, 0.17) * (0.6 + 0.7 * dot(N, normalize(vec3(-0.45, 1.0, 0.55))));
  col += vec3(0.55, 0.7, 0.78) * 0.48 * (1.0 - R.y);
  col += vec3(1.0, 0.95, 0.84) * pow(max(dot(R, normalize(vec3(0.35, 1.0, -0.25))), 0.0), 500.0) * 0.8;
  col += vec3(0.85, 1.0, 0.97) * smoothstep(0.32, 0.5, length(g)) * 0.1;
  float t = uTime - uTapT;
  float ring = smoothstep(2.0, 0.0, abs(distance(px, uTap) - t * 140.0)) * exp(-t * 1.6) * 0.8;
  // premultiplied: the ring over the water
  gl_FragColor = vec4(vec3(0.95, 0.93, 0.86) * ring + col * a * (1.0 - ring), ring + a * (1.0 - ring));
}`;

const mercX = (lon: number) => (lon + 180) / 360;
const mercY = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;

type Ring = { xy: Float64Array; box: [number, number, number, number] };
type Water = { features: { geometry: { type: "Polygon"; coordinates: number[][][] } | { type: "MultiPolygon"; coordinates: number[][][][] } }[] };

function rings(geojson: Water): Ring[] {
  const out: Ring[] = [];
  for (const f of geojson.features) {
    const g = f.geometry;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    for (const ring of polys.flat()) {
      const xy = new Float64Array(ring.length * 2);
      const box: Ring["box"] = [Infinity, Infinity, -Infinity, -Infinity];
      ring.forEach(([lon, lat], i) => {
        const x = (xy[i * 2] = mercX(lon)), y = (xy[i * 2 + 1] = mercY(lat));
        box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y);
      });
      out.push({ xy, box });
    }
  }
  return out;
}

export function mapWater(map: MapLibre, data: Water, area: readonly number[]) {
  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: true });
  const u = gl && quadProgram(gl, FS, ["uMask", "uSim", "uTime", "uTapT", "uRes", "uPan", "uTap", "uBox"]);
  if (!gl || !u) return null; // the MapLibre water fill stays as the fallback
  map.getCanvas().after(cv); // above the map, below markers and our panels

  texture(gl, 0); texture(gl, 1);
  gl.uniform1i(u.uMask, 0); gl.uniform1i(u.uSim, 1);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const water = rings(data);
  const box = [mercX(area[0]), mercY(area[3]), mercX(area[2]), mercY(area[1])];
  const mask = document.createElement("canvas");
  const ctx = mask.getContext("2d")!;
  let w = 0, h = 0, ripples = new Ripples(1, 1), px = new Uint8Array(4), dirty = true, raf = 0;
  let tap: [number, number] | null = null, tapT = -100;
  const t0 = performance.now();
  const now = () => (still ? 0 : ((performance.now() - t0) / 1000) % 1000);

  function resize() {
    const r = map.getCanvas().getBoundingClientRect();
    w = r.width; h = r.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = w * dpr; cv.height = h * dpr;
    mask.width = Math.ceil(w / 2); mask.height = Math.ceil(h / 2); // half resolution: the edges are blurred anyway
    ripples = new Ripples(96, Math.max(32, Math.round((96 * h) / w)));
    px = new Uint8Array(ripples.w * ripples.h * 4);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, ripples.w, ripples.h, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, px);
    dirty = true;
  }

  /** Screen position of mercator (x, y) for the current view. */
  function projector() {
    const c = map.getCenter();
    const o = map.project(c); // the centre's pixel, which map padding moves off the canvas middle
    const ws = 512 * 2 ** map.getZoom();
    const cx = mercX(c.lng), cy = mercY(c.lat);
    return { ws, cx, cy, ox: o.x, oy: o.y, x: (x: number) => (x - cx) * ws + o.x, y: (y: number) => (y - cy) * ws + o.y };
  }

  function drawMask() {
    const p = projector();
    const left = p.cx - p.ox / p.ws, top = p.cy - p.oy / p.ws, right = left + w / p.ws, bottom = top + h / p.ws;
    ctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f00";
    ctx.beginPath();
    for (const { xy, box: b } of water) {
      if (b[2] < left || b[0] > right || b[3] < top || b[1] > bottom) continue;
      ctx.moveTo(p.x(xy[0]), p.y(xy[1]));
      for (let i = 2; i < xy.length; i += 2) ctx.lineTo(p.x(xy[i]), p.y(xy[i + 1]));
      ctx.closePath();
    }
    ctx.fill("evenodd"); // holes are rings of the same polygon
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, mask);
    gl!.uniform2f(u!.uPan, (left * p.ws) % 1e5, (top * p.ws) % 1e5);
    gl!.uniform4f(u!.uBox, p.x(box[0]), p.y(box[1]), p.x(box[2]), p.y(box[3]));
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (document.hidden || (still && !dirty)) return;
    if (dirty) { drawMask(); dirty = false; }
    if (!still) {
      ripples.step(); ripples.step();
      ripples.pack(px);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.texSubImage2D(gl!.TEXTURE_2D, 0, 0, 0, ripples.w, ripples.h, gl!.RGBA, gl!.UNSIGNED_BYTE, px);
    }
    const t = now();
    gl!.uniform1f(u!.uTime, t);
    gl!.uniform1f(u!.uTapT, tapT);
    if (tap) { const p = projector(); gl!.uniform2f(u!.uTap, p.x(tap[0]), p.y(tap[1])); }
    gl!.uniform2f(u!.uRes, w, h);
    gl!.viewport(0, 0, cv.width, cv.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  const onMove = () => { dirty = true; };
  const onMouse = (e: { point: { x: number; y: number }; originalEvent: MouseEvent }) => {
    if (!still && e.originalEvent.buttons === 0) ripples.drop(e.point.x / w, e.point.y / h, 0.22);
  };
  map.on("move", onMove);
  map.on("resize", resize);
  map.on("mousemove", onMouse);
  resize();
  raf = requestAnimationFrame(frame);

  return {
    /** Titik terpilih: ripple + ring from it (DESIGN.md Gerak A5). */
    tap(lng: number, lat: number) {
      tap = [mercX(lng), mercY(lat)];
      tapT = still ? -100 : now();
      const p = projector();
      if (!still) ripples.drop(p.x(tap[0]) / w, p.y(tap[1]) / h, 2.6);
      dirty = true;
    },
    destroy() {
      cancelAnimationFrame(raf);
      map.off("move", onMove); map.off("resize", resize); map.off("mousemove", onMouse);
      cv.remove();
    },
  };
}
