import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

export interface MenuNode {
  label: string;
  /** A submenu; entering it pushes onto the breadcrumb. */
  children?: MenuNode[];
  /** A terminal command to run (and echo) when the item is chosen. */
  command?: string;
}

interface TerminalMenuProps {
  items: MenuNode[];
  /** Breadcrumb root, e.g. "menu". */
  title: string;
  labels: { hint: string; back: string; close: string };
  /** Called with a leaf's command; the caller is expected to close the menu. */
  onRun: (command: string) => void;
  onClose: () => void;
}

const VISIBLE_ROWS = 7;

/** A keyboard- and mouse-driven menu drawn inside the terminal. Arrow keys
 * (or j/k) move, Enter/→ opens, ←/Backspace/Esc goes up a level, q closes,
 * 1–9 jump to and open an item. */
export function TerminalMenu({ items, title, labels, onRun, onClose }: TerminalMenuProps) {
  const [path, setPath] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  // Resolve the level being shown from the path of entered submenus.
  const trail: MenuNode[] = [];
  let level = items;
  for (const index of path) {
    const node = level[index];
    trail.push(node);
    level = node.children ?? [];
  }

  function open(index: number) {
    const node = level[index];
    if (!node) return;
    if (node.children) {
      setPath([...path, index]);
      setCursor(0);
    } else if (node.command) {
      onRun(node.command);
    }
  }

  function back() {
    if (path.length === 0) {
      onClose();
      return;
    }
    setCursor(path[path.length - 1]);
    setPath(path.slice(0, -1));
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const count = level.length;
    let handled = true;
    switch (event.key) {
      case "ArrowDown":
      case "j":
        setCursor((cursor + 1) % count);
        break;
      case "ArrowUp":
      case "k":
        setCursor((cursor - 1 + count) % count);
        break;
      case "Home":
        setCursor(0);
        break;
      case "End":
        setCursor(count - 1);
        break;
      case "Enter":
      case "ArrowRight":
      case "l":
      case " ":
        open(cursor);
        break;
      case "ArrowLeft":
      case "Backspace":
      case "h":
      case "Escape":
        // At the root, ← is a no-op; only Esc/Backspace close from there.
        if (path.length > 0 || event.key === "Escape" || event.key === "Backspace") back();
        break;
      case "q":
        onClose();
        break;
      default:
        if (/^[1-9]$/.test(event.key) && Number(event.key) <= count) {
          setCursor(Number(event.key) - 1);
          open(Number(event.key) - 1);
        } else {
          handled = false;
        }
    }
    if (handled) {
      // Keep arrow keys from scrolling the page or feeding the Konami listener.
      event.preventDefault();
      event.stopPropagation();
    }
  }

  const start = Math.min(Math.max(cursor - Math.floor(VISIBLE_ROWS / 2), 0), Math.max(level.length - VISIBLE_ROWS, 0));
  const rows = level.slice(start, start + VISIBLE_ROWS);
  const crumbs = [title, ...trail.map((node) => node.label)];

  // Buttons must not steal focus from the menu, or its keys would stop working.
  const keepFocus = (event: { preventDefault: () => void }) => event.preventDefault();

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="menu"
      aria-label={crumbs.join(" > ")}
      onKeyDown={handleKeyDown}
      className="flex h-full flex-col outline-none"
    >
      <div className="flex items-center gap-2 border-b border-border pb-1.5">
        {path.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={keepFocus}
            onClick={back}
            className="text-muted transition-colors hover:text-accent"
          >
            ‹ {labels.back}
          </button>
        )}
        <span className="min-w-0 flex-1 truncate text-accent-2">{crumbs.join(" › ")}</span>
        <span className="text-muted tabular-nums">
          {cursor + 1}/{level.length}
        </span>
        <button
          type="button"
          tabIndex={-1}
          aria-label={labels.close}
          title={labels.close}
          onMouseDown={keepFocus}
          onClick={onClose}
          className="text-muted transition-colors hover:text-danger"
        >
          ×
        </button>
      </div>

      <div className="flex-1 py-1">
        {rows.map((node, offset) => {
          const index = start + offset;
          const selected = index === cursor;
          return (
            <div
              key={`${index}-${node.label}`}
              role="menuitem"
              aria-current={selected || undefined}
              onMouseMove={() => selected || setCursor(index)}
              onClick={() => open(index)}
              className={`flex cursor-pointer items-center gap-2 rounded px-2 ${
                selected ? "bg-accent/10 text-accent" : "text-text/85"
              }`}
            >
              <span className={selected ? "text-accent" : "text-muted"}>{selected ? "▸" : " "}</span>
              <span className="w-3 text-muted tabular-nums">{index < 9 ? index + 1 : ""}</span>
              <span className="min-w-0 flex-1 truncate">{node.label}</span>
              <span className="shrink-0 text-muted">{node.children ? "›" : `$ ${node.command?.split(" ")[0]}`}</span>
            </div>
          );
        })}
      </div>

      <div className="truncate border-t border-border pt-1.5 text-xs text-muted">{labels.hint}</div>
    </div>
  );
}
