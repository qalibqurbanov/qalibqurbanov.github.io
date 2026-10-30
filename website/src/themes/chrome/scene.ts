import type { SceneEnv, SceneFactory } from "../shared/scene/types";
import { rgba } from "../shared/scene/util";
import { createWorld } from "../shared/scene/world";
import { kinds } from "./objects";

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

/** Liquid metal. A height field of slowly flowing, domain-warped noise and a few mercury drops is
 * lit as a mirror: the surface normal reflects a studio-like environment (soft boxes and a horizon),
 * so the metal shows sharp, moving highlights. The cursor is a drop of its own that pushes the
 * surface and carries a light, so the reflections slide as it moves. */
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform vec2 uM;
uniform float uMv;
uniform float uScroll;
uniform float uLight;
uniform vec3 uTint;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

float height(vec2 p){
  float t = uT * 0.035;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t));
  float h = fbm(p + 3.4 * r);
  // mercury drops drifting on the surface
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 c = vec2(sin(uT * 0.11 + fi * 2.3) * 1.1, cos(uT * 0.09 + fi * 1.7) * 0.6) + vec2(0.0, 0.0);
    float d = length(p - c);
    h += 0.7 * exp(-d * d * 2.4);
  }
  return h;
}

vec3 env(vec3 r){
  // a dark studio: a bright horizon band, two soft boxes and a floor, all in cool greys
  float y = r.y;
  float band = smoothstep(0.0, 0.015, y) * (1.0 - smoothstep(0.015, 0.09, y));
  float sky = mix(0.05, 0.62, smoothstep(0.0, 0.9, y));
  float floorv = 0.03 + 0.1 * smoothstep(-0.2, -0.9, y);
  float v = y > 0.0 ? sky : floorv;
  v += band * 1.35;
  float box1 = smoothstep(0.1, 0.0, length(vec2(r.x + 0.38, r.y - 0.46))) * 1.6;
  float box2 = smoothstep(0.08, 0.0, length(vec2(r.x - 0.5, r.y - 0.3))) * 1.1;
  float strip = smoothstep(0.02, 0.0, abs(r.x * 0.5 + r.y - 0.55) - 0.01) * 0.6;
  v += box1 + box2 + strip;
  return vec3(v) * vec3(0.92, 0.97, 1.04);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - 0.5 * uRes) / uRes.y * 1.15;
  p.y += uScroll * 0.35;
  // the cursor, in the same space
  vec2 m = (uM - 0.5 * uRes) / uRes.y * 1.15;
  m.y += uScroll * 0.35;

  float e = 0.006;
  vec2 pm = p;
  float dm = length(p - m);
  float bump = 0.7 * exp(-dm * dm * 3.2) * (0.5 + min(uMv, 1.5));
  float h0 = height(pm) + bump;
  float hx = height(pm + vec2(e, 0.0)) + 0.7 * exp(-pow(length(p + vec2(e, 0.0) - m), 2.0) * 3.2) * (0.5 + min(uMv, 1.5));
  float hy = height(pm + vec2(0.0, e)) + 0.7 * exp(-pow(length(p + vec2(0.0, e) - m), 2.0) * 3.2) * (0.5 + min(uMv, 1.5));
  vec2 grad = vec2(hx - h0, hy - h0) / e;
  vec3 n = normalize(vec3(-grad * 0.16, 1.0));
  vec3 v = vec3(0.0, 0.0, 1.0);
  vec3 r = reflect(-v, n);
  vec3 col = env(vec3(r.x, r.y * 0.9 + 0.12, r.z));

  // the cursor's light, reflected as a sharp specular highlight
  vec3 L = normalize(vec3((uM - 0.5 * uRes) / uRes.y * 1.4, 0.9));
  float spec = pow(max(dot(r, L), 0.0), 60.0);
  col += spec * 1.4;

  // cool tint in the shadows, so it reads as steel and not grey
  col = mix(col, col * uTint * 1.6, 0.35);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float k = uLight > 0.5 ? 0.9 : 0.4;
  col = mix(vec3(lum), col, 0.7) * k;
  if (uLight < 0.5) col = pow(col, vec3(1.2));
  if (uLight > 0.5) col = mix(vec3(0.84, 0.86, 0.9), vec3(1.0), clamp(col, 0.0, 1.0)) * 0.98;
  // fade to the page at the screen's edges and top so the content stays readable
  vec2 uv = frag / uRes;
  float vig = smoothstep(0.0, 0.5, uv.x) * smoothstep(0.0, 0.5, 1.0 - uv.x);
  col *= mix(0.6, 1.0, vig);
  // the left of the page carries the text: keep the metal calm and dark there
  if (uLight < 0.5) col *= mix(0.42, 1.0, smoothstep(0.1, 0.75, uv.x));
  else col = mix(col, vec3(0.9, 0.92, 0.95), 0.5 * (1.0 - smoothstep(0.1, 0.75, uv.x)));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

/** Without WebGL: a brushed-silver sweep that still follows the cursor. */
function fallback(canvas: HTMLCanvasElement): { frame(e: SceneEnv): void } {
  const g = canvas.getContext("2d");
  return {
    frame(e) {
      if (!g) return;
      g.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
      const grad = g.createLinearGradient(0, 0, e.w, e.h);
      const base = e.light ? 232 : 28;
      grad.addColorStop(0, `rgb(${base},${base + 2},${base + 6})`);
      grad.addColorStop(0.4 + 0.05 * Math.sin(e.t * 0.3), `rgb(${base + (e.light ? 20 : 90)},${base + (e.light ? 22 : 94)},${base + (e.light ? 24 : 100)})`);
      grad.addColorStop(1, `rgb(${base - 6},${base - 4},${base})`);
      g.fillStyle = grad;
      g.fillRect(0, 0, e.w, e.h);
      if (e.seen) {
        const s = g.createRadialGradient(e.mx, e.my, 0, e.mx, e.my, 260);
        s.addColorStop(0, rgba([255, 255, 255], 0.5));
        s.addColorStop(1, rgba([255, 255, 255], 0));
        g.fillStyle = s;
        g.fillRect(0, 0, e.w, e.h);
      }
    },
  };
}

export const createScene: SceneFactory = (canvas, _env, objects) => {
  const fx = objects.getContext("2d");
  const world = createWorld(kinds, { perScreen: 2.6, veil: 0.32 });
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
  const vs = gl && compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = gl && compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl && vs && fs ? gl.createProgram() : null;
  const withWorld = (base: { frame(e: SceneEnv): void; destroy?(): void }) => ({
    frame(e: SceneEnv) {
      base.frame(e);
      if (fx) world.frame(fx, e);
    },
    resize: (e: SceneEnv) => world.relayout(e),
    destroy() {
      base.destroy?.();
      world.destroy();
    },
  });
  if (!gl || !vs || !fs || !program) return withWorld(fallback(canvas));
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return withWorld(fallback(canvas));
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const uRes = u("uRes");
  const uT = u("uT");
  const uM = u("uM");
  const uMv = u("uMv");
  const uScroll = u("uScroll");
  const uLight = u("uLight");
  const uTint = u("uTint");
  let speed = 0;

  return withWorld({
    frame(e) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, e.t);
      // the cursor in canvas pixels (the origin is at the bottom left)
      gl.uniform2f(uM, (e.seen ? e.mx : e.w * 0.6) * e.dpr, (e.h - (e.seen ? e.my : e.h * 0.4)) * e.dpr);
      speed += (Math.min(1.5, Math.hypot(e.vx, e.vy) / 2500) - speed) * 0.1;
      gl.uniform1f(uMv, speed);
      gl.uniform1f(uScroll, e.scrollY / Math.max(1, e.h) * 0.5);
      gl.uniform1f(uLight, e.light ? 1 : 0);
      gl.uniform3f(uTint, 0.78 + e.accent2[0] / 1200, 0.86 + e.accent2[1] / 1200, 1 + e.accent2[2] / 1500);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  });
};
