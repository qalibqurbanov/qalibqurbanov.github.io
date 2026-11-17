import type { PointerEvent } from "react";
import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

/** How much of the way to its target each value travels in a frame: small is slow and smooth. */
const EASE = 0.1;

interface Pose {
  px: number;
  py: number;
  rx: number;
  ry: number;
  mx: number;
  my: number;
}

const REST: Pose = { px: 0, py: 0, rx: 0, ry: 0, mx: 50, my: 50 };

/** My picture, with two thin rings in the site's colours. Pointed at, a cyan-and-magenta aurora glows behind it and
 * follows the pointer, and the picture and the two rings drift toward the pointer at different speeds, so they come
 * apart like layers. The movement is eased frame by frame, so it glides instead of following every jolt of the pointer,
 * and it settles back gently. The values are written straight to CSS variables (see `.avatar` in theme.css), so
 * nothing re-renders while it moves. */
export function Avatar({ src, alt }: { src: string; alt: string }) {
  const stage = useRef<HTMLSpanElement>(null);
  const photo = useRef<HTMLSpanElement>(null);
  const target = useRef<Pose>({ ...REST });
  const current = useRef<Pose>({ ...REST });
  const frame = useRef(0);

  function paint() {
    const el = stage.current;
    if (!el) return;
    const p = current.current;
    el.style.setProperty("--px", `${p.px.toFixed(2)}px`);
    el.style.setProperty("--py", `${p.py.toFixed(2)}px`);
    el.style.setProperty("--rx", `${p.rx.toFixed(2)}px`);
    el.style.setProperty("--ry", `${p.ry.toFixed(2)}px`);
    el.style.setProperty("--mx", `${p.mx.toFixed(2)}%`);
    el.style.setProperty("--my", `${p.my.toFixed(2)}%`);
  }

  function step() {
    const keys = Object.keys(REST) as (keyof Pose)[];
    let moving = false;
    for (const key of keys) {
      const gap = target.current[key] - current.current[key];
      if (Math.abs(gap) > 0.02) {
        current.current[key] += gap * EASE;
        moving = true;
      } else {
        current.current[key] = target.current[key];
      }
    }
    paint();
    frame.current = moving ? requestAnimationFrame(step) : 0;
  }

  function run() {
    if (prefersReducedMotion()) {
      current.current = { ...target.current };
      paint();
      return;
    }
    if (!frame.current) frame.current = requestAnimationFrame(step);
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function follow(event: PointerEvent) {
    const box = photo.current?.getBoundingClientRect();
    if (!box) return;
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    target.current = {
      px: clamp(dx * 0.08, 7),
      py: clamp(dy * 0.08, 7),
      rx: clamp(dx * 0.18, 12),
      ry: clamp(dy * 0.18, 12),
      mx: ((event.clientX - box.left) / box.width) * 100,
      my: ((event.clientY - box.top) / box.height) * 100,
    };
    run();
  }

  function rest() {
    target.current = { ...REST };
    run();
  }

  return (
    <span ref={stage} className="avatar" onPointerMove={follow} onPointerLeave={rest}>
      <span ref={photo} className="avatar-photo">
        <span className="avatar-aurora" aria-hidden="true" />
        <span className="avatar-ring avatar-ring-a" aria-hidden="true" />
        <span className="avatar-ring avatar-ring-b" aria-hidden="true" />
        <img src={src} alt={alt} width={88} height={88} decoding="async" />
      </span>
    </span>
  );
}
