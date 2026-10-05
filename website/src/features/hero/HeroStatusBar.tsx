import { Moon, Sun } from "lucide-react";

interface HeroStatusBarProps {
  /** Accessible name of the bar. */
  label: string;
  /** Left side: state, e.g. "Ready". */
  status: string;
  /** Right side: tab count, already formatted. */
  tabs: string;
  /** Right side: the active tab's kind, e.g. "C#". */
  mode: string;
  /** The window's own theme, which the button switches. */
  theme: "light" | "dark";
  themeLabel: string;
  onToggleTheme: () => void;
}

const ITEM = "flex items-center gap-1.5 px-2 py-1";
const BUTTON = `${ITEM} outline-none transition-colors hover:bg-accent/10 hover:text-accent focus-visible:bg-accent/10 focus-visible:text-accent`;

/** The strip along the window's bottom edge: the state on the left; tab
 * count, mode, encoding and the window's theme switch on the right. */
export function HeroStatusBar({
  label,
  status,
  tabs,
  mode,
  theme,
  themeLabel,
  onToggleTheme,
}: HeroStatusBarProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex items-stretch justify-between gap-2 overflow-hidden border-t border-border bg-surface-2 font-mono text-[11px] leading-4 text-muted"
    >
      <div className="flex min-w-0 items-stretch">
        <span className={`${ITEM} shrink-0 text-accent`}>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
          {status}
        </span>
      </div>
      <div className="flex shrink-0 items-stretch">
        <span className={`${ITEM} hidden sm:flex`}>{tabs}</span>
        <span className={ITEM}>{mode}</span>
        <span className={`${ITEM} hidden sm:flex`}>UTF-8</span>
        <button type="button" onClick={onToggleTheme} title={themeLabel} aria-label={themeLabel} className={BUTTON}>
          {theme === "dark" ? <Moon size={12} /> : <Sun size={12} />}
        </button>
      </div>
    </div>
  );
}
