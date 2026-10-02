import { useEffect, useRef } from "react";

import { decodeText, prefersReducedMotion, registerGlitch, ruleBurst, textBurst } from "@/hooks/glitch";
import { belowNavbarMargin } from "@/lib/viewport";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Calls `onChange` whenever `el` crosses the visibility threshold; the area
 * under the fixed navbar doesn't count as visible. */
function watchVisible(el: Element, threshold: number, onChange: (visible: boolean) => void): () => void {
  const observer = new IntersectionObserver(([entry]) => onChange(entry.intersectionRatio >= threshold - 0.01), {
    threshold,
    rootMargin: belowNavbarMargin(),
  });
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

const DEFAULT_IDLE_RANGE = [4000, 10000] as const;

interface GlitchTextOptions {
  /** Play an entrance as the text scrolls into view. */
  onEnter?: boolean;
  /** Make that entrance a decode (noise settling into the text) instead of a split. */
  decode?: boolean;
  /** Glitch now and then, at random, while the text is on screen. */
  idle?: boolean;
  /** Shortest and longest wait, in ms, between idle glitches. */
  idleRange?: readonly [number, number];
}

/** Glitches the text while the pointer is over it (or over the link, button or
 * `data-glitch-host` element it sits in), keeps re-glitching at random
 * intervals for as long as it stays there, and optionally also on scroll-in
 * and idly. Pair with `.glitch-text`. */
export function useGlitchText<T extends HTMLElement>({
  onEnter = false,
  decode = false,
  idle = false,
  idleRange = DEFAULT_IDLE_RANGE,
}: GlitchTextOptions = {}) {
  const ref = useRef<T>(null);
  const [idleMin, idleMax] = idleRange;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let cancel: (() => void) | undefined;
    const fire = (frames = 6) => {
      cancel?.();
      cancel = textBurst(el, frames);
    };
    const unregister = registerGlitch(el, () => fire(8));

    const host = el.closest<HTMLElement>("a, button, [data-glitch-host]") ?? el;
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

    let enterTimer = 0;
    let stopIdle: (() => void) | undefined;
    const stopWatching =
      onEnter || idle
        ? watchVisible(el, onEnter ? 0.8 : 0.1, (visible) => {
            if (!visible) {
              window.clearTimeout(enterTimer);
              stopIdle?.();
              stopIdle = undefined;
              return;
            }
            if (onEnter) {
              // Plays on every scroll-in, not just the first.
              window.clearTimeout(enterTimer);
              // After the section's own fade-in has mostly played.
              enterTimer = window.setTimeout(() => {
                if (!decode) {
                  fire(8);
                  return;
                }
                cancel?.();
                const stopDecode = decodeText(el);
                // A last flicker as the final letters lock in.
                const kick = window.setTimeout(() => fire(3), 720);
                cancel = () => {
                  stopDecode();
                  window.clearTimeout(kick);
                };
              }, 350);
            }
            if (idle && !stopIdle) stopIdle = loop(() => fire(2 + Math.floor(Math.random() * 3)), idleMin, idleMax);
          })
        : undefined;

    return () => {
      stopWatching?.();
      stopIdle?.();
      stopHover?.();
      window.clearTimeout(enterTimer);
      host.removeEventListener("mouseenter", handleEnter);
      host.removeEventListener("mouseleave", handleLeave);
      unregister();
      cancel?.();
    };
  }, [onEnter, decode, idle, idleMin, idleMax]);

  return ref;
}

/** Drives a `.glitch-rule` separator: a heavy burst as it scrolls into view
 * (every time), a short one every few seconds while it stays on screen,
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

    let enterTimer = 0;
    let stopIdle: (() => void) | undefined;
    const stopWatching = watchVisible(el, 0.5, (visible) => {
      if (!visible) {
        window.clearTimeout(enterTimer);
        stopIdle?.();
        stopIdle = undefined;
        return;
      }
      window.clearTimeout(enterTimer);
      enterTimer = window.setTimeout(() => fire(9), 250);
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

/** Drives the scroll-progress bar's `.glitch-bar`: it tears when the page is
 * scrolled fast (a section jump, a flick of the wheel) and now and then at
 * random while the page is scrolled down. */
export function useGlitchBar<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let cancel: (() => void) | undefined;
    const fire = (frames: number) => {
      cancel?.();
      cancel = ruleBurst(el, frames);
    };

    let lastY = window.scrollY;
    let lastTime = performance.now();
    let lastFire = 0;
    const handleScroll = () => {
      const now = performance.now();
      const speed = Math.abs(window.scrollY - lastY) / Math.max(1, now - lastTime);
      lastY = window.scrollY;
      lastTime = now;
      if (speed > 2.5 && now - lastFire > 800) {
        lastFire = now;
        fire(4 + Math.floor(Math.random() * 4));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    const stopIdle = loop(() => {
      if (window.scrollY > 8) fire(2 + Math.floor(Math.random() * 3));
    }, 7000, 15000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      stopIdle();
      cancel?.();
    };
  }, []);

  return ref;
}
