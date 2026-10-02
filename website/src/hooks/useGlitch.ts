import { useEffect, useRef } from "react";

import { prefersReducedMotion, registerGlitch, ruleBurst, textBurst } from "@/hooks/glitch";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Calls `onChange` whenever `el` crosses the visibility threshold. */
function watchVisible(el: Element, threshold: number, onChange: (visible: boolean) => void): () => void {
  const observer = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), { threshold });
  observer.observe(el);
  return () => observer.disconnect();
}

/** Calls `fire` at random intervals until stopped. */
function loop(fire: () => void, min: number, max: number): () => void {
  let timer = 0;
  const next = () => {
    timer = window.setTimeout(() => {
      fire();
      next();
    }, rand(min, max));
  };
  next();
  return () => window.clearTimeout(timer);
}

interface GlitchTextOptions {
  /** Glitch once as the text scrolls into view. */
  onEnter?: boolean;
  /** Glitch now and then, at random, while the text is on screen. */
  idle?: boolean;
}

/** Glitches the text while the pointer is over it (or over the link/button it
 * sits in), keeps re-glitching at random intervals for as long as it stays
 * there, and optionally also on scroll-in and idly. Pair with `.glitch-text`. */
export function useGlitchText<T extends HTMLElement>({ onEnter = false, idle = false }: GlitchTextOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let cancel: (() => void) | undefined;
    const fire = (frames = 6) => {
      cancel?.();
      cancel = textBurst(el, frames);
    };
    const unregister = registerGlitch(el, () => fire(8));

    const host = el.closest<HTMLElement>("a, button") ?? el;
    let stopHover: (() => void) | undefined;
    const handleEnter = () => {
      fire(6);
      stopHover?.();
      stopHover = loop(() => fire(1 + Math.floor(Math.random() * 5)), 500, 1700);
    };
    const handleLeave = () => {
      stopHover?.();
      stopHover = undefined;
      cancel?.();
      cancel = undefined;
    };
    host.addEventListener("mouseenter", handleEnter);
    host.addEventListener("mouseleave", handleLeave);

    let entered = false;
    let enterTimer = 0;
    let stopIdle: (() => void) | undefined;
    const stopWatching = watchVisible(el, onEnter ? 0.8 : 0.1, (visible) => {
      if (!visible) {
        stopIdle?.();
        stopIdle = undefined;
        return;
      }
      if (onEnter && !entered) {
        entered = true;
        // After the section's own fade-in has mostly played.
        enterTimer = window.setTimeout(() => fire(8), 350);
      }
      if (idle && !stopIdle) stopIdle = loop(() => fire(2 + Math.floor(Math.random() * 3)), 4000, 10000);
    });

    return () => {
      stopWatching();
      stopIdle?.();
      stopHover?.();
      window.clearTimeout(enterTimer);
      host.removeEventListener("mouseenter", handleEnter);
      host.removeEventListener("mouseleave", handleLeave);
      unregister();
      cancel?.();
    };
  }, [onEnter, idle]);

  return ref;
}

/** Drives a `.glitch-rule` separator: a heavy burst as it scrolls into view
 * for the first time, a short one every few seconds while it stays on screen,
 * and one when the pointer crosses it. */
export function useGlitchRule<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let cancel: (() => void) | undefined;
    const fire = (frames: number) => {
      cancel?.();
      cancel = ruleBurst(el, frames);
    };
    const unregister = registerGlitch(el, () => fire(9));
    const handleEnter = () => fire(5);
    el.addEventListener("mouseenter", handleEnter);

    let entered = false;
    let enterTimer = 0;
    let stopIdle: (() => void) | undefined;
    const stopWatching = watchVisible(el, 0.5, (visible) => {
      if (!visible) {
        stopIdle?.();
        stopIdle = undefined;
        return;
      }
      if (!entered) {
        entered = true;
        enterTimer = window.setTimeout(() => fire(9), 250);
      }
      if (!stopIdle) stopIdle = loop(() => fire(2 + Math.floor(Math.random() * 4)), 3500, 9000);
    });

    return () => {
      stopWatching();
      stopIdle?.();
      window.clearTimeout(enterTimer);
      el.removeEventListener("mouseenter", handleEnter);
      unregister();
      cancel?.();
    };
  }, []);

  return ref;
}
