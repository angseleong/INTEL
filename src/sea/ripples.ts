// Touch ripples on the sea (docs/DESIGN.md "Laut WebGL"): the classic two-buffer height-field wave,
// on a small grid that the shader samples as slopes. Kept free of DOM so ripples_check.ts can run it in Node.

export class Ripples {
  w: number;
  h: number;
  a: Float32Array;
  b: Float32Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.a = new Float32Array(w * h);
    this.b = new Float32Array(w * h);
  }

  /** A drop at (u, v) in 0..1 of the grid, `s` high, `r` cells wide. */
  drop(u: number, v: number, s: number, r = 3) {
    const { w, h, a } = this;
    const cx = u * w, cy = v * h;
    for (let y = Math.max(1, Math.floor(cy - r)); y <= Math.min(h - 2, Math.ceil(cy + r)); y++) {
      for (let x = Math.max(1, Math.floor(cx - r)); x <= Math.min(w - 2, Math.ceil(cx + r)); x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d < r) a[y * w + x] += s * (0.5 + 0.5 * Math.cos((Math.PI * d) / r));
      }
    }
  }

  step(damping = 0.984) {
    const { w, h } = this;
    const a = this.a, b = this.b;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        b[i] = ((a[i - 1] + a[i + 1] + a[i - w] + a[i + w]) * 0.5 - b[i]) * damping;
      }
    }
    this.a = b;
    this.b = a;
  }

  /** RGBA bytes for the shader: R,G = slope x/y, B = height, all centred on 128. */
  pack(out: Uint8Array) {
    const { w, h, a } = this;
    const byte = (x: number) => Math.max(0, Math.min(255, 128 + x));
    for (let i = 0; i < w * h; i++) {
      out[i * 4] = byte(((a[i + 1] ?? 0) - (a[i - 1] ?? 0)) * 40);
      out[i * 4 + 1] = byte(((a[i + w] ?? 0) - (a[i - w] ?? 0)) * 40);
      out[i * 4 + 2] = byte(a[i] * 30);
      out[i * 4 + 3] = 255;
    }
  }
}
