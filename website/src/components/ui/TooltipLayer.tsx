import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Tip {
  text: string;
  left: number;
  top: number;
  side: "top" | "bottom";
  /** Where the arrow sits along the balloon (px from its left edge): under the middle of the thing it is about. */
  arrow: number;
}

const GAP = 10;
const MARGIN = 8;
const SHOW_DELAY_MS = 250;

/** Replaces the browser's own `title` tooltip with the site's tag: any element carrying a `title` gets one on hover
 * or keyboard focus. The title is moved to `data-tip` while the element is pointed at, so the native bubble never
 * shows, and put back afterwards. */
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
      timer = window.setTimeout(
        () => {
          if (!target.isConnected) return;
          setPending({ target, text });
          setTip({ text, left: 0, top: 0, side: "top", arrow: 0 });
        },
        instant ? 0 : SHOW_DELAY_MS,
      );
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

  // Place the tag once its text is rendered and measurable.
  useEffect(() => {
    if (!tip || shown || !pending || !balloon.current) return;
    const rect = pending.target.getBoundingClientRect();
    const { width, height } = balloon.current.getBoundingClientRect();
    const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, MARGIN), window.innerWidth - width - MARGIN);
    const above = rect.top - GAP - height >= MARGIN;
    const arrow = Math.min(Math.max(rect.left + rect.width / 2 - left, 14), width - 14);
    setTip({ ...tip, left, top: above ? rect.top - GAP - height : rect.bottom + GAP, side: above ? "top" : "bottom", arrow });
    setShown(true);
  }, [tip, shown, pending]);

  if (!tip) return null;
  return createPortal(
    <div ref={balloon} role="tooltip" data-side={tip.side} className={`tip-balloon ${shown ? "is-shown" : ""}`} style={{ left: tip.left, top: tip.top }}>
      {tip.text}
      <span className="tip-arrow" style={{ left: tip.arrow }} aria-hidden="true" />
    </div>,
    document.body,
  );
}
