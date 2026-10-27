// Check for ripples.ts: `node src/sea/ripples_check.ts`. A drop spreads out, stays symmetric, and dies down.
import { Ripples } from "./ripples.ts";

const assert = { ok(ok: boolean, msg: string) { if (!ok) throw new Error(msg); } }; // a throw exits Node non-zero

const N = 41, C = 20; // drop exactly on the centre cell
const r = new Ripples(N, N);
r.drop(C / N, C / N, 2.6);
const energy = () => r.a.reduce((s, x) => s + x * x, 0);
const start = energy();
assert.ok(start > 0, "the drop added height");

for (let i = 0; i < 20; i++) r.step();
const at = (x: number, y: number) => r.a[y * N + x];
assert.ok(Math.abs(at(C - 8, C) - at(C + 8, C)) < 1e-4, "left and right of the drop match");
assert.ok(Math.abs(at(C, C - 8) - at(C, C + 8)) < 1e-4, "above and below the drop match");
assert.ok(r.a.some((x, i) => Math.abs(x) > 1e-3 && Math.abs((i % N) - C) > 5), "the wave travelled outwards");

for (let i = 0; i < 600; i++) r.step();
const end = energy();
assert.ok(Number.isFinite(end) && end < start * 0.01, `the wave died down (${start.toFixed(2)} → ${end.toFixed(4)})`);

const px = new Uint8Array(N * N * 4);
r.pack(px);
assert.ok(px[3] === 255 && px.every((b, i) => i % 4 !== 3 || b === 255), "packed bytes are opaque RGBA");
console.log("ripples ok");
