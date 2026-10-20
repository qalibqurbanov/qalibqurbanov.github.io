import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { prefersReducedMotion } from "@/hooks/glitch";
import { useContent } from "@/i18n/context";
import type { View } from "@/lib/butterflyFlight";
import { ButterflyFlight } from "@/lib/butterflyFlight";
import { demolish } from "@/lib/demolition";

interface Trail {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  /** Digital "pixel" spark (a snapped square) instead of a soft dot. */
  pixel: boolean;
  color: string;
}

const MAX_TRAIL = 110;
const SOLID = "a, button, input, textarea, select, img, svg, video, canvas, [role='button'], [role='tab']";

function alphaOf(color: string): number {
  if (color === "transparent") return 0;
  const slash = /\/\s*([\d.]+%?)\s*\)/.exec(color);
  if (slash) return slash[1].endsWith("%") ? parseFloat(slash[1]) / 100 : parseFloat(slash[1]);
  const comma = /rgba\([^)]*,\s*([\d.]+)\s*\)/.exec(color);
  if (comma) return parseFloat(comma[1]);
  return 1;
}

/** Whether something visible sits on top of the butterfly at this point. The
 * butterfly flies *behind* the page, so only the page's visible pieces hide it
 * (and take the click): controls, images, anything with a background. The
 * transparent layout boxes around the content do not. */
/** Whether the point is on actual text of this element (not just its box). */
function onText(el: Element, x: number, y: number): boolean {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of Array.from(range.getClientRects())) {
      if (x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 2 && y <= r.bottom + 2) return true;
    }
  }
  return false;
}

const SIDES = ["Top", "Right", "Bottom", "Left"] as const;

function occludedAt(x: number, y: number): boolean {
  const area = window.innerWidth * window.innerHeight;
  for (const el of document.elementsFromPoint(x, y)) {
    if (el === document.documentElement || el === document.body) continue;
    if (el.matches(SOLID) || onText(el, x, y)) return true;
    const rect = el.getBoundingClientRect();
    // Big backdrops (a section's grid, a full-screen overlay is still caught
    // below by its colour) are not "in front of" a spot the way a card is.
    if (rect.width * rect.height > area * 0.45) {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" && alphaOf(cs.backgroundColor) > 0.05) return true;
      continue;
    }
    const cs = getComputedStyle(el);
    // Any visible surface: a fill (even a faint one), a border, a shadow or a glass blur.
    if (cs.backgroundImage !== "none" || alphaOf(cs.backgroundColor) > 0.01) return true;
    if (cs.boxShadow !== "none" || (cs.backdropFilter && cs.backdropFilter !== "none")) return true;
    for (const side of SIDES) {
      if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== "none" && alphaOf(cs[`border${side}Color`]) > 0.01) return true;
    }
  }
  return false;
}

/** A cyberpunk butterfly that roams the whole page — in the page's own
 * coordinates, so it scrolls with the content and is only seen when its part
 * of the page is on screen — and sometimes slips off the side. It flies
 * behind the content. Clicking it demolishes the page (lib/demolition.ts).
 * Because it sits under the page, clicks are detected on the window rather
 * than on the butterfly itself, and only count where nothing visible covers it. */
export function CyberButterfly() {
  const { ui } = useContent();
  const layerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef({ hint: ui.butterfly.hint, hintAny: ui.butterfly.hintAny });

  useEffect(() => {
    hintRef.current = { hint: ui.butterfly.hint, hintAny: ui.butterfly.hintAny };
  }, [ui.butterfly.hint, ui.butterfly.hintAny]);

  useEffect(() => {
    const layer = layerRef.current;
    const body = bodyRef.current;
    const canvas = trailRef.current;
    const ctx = canvas?.getContext("2d");
    if (!layer || !body || !canvas || !ctx) return;

    const calm = prefersReducedMotion();
    const size = window.innerWidth < 640 ? 44 : 58;
    const hit = Math.round(size * 1.3);
    body.style.setProperty("--bf-hit", `${hit}px`);
    // Without motion it rests in a corner of the screen instead of roaming.
    if (calm) layer.classList.add("is-fixed");

    let W = document.documentElement.clientWidth;
    let H = window.innerHeight;
    let docH = Math.max(document.body.offsetHeight, H);
    const view = (): View => ({ w: W, h: H, scrollY: calm ? 0 : window.scrollY, docH });
    const flight = new ButterflyFlight(size, view());
    const rest = () => {
      flight.x = 36 + hit / 2;
      flight.y = H - 96;
    };
    if (calm) rest();

    const css = getComputedStyle(document.documentElement);
    const colors = [
      css.getPropertyValue("--color-accent").trim() || "#b185ff",
      css.getPropertyValue("--color-accent-2").trim() || "#22d3ee",
      "#ffffff",
    ];

    const trail: Trail[] = [];
    let mode: "fly" | "charging" = "fly";
    let hover = false;
    let pointer: { x: number; y: number } | null = null;
    let raf = 0;
    let last = performance.now();
    let flap = 0.2;
    let spawn = 0;
    let chargedAt = 0;

    const measure = () => {
      W = document.documentElement.clientWidth;
      H = window.innerHeight;
      docH = Math.max(document.body.offsetHeight, H);
      canvas.width = W;
      canvas.height = H;
      layer.style.height = calm ? "" : `${docH}px`;
    };
    measure();
    window.addEventListener("resize", measure);
    // Content can grow (images, fonts, live data); keep the roaming area the page's height.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);

    const emit = (n: number, spread: number, burst = false) => {
      for (let i = 0; i < n && trail.length < MAX_TRAIL; i++) {
        const back = flight.heading + Math.PI;
        const a = burst ? Math.random() * Math.PI * 2 : back + (Math.random() - 0.5) * 1.6;
        const s = burst ? 40 + Math.random() * 160 : 10 + Math.random() * 40;
        const life = 0.45 + Math.random() * 0.8;
        trail.push({
          x: flight.x + (Math.random() - 0.5) * spread,
          y: flight.y + (Math.random() - 0.5) * spread,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life,
          max: life,
          size: 1.5 + Math.random() * 2.5,
          pixel: Math.random() < 0.45,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    /** The butterfly's spot in viewport coordinates, for hit tests. */
    const screen = () => ({ x: flight.x, y: flight.y + flight.bob - (calm ? 0 : window.scrollY) });
    const overButterfly = (cx: number, cy: number) => {
      const p = screen();
      return Math.hypot(cx - p.x, cy - p.y) < hit * 0.6;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const v = view();

      if (mode === "fly") {
        if (!calm) flight.update(dt, v, hover ? 0.3 : 1);
        const wanted = calm ? 0.45 : Math.min(0.34, Math.max(0.15, 0.4 - flight.speed / 700));
        if (Math.abs(wanted - flap) > 0.015) {
          flap = wanted;
          body.style.setProperty("--bf-flap", `${flap.toFixed(3)}s`);
        }
        // Hovering only counts where the butterfly is actually showing.
        const near = pointer !== null && overButterfly(pointer.x, pointer.y) && flight.visible(v);
        const hot = near && pointer !== null && !occludedAt(pointer.x, pointer.y);
        if (hot !== hover) {
          hover = hot;
          body.classList.toggle("is-hover", hot);
        }
      } else if (now - chargedAt < 640) {
        emit(3, 28, true);
      }

      body.style.transform = `translate3d(${(flight.x - hit / 2).toFixed(1)}px, ${(flight.y + flight.bob - hit / 2).toFixed(1)}px, 0) rotate(${flight.angle.toFixed(3)}rad)`;

      if (mode === "fly" && !calm && flight.visible(v)) {
        spawn += dt * (6 + Math.min(16, flight.speed / 16));
        while (spawn >= 1) {
          emit(1, 12);
          spawn -= 1;
        }
      }

      // The trail is stored in page coordinates, drawn offset by the scroll.
      const off = calm ? 0 : window.scrollY;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.life -= dt;
        if (p.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - 1.2 * dt;
        p.vy *= 1 - 1.2 * dt;
        const k = p.life / p.max;
        const dy = p.y - off;
        if (dy < -20 || dy > H + 20) continue;
        ctx.globalAlpha = k * 0.9;
        ctx.fillStyle = p.color;
        if (p.pixel) {
          const s = Math.max(2, Math.round(p.size));
          ctx.fillRect(Math.round(p.x / 3) * 3, Math.round(dy / 3) * 3, s, s);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, dy, p.size * (0.4 + k * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
    };
    const onLeave = () => {
      pointer = null;
    };
    const onDown = (event: PointerEvent) => {
      if (mode !== "fly" || !flight.visible(view())) return;
      if (!overButterfly(event.clientX, event.clientY) || occludedAt(event.clientX, event.clientY)) return;
      event.preventDefault();
      event.stopPropagation();
      mode = "charging";
      chargedAt = performance.now();
      hover = false;
      body.classList.remove("is-hover");
      const origin = screen();
      body.classList.add("is-charging");
      // Held for the build-up, then it goes off with the first pulse.
      window.setTimeout(() => body.classList.add("is-gone"), 640);
      void demolish(origin, hintRef.current).then(() => {
        trail.length = 0;
        body.classList.remove("is-charging", "is-gone");
        flight.respawn(view());
        if (calm) rest();
        mode = "fly";
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { capture: true });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown, { capture: true });
    };
  }, []);

  return createPortal(
    <>
      <canvas ref={trailRef} className="cyber-trail" aria-hidden="true" />
      <div ref={layerRef} className="cyber-layer" aria-hidden="true">
        <div ref={bodyRef} className="cyber-butterfly">
          <svg viewBox="0 0 120 120" focusable="false">
            <defs>
              <linearGradient id="bf-grad" x1="0" y1="0" x2="1" y2="1" spreadMethod="reflect">
                <stop offset="0" style={{ stopColor: "var(--color-accent-2)" }} />
                <stop offset="0.5" style={{ stopColor: "var(--color-accent)" }} />
                <stop offset="1" style={{ stopColor: "var(--color-accent-2)" }} />
                <animateTransform attributeName="gradientTransform" type="translate" from="-0.6 -0.6" to="0.6 0.6" dur="3.4s" repeatCount="indefinite" />
              </linearGradient>
              <pattern id="bf-scan" width="4" height="3" patternUnits="userSpaceOnUse">
                <rect width="4" height="1" fill="#fff" fillOpacity="0.22" />
              </pattern>
              <g id="bf-half">
                <polygon points="64,54 78,28 104,10 117,24 109,52 90,63 65,62" fill="url(#bf-grad)" fillOpacity="0.3" stroke="url(#bf-grad)" strokeWidth="1.5" strokeLinejoin="round" />
                <polygon points="65,66 91,71 103,93 90,111 72,98 63,78" fill="url(#bf-grad)" fillOpacity="0.22" stroke="url(#bf-grad)" strokeWidth="1.5" strokeLinejoin="round" />
                <polygon points="64,54 78,28 104,10 117,24 109,52 90,63 65,62" fill="url(#bf-scan)" />
                <polygon points="65,66 91,71 103,93 90,111 72,98 63,78" fill="url(#bf-scan)" />
                <path d="M66 56 L88 30 L104 17 M82 53 L99 35 L112 27 M69 68 L92 80 L99 94 M76 80 L85 99" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="104" cy="17" r="1.9" fill="#fff" />
                <circle cx="112" cy="27" r="1.6" fill="#fff" />
                <circle cx="99" cy="94" r="1.8" fill="#fff" />
                <circle cx="85" cy="99" r="1.5" fill="#fff" />
              </g>
            </defs>
            <g className="bf-wings">
              <use href="#bf-half" />
              <use href="#bf-half" transform="translate(120 0) scale(-1 1)" />
            </g>
            <path d="M60 36 Q64 41 63.5 60 Q63 82 60 95 Q57 82 56.5 60 Q56 41 60 36Z" fill="#fff" fillOpacity="0.9" stroke="var(--color-accent-2)" strokeWidth="1" />
            <circle cx="60" cy="32.5" r="4.2" fill="#fff" stroke="var(--color-accent-2)" strokeWidth="1" />
            <path d="M58.6 29.5 Q52 18 44 9 M61.4 29.5 Q68 18 76 9" fill="none" stroke="var(--color-accent-2)" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="44" cy="9" r="1.7" fill="var(--color-accent)" />
            <circle cx="76" cy="9" r="1.7" fill="var(--color-accent)" />
            <circle className="bf-core" cx="60" cy="58" r="2.6" fill="var(--color-accent-2)" />
          </svg>
        </div>
      </div>
    </>,
    document.body,
  );
}
