// Shared pieces of the sea shaders (docs/DESIGN.md "Laut WebGL", ADR-0008). WebGL 1, no three.js (ADR-0007).

export const PRECISION = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

/** Full-screen quad; vUv has its origin at the top left, like the canvases the textures come from. */
export const QUAD_VS = `attribute vec2 aPos; varying vec2 vUv;
void main() { vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5); gl_Position = vec4(aPos, 0.0, 1.0); }`;

/** Slope of 8 directional swells at P (world units). `px` = world units per screen pixel: waves smaller than
 *  a few pixels fade out so they don't flicker. Deep-water speed: sqrt(g·k). */
export const SEA_GRAD = `
vec2 seaGrad(vec2 P, float t, float px) {
  vec2 g = vec2(0.0);
  vec2 D[8]; float FR[8]; float A[8];
  D[0] = vec2(0.0, 1.0);   FR[0] = 1.6;  A[0] = 0.075;
  D[1] = vec2(0.6, 0.8);   FR[1] = 2.7;  A[1] = 0.048;
  D[2] = vec2(-0.7, 0.71); FR[2] = 4.1;  A[2] = 0.032;
  D[3] = vec2(0.3, 0.95);  FR[3] = 6.3;  A[3] = 0.021;
  D[4] = vec2(-0.2, 0.98); FR[4] = 9.7;  A[4] = 0.013;
  D[5] = vec2(0.8, 0.6);   FR[5] = 14.9; A[5] = 0.0085;
  D[6] = vec2(-0.5, 0.87); FR[6] = 23.0; A[6] = 0.0052;
  D[7] = vec2(0.1, 0.99);  FR[7] = 35.0; A[7] = 0.0034;
  for (int i = 0; i < 8; i++) {
    float f = FR[i];
    float fade = smoothstep(2.5, 6.0, (6.2832 / f) / px);
    g += D[i] * (A[i] * f * cos(dot(D[i], P) * f + t * sqrt(9.8 * f) * 0.55)) * fade;
  }
  return g;
}`;

/** Compiles the quad + `fs`, binds the quad, and returns the program with its uniform locations; null if WebGL refuses. */
export function quadProgram(gl: WebGLRenderingContext, fs: string, uniforms: string[]) {
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  try {
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, QUAD_VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    return Object.fromEntries(uniforms.map((n) => [n, gl.getUniformLocation(prog, n)]));
  } catch (e) {
    console.warn("Laut WebGL off:", e);
    return null;
  }
}

/** A linear, edge-clamped texture on `unit`. */
export function texture(gl: WebGLRenderingContext, unit: number) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]])
    gl.texParameteri(gl.TEXTURE_2D, k, v);
}
