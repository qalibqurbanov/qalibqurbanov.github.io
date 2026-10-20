import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { prefersReducedMotion } from "@/hooks/glitch";
import { idleFor, IDLE_MS } from "@/lib/idle";

const COUNT = 10;
/** The idle clock shows nothing for the first stretch; fireflies leave one by one after it. */
const FIRST_CALL_MS = 900;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface Fly {
  /** Where it lives (fractions of the screen) and how it drifts about there. */
  hx: number;
  hy: number;
  fx: number[];
  fy: number[];
  ph: number[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Its circle round the cursor while called. */
  orbit: number;
  spin: number;
  ang: number;
  size: number;
  blink: number;
  /** 0 = going about its business, 1 = called to the cursor. */
  g: number;
  /** Whether it was called last frame, and how far into the pull it is (0 → 1), so it sets off gently. */
  was: boolean;
  drive: number;
}

/** A handful of fireflies that drift lazily about their own corners of the
 * screen, behind the page. When the visitor has been idle they are called
 * to the cursor one by one (as the countdown runs) and circle it, in front of
 * the page. As soon as the visitor moves again they drift back to where they
 * were and carry on. */
export function Fireflies() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || prefersReducedMotion()) return;

    let scrollY = window.scrollY;
    let W = window.innerWidth;
    let H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Spread homes over a grid of cells (a random ten of twelve) so they never bunch up.
    const cells = Array.from({ length: 12 }, (_, n) => n).sort(() => Math.random() - 0.5);
    const flies: Fly[] = Array.from({ length: COUNT }, (_, i) => {
      const col = cells[i] % 4;
      const row = Math.floor(cells[i] / 4);
      const hx = (col + rand(0.2, 0.8)) / 4;
      const hy = (row + rand(0.2, 0.8)) / 3;
      return {
        hx,
        hy,
        fx: [rand(0.18, 0.4), rand(0.5, 1.1)],
        fy: [rand(0.15, 0.36), rand(0.45, 0.95)],
        ph: [rand(0, 6.28), rand(0, 6.28), rand(0, 6.28), rand(0, 6.28)],
        x: hx * W,
        y: hy * H,
        vx: 0,
        vy: 0,
        orbit: rand(24, 58),
        spin: (Math.random() < 0.5 ? -1 : 1) * rand(0.7, 1.4),
        ang: rand(0, 6.28),
        size: rand(1.6, 2.4),
        blink: rand(0.8, 1.6),
        g: 0,
        was: false,
        drive: 1,
      };
    });

    // A soft yellow glow, drawn once and stamped.
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 48;
    const sg = sprite.getContext("2d");
    if (sg) {
      const grad = sg.createRadialGradient(24, 24, 0, 24, 24, 24);
      grad.addColorStop(0, "rgba(255,244,170,1)");
      grad.addColorStop(0.25, "rgba(255,214,90,0.7)");
      grad.addColorStop(1, "rgba(255,190,60,0)");
      sg.fillStyle = grad;
      sg.fillRect(0, 0, 48, 48);
    }

    let pointer: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      pointer = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let last = performance.now();
    let t = 0;
    let front = false;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      // One firefly leaves every second of the countdown, the first after a short wait.
      const idle = idleFor(now);
      const called = pointer && idle > FIRST_CALL_MS ? Math.min(COUNT, 1 + Math.floor(((idle - FIRST_CALL_MS) / (IDLE_MS - FIRST_CALL_MS)) * COUNT)) : 0;

      // Fireflies live in page coordinates, wrapped every screen height plus a margin, so
      // they scroll with the page like everything else and never run out.
      scrollY = window.scrollY;
      const M = 40;
      const span = H + 2 * M;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      let anyAway = false;
      flies.forEach((f, i) => {
        const gathering = i < called && pointer !== null;
        f.g += ((gathering ? 1 : 0) - f.g) * Math.min(1, dt * 2.5);
        if (gathering !== f.was) {
          f.was = gathering;
          f.drive = 0;
        }
        f.drive = Math.min(1, f.drive + dt / 0.9);
        const pull = f.drive * f.drive * (3 - 2 * f.drive);

        let tx: number;
        let ty: number;
        if (gathering && pointer) {
          f.ang += f.spin * dt;
          const r = f.orbit * (1 + 0.12 * Math.sin(t * 1.3 + f.ph[0]));
          tx = pointer.x + Math.cos(f.ang) * r;
          ty = pointer.y + scrollY + Math.sin(f.ang) * r * 0.82;
        } else {
          tx = f.hx * W + Math.sin(t * f.fx[0] + f.ph[0]) * 70 + Math.sin(t * f.fx[1] + f.ph[1]) * 24;
          ty = f.hy * H + Math.sin(t * f.fy[0] + f.ph[2]) * 54 + Math.sin(t * f.fy[1] + f.ph[3]) * 20;
        }

        // Use the copy of its wrapped position nearest the target, so it never crosses a whole screen.
        f.y += Math.round((ty - f.y) / span) * span;

        // A damped spring: it glides toward where it wants to be, never snaps.
        const k = gathering ? 7 : 2.6;
        const c = 2 * Math.sqrt(k) * 0.9;
        f.vx += ((tx - f.x) * k * pull - f.vx * c) * dt;
        f.vy += ((ty - f.y) * k * pull - f.vy * c) * dt;
        const sp = Math.hypot(f.vx, f.vy);
        const cap = gathering ? 420 : 240;
        if (sp > cap) {
          f.vx *= cap / sp;
          f.vy *= cap / sp;
        }
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        if (f.g > 0.04) anyAway = true;
        const pulse = 0.5 + 0.5 * Math.sin(t * f.blink * 2.4 + f.ph[1]);
        const alpha = clamp((0.28 + 0.34 * pulse) * (1 - f.g) + (0.7 + 0.3 * pulse) * f.g, 0, 1);
        const size = f.size * (1 + f.g * 0.25);
        const sy = ((((f.y - scrollY + M) % span) + span) % span) - M;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, f.x - size * 3, sy - size * 3, size * 6, size * 6);
        ctx.globalAlpha = Math.min(1, alpha + 0.2);
        ctx.beginPath();
        ctx.fillStyle = "#fff6c2";
        ctx.arc(f.x, sy, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // In front of the page while any are away with the cursor; behind it otherwise.
      if (anyAway !== front) {
        front = anyAway;
        canvas.classList.toggle("is-front", front);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return createPortal(<canvas ref={canvasRef} className="fireflies-canvas" aria-hidden="true" />, document.body);
}
