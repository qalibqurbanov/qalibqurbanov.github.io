import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

    const restore = () => {
      const el = active.current;
      if (el?.dataset.tip !== undefined) {
        el.setAttribute("title", el.dataset.tip);
        delete el.dataset.tip;
      }
      active.current = null;
    };
    const hide = () => {
      window.clearTimeout(timer);
      restore();
      setPending(null);
      setShown(false);
      setTip(null);
    };
    const show = (event: Event, instant: boolean) => {
      const target = (event.target as Element | null)?.closest?.<HTMLElement>("[title]");
      if (!target || target === active.current) return;
      const text = target.getAttribute("title")?.trim();
      if (!text) return;
      hide();
      target.dataset.tip = text;
      target.removeAttribute("title");
      active.current = target;
      timer = window.setTimeout(() => setPending({ target, text }), instant ? 0 : SHOW_DELAY_MS);
    };
    const onOver = (e: Event) => show(e, false);
    const onFocus = (e: Event) => show(e, true);
    const onOut = (e: Event) => {
      const el = active.current;
      const next = (e as MouseEvent).relatedTarget as Node | null;
      if (el && !(next && el.contains(next))) hide();
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", hide);
    document.addEventListener("mousedown", hide);
    document.addEventListener("keydown", hide);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      hide();
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("mousedown", hide);
      document.removeEventListener("keydown", hide);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  // Place the balloon once its text is rendered and measurable.
  useEffect(() => {
    if (!pending) return;
    const { target, text } = pending;
    if (!target.isConnected) return;
    setTip({ text, theme: target.closest("[data-theme]")?.getAttribute("data-theme") ?? null, left: 0, top: 0, arrow: 0, side: "top" });
  }, [pending]);

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
      className={`tip-balloon tip-floating ${shown ? "is-shown" : ""}`}
      style={{ left: tip.left, top: tip.top, ["--tip-arrow" as string]: `${tip.arrow}px` }}
    >
      {tip.text}
    </div>,
    document.body,
  );
}
