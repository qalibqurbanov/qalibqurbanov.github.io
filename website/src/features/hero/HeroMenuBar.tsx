import { Check } from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

export type MenuEntry =
  | {
      type: "item";
      label: string;
      onSelect: () => void;
      /** Shown on the right, e.g. "Ctrl+Shift+L". Display only. */
      shortcut?: string;
      /** Draws a check mark when true (and the item reads as a radio/checkbox). */
      checked?: boolean;
      disabled?: boolean;
    }
  | { type: "heading"; label: string }
  | { type: "separator" };

export interface MenuDef {
  id: string;
  label: string;
  entries: MenuEntry[];
}

interface HeroMenuBarProps {
  menus: MenuDef[];
  /** Accessible name of the bar. */
  label: string;
}

/** A Notepad-style menu bar: click a menu to drop it down, then slide across
 * the bar to switch menus. Keyboard: ←/→ switch menu, ↑/↓ move, Home/End jump,
 * Enter/Space choose, Esc closes. */
export function HeroMenuBar({ menus, label }: HeroMenuBarProps) {
  const [open, setOpen] = useState<number | null>(null);
  // Index into the open menu's entries that holds focus, or -1 for none.
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectable = (menu: number) =>
    menus[menu].entries.flatMap((entry, index) => (entry.type === "item" && !entry.disabled ? [index] : []));

  function openMenu(menu: number, focus: "none" | "first" | "last" = "none") {
    const options = selectable(menu);
    setOpen(menu);
    setActive(focus === "first" ? (options[0] ?? -1) : focus === "last" ? (options[options.length - 1] ?? -1) : -1);
  }

  function close(returnFocus = false) {
    if (returnFocus && open !== null) triggerRefs.current[open]?.focus();
    setOpen(null);
    setActive(-1);
  }

  // Keep real focus on the highlighted item so arrow keys and Enter work on it.
  useEffect(() => {
    if (open !== null && active >= 0) itemRefs.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (open === null) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(null);
        setActive(-1);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function step(menu: number, from: number, direction: 1 | -1) {
    const options = selectable(menu);
    if (options.length === 0) return -1;
    const at = options.indexOf(from);
    return options[(at + direction + options.length) % options.length];
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const current = open ?? triggerRefs.current.indexOf(target as HTMLButtonElement);
    if (current < 0) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowLeft": {
        const next = (current + (event.key === "ArrowRight" ? 1 : -1) + menus.length) % menus.length;
        if (open !== null) openMenu(next, "first");
        else triggerRefs.current[next]?.focus();
        break;
      }
      case "ArrowDown":
        if (open === null) openMenu(current, "first");
        else setActive(step(open, active, 1));
        break;
      case "ArrowUp":
        if (open === null) openMenu(current, "last");
        else setActive(step(open, active, -1));
        break;
      case "Home":
      case "End": {
        if (open === null) return;
        const options = selectable(open);
        setActive(event.key === "Home" ? options[0] : options[options.length - 1]);
        break;
      }
      case "Escape":
        if (open === null) return;
        close(true);
        break;
      case "Tab":
        close();
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <div
      ref={rootRef}
      role="menubar"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="relative z-20 flex items-center gap-0.5 border-b border-border bg-surface-2/60 px-2 py-0.5 font-mono text-xs"
    >
      {menus.map((menu, menuIndex) => {
        const isOpen = open === menuIndex;
        return (
          <div key={menu.id} className="relative">
            <button
              ref={(el) => {
                triggerRefs.current[menuIndex] = el;
              }}
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={(event) => {
                // detail is 0 for a keyboard-initiated click (Enter / Space).
                if (isOpen) close();
                else openMenu(menuIndex, event.detail === 0 ? "first" : "none");
              }}
              onMouseEnter={() => {
                if (open !== null && !isOpen) openMenu(menuIndex);
              }}
              className={`rounded px-2.5 py-1 outline-none transition-colors focus-visible:text-accent ${
                isOpen ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface/60 hover:text-text"
              }`}
            >
              {menu.label}
            </button>

            {isOpen && (
              <div
                role="menu"
                aria-label={menu.label}
                className="animate-popover-in absolute left-0 top-full z-30 mt-1 min-w-[14rem] rounded-lg border border-border bg-surface p-1 shadow-xl shadow-black/30"
              >
                {menu.entries.map((entry, index) => {
                  if (entry.type === "separator") {
                    return <div key={index} role="separator" className="my-1 h-px bg-border" />;
                  }
                  if (entry.type === "heading") {
                    return (
                      <div key={index} className="px-2.5 pb-0.5 pt-1.5 text-[10px] uppercase tracking-wider text-muted/70">
                        {entry.label}
                      </div>
                    );
                  }
                  const isCheckable = entry.checked !== undefined;
                  return (
                    <button
                      key={index}
                      ref={(el) => {
                        itemRefs.current[index] = el;
                      }}
                      type="button"
                      role={isCheckable ? "menuitemradio" : "menuitem"}
                      aria-checked={isCheckable ? entry.checked : undefined}
                      aria-disabled={entry.disabled || undefined}
                      tabIndex={-1}
                      onMouseEnter={() => !entry.disabled && setActive(index)}
                      onClick={() => {
                        if (entry.disabled) return;
                        close();
                        entry.onSelect();
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none transition-colors ${
                        entry.disabled
                          ? "cursor-default text-muted/40"
                          : "text-text/90 focus:bg-accent/10 focus:text-accent"
                      }`}
                    >
                      <span className="grid w-3.5 shrink-0 place-items-center text-accent">
                        {entry.checked && <Check size={12} strokeWidth={2.5} />}
                      </span>
                      <span className="flex-1 whitespace-nowrap">{entry.label}</span>
                      {entry.shortcut && <span className="whitespace-nowrap pl-4 text-[11px] text-muted">{entry.shortcut}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
