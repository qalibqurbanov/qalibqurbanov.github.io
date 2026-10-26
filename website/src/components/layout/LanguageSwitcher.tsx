import { Check, ChevronDown } from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useContent, useLocale } from "@/i18n/context";
import { getLocaleMeta, SUPPORTED_LOCALES } from "@/i18n/locale";

const EDGE_GAP = 8;
const MENU_GAP = 8;

interface Anchor {
  left: number;
  top: number;
  minWidth: number;
}

/** The language menu. It is drawn on the page itself, at fixed coordinates, instead of inside the
 * navbar: the page effects (signal loss, the storm) tear and shake the navbar, and a menu that
 * follows it would be dragged away from its button. It closes only from the visitor's own
 * actions: choosing a language, Esc, Tab, or pressing outside it. */
export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const { ui } = useContent();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  // The row the keyboard (or the pointer) is on.
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = getLocaleMeta(locale);

  function openMenu() {
    setActive(Math.max(0, SUPPORTED_LOCALES.findIndex((meta) => meta.code === locale)));
    setOpen(true);
  }

  function closeMenu(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function choose(index: number) {
    setLocale(SUPPORTED_LOCALES[index].code);
    closeMenu(true);
  }

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({ left: rect.left, top: rect.bottom + MENU_GAP, minWidth: rect.width });
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  // Keep the menu inside the window, once its width is known.
  useLayoutEffect(() => {
    const width = menuRef.current?.offsetWidth;
    if (!open || !anchor || !width) return;
    const left = Math.min(anchor.left, window.innerWidth - width - EDGE_GAP);
    if (left !== anchor.left) setAnchor({ ...anchor, left: Math.max(EDGE_GAP, left) });
  }, [open, anchor]);

  // Keyboard focus moves into the list while it is open.
  useEffect(() => {
    if (open && anchor) listRef.current?.focus();
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      const hit = (el: HTMLElement | null) => {
        const rect = el?.getBoundingClientRect();
        return !!rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      };
      if (!hit(triggerRef.current) && !hit(menuRef.current)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function handleTriggerKeyDown(event: ReactKeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu();
    }
  }

  function handleListKeyDown(event: ReactKeyboardEvent) {
    const last = SUPPORTED_LOCALES.length - 1;
    switch (event.key) {
      case "ArrowDown":
        setActive((value) => Math.min(last, value + 1));
        break;
      case "ArrowUp":
        setActive((value) => Math.max(0, value - 1));
        break;
      case "Home":
        setActive(0);
        break;
      case "End":
        setActive(last);
        break;
      case "Enter":
      case " ":
        choose(active);
        break;
      case "Escape":
        closeMenu(true);
        break;
      case "Tab":
        closeMenu(false);
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ui.labels.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-xs outline-none transition-colors hover:border-accent/60 hover:text-accent focus-visible:border-accent focus-visible:text-accent ${open ? "border-accent text-accent" : "border-border text-muted"}`}
      >
        <span>{current.nativeLabel}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && anchor
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[60] animate-popover-in"
              style={{ left: anchor.left, top: anchor.top, minWidth: anchor.minWidth, transformOrigin: "top left" }}
            >
              <div className="glitch-float overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-lg">
                <div
                  ref={listRef}
                  id={listId}
                  role="listbox"
                  tabIndex={-1}
                  aria-label={ui.labels.language}
                  aria-activedescendant={`${listId}-${active}`}
                  onKeyDown={handleListKeyDown}
                  onBlur={(event) => {
                    const next = event.relatedTarget as Node | null;
                    if (!event.currentTarget.contains(next) && !triggerRef.current?.contains(next)) setOpen(false);
                  }}
                  className="outline-none"
                >
                  {SUPPORTED_LOCALES.map((meta, index) => (
                    <div
                      key={meta.code}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={meta.code === locale}
                      onPointerMove={() => setActive(index)}
                      onClick={() => choose(index)}
                      className={`flex cursor-pointer select-none items-center justify-between gap-4 rounded px-2.5 py-1.5 font-mono text-xs ${index === active ? "bg-surface-2 text-accent" : meta.code === locale ? "text-accent" : "text-muted"}`}
                    >
                      <span>{meta.nativeLabel}</span>
                      {meta.code === locale ? <Check size={12} /> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
