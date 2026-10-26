import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { getDisturbanceRect, subscribeDisturbance } from "@/lib/dragDisturbance";
import { pageDisturbed } from "@/lib/pageDisturbed";

interface Tip {
  text: string;
  theme: string | null;
  left: number;
  top: number;
  arrow: number;
  side: "top" | "bottom";
}

const GAP = 10;
const MARGIN = 8;
const SHOW_DELAY_MS = 250;
/** A balloon dismissed this recently is still "the one the visitor was looking at". */
const RECENT_MS = 1500;
/** The dragged window's snap-back takes 0.4s (useDraggableWindow); wait it out. */
const SETTLE_MS = 450;
/** While a page effect shakes the page, the pointer has to really travel this far (px) from where the balloon came up to dismiss it. */
const EFFECT_LEAVE_PX = 48;

/**
 * Replaces the browser's native `title` tooltip with the site's balloon: any
 * element carrying a `title` gets one on hover / keyboard focus, with an arrow
 * pointing at the element. The title is moved to `data-tip` while the element is
 * hovered/focused so the native bubble never shows, and put back afterwards.
 */
export function TooltipLayer() {
  const [tip, setTip] = useState<Tip | null>(null);
  const [shown, setShown] = useState(false);
  const [pending, setPending] = useState<{ target: HTMLElement; text: string } | null>(null);
  const balloon = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let timer = 0;
    let settleTimer = 0;
    let dragging = false;
    let resume: { target: HTMLElement; text: string } | null = null;
    let recent: { target: HTMLElement; text: string; at: number } | null = null;
    // The last real pointer position, and where it was when the balloon came up (null until it is known).
    let pointer: { x: number; y: number } | null = null;
    let shownAt: { x: number; y: number } | null = null;

    const restore = () => {
      const el = active.current;
      if (el?.dataset.tip !== undefined) {
        recent = { target: el, text: el.dataset.tip, at: performance.now() };
        el.setAttribute("title", el.dataset.tip);
        delete el.dataset.tip;
      }
      active.current = null;
    };
    /** Puts the balloon up (unplaced: the effect below measures and places it). */
    const present = (target: HTMLElement, text: string) => {
      if (!target.isConnected) return;
      shownAt = pointer;
      setPending({ target, text });
      setTip({ text, theme: target.closest("[data-theme]")?.getAttribute("data-theme") ?? null, left: 0, top: 0, arrow: 0, side: "top" });
    };
    const hide = () => {
      window.clearTimeout(timer);
      restore();
      setPending(null);
      setShown(false);
      setTip(null);
    };
    const show = (event: Event, instant: boolean) => {
      // Fake mouse-overs from an effect moving things under a still pointer must not swap the balloon.
      if (dragging || (pageDisturbed() && active.current)) return;
      const target = (event.target as Element | null)?.closest?.<HTMLElement>("[title]");
      if (!target || target === active.current) return;
      const text = target.getAttribute("title")?.trim();
      if (!text) return;
      hide();
      target.dataset.tip = text;
      target.removeAttribute("title");
      active.current = target;
      timer = window.setTimeout(() => present(target, text), instant ? 0 : SHOW_DELAY_MS);
    };
    // While a window is being dragged the balloon steps aside; once the window
    // is back in its default place, the one that was showing comes back.
    const onDrag = () => {
      const isDragging = getDisturbanceRect() !== null;
      if (isDragging === dragging) return;
      dragging = isDragging;
      window.clearTimeout(settleTimer);
      if (dragging) {
        // The press that starts a drag has already dismissed the balloon, a moment ago.
        const was = active.current ? { target: active.current, text: active.current.dataset.tip ?? "" } : recent && performance.now() - recent.at < RECENT_MS ? recent : null;
        resume = was && was.text ? { target: was.target, text: was.text } : null;
        hide();
        return;
      }
      const saved = resume;
      resume = null;
      if (!saved) return;
      settleTimer = window.setTimeout(() => {
        const { target, text } = saved;
        if (!target.isConnected || active.current) return;
        const current = target.getAttribute("title")?.trim() ?? text;
        target.dataset.tip = current;
        target.removeAttribute("title");
        active.current = target;
        present(target, current);
      }, SETTLE_MS);
    };
    const unsubscribe = subscribeDisturbance(onDrag);
    const onOver = (e: Event) => show(e, false);
    const onFocus = (e: Event) => show(e, true);
    const onOut = (e: Event) => {
      if (pageDisturbed()) return;
      const el = active.current;
      const next = (e as MouseEvent).relatedTarget as Node | null;
      if (el && !(next && el.contains(next))) hide();
    };

    // Real movement is the one thing an effect cannot fake: during one, the balloon goes only once the pointer has travelled away.
    const onMove = (e: MouseEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      if (!active.current || !pageDisturbed()) return;
      shownAt ??= pointer;
      if (Math.hypot(pointer.x - shownAt.x, pointer.y - shownAt.y) > EFFECT_LEAVE_PX) hide();
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("focusin", onFocus);
    // A focus change caused by an effect is no reason to take the balloon down.
    const onFocusOut = () => {
      if (!pageDisturbed()) hide();
    };
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("mousedown", hide);
    document.addEventListener("keydown", hide);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.clearTimeout(settleTimer);
      unsubscribe();
      hide();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("mousedown", hide);
      document.removeEventListener("keydown", hide);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  // Place the balloon once its text is rendered and measurable.
  useEffect(() => {
    if (!tip || shown || !pending || !balloon.current) return;
    const rect = pending.target.getBoundingClientRect();
    const { width, height } = balloon.current.getBoundingClientRect();
    const centre = rect.left + rect.width / 2;
    const left = Math.min(Math.max(centre - width / 2, MARGIN), window.innerWidth - width - MARGIN);
    const above = rect.top - GAP - height >= MARGIN;
    const top = above ? rect.top - GAP - height : rect.bottom + GAP;
    const arrow = Math.min(Math.max(centre - left, 14), width - 14);
    setTip({ ...tip, left, top, arrow, side: above ? "top" : "bottom" });
    setShown(true);
  }, [tip, shown, pending]);

  if (!tip) return null;
  return createPortal(
    <div
      ref={balloon}
      role="tooltip"
      data-theme={tip.theme ?? undefined}
      data-side={tip.side}
      className={`tip-balloon tip-floating glitch-float ${shown ? "is-shown" : ""}`}
      style={{ left: tip.left, top: tip.top, ["--tip-arrow" as string]: `${tip.arrow}px` }}
    >
      {tip.text}
    </div>,
    document.body,
  );
}
