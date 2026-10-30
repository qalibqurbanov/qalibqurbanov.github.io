import { Brush, Check, ChevronDown, Moon, Settings, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";
import type { Motion } from "@/lib/motion";
import { useMotion } from "@/motion/context";
import { useMotionLabel } from "@/motion/labels";
import { useTheme } from "@/themes/shared/colour/context";
import { PALETTES, PALETTE_SWATCHES } from "@/themes/shared/colour/palettes";
import { useStyle } from "@/themes/shared/style/context";
import { STYLES } from "@/themes";

import { MotionSlider } from "./MotionSlider";

/** The stops of the animation slider, from the calmest page on the left to the fullest on the right. */
const STOPS: readonly Motion[] = ["off", "light", "full"];

function swatch([a, b]: readonly [string, string], size: string) {
  return <span className={`${size} shrink-0 rounded-full border border-border`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} aria-hidden="true" />;
}

/** A row with the current choice whose options open under it on click or tap. */
function Submenu({ label, current, swatch: icon, children }: { label: string; current: string; swatch: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left font-mono text-sm text-text transition-colors duration-150 ease-out hover:bg-surface-2"
      >
        {icon}
        <span className="flex-1">{label}</span>
        <span className="text-xs text-accent">{current}</span>
        <ChevronDown size={14} aria-hidden="true" className={`text-muted transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`} />
      </button>
      {/* Always mounted so it can glide open and shut; closed, it is out of reach of the keyboard. */}
      <div
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="mt-1 ml-4 space-y-0.5 border-l border-border pl-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Choice({ active, onSelect, swatch: icon, title, children }: { active: boolean; onSelect: () => void; swatch?: ReactNode; title?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      title={title}
      className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left font-mono text-sm transition-colors duration-150 ease-out hover:bg-surface-2 ${active ? "text-accent" : "text-text"}`}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {active && <Check size={14} aria-hidden="true" />}
    </button>
  );
}

/** The navbar's one settings button: a popup with the light/dark mode, the colour theme, the style
 * and the animation level. */
export function SettingsMenu() {
  const { theme, toggleTheme, palette, setPalette } = useTheme();
  const { style, setStyle } = useStyle();
  const { motion, setMotion } = useMotion();
  const { ui } = useContent();
  const levelName = useMotionLabel();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const title = "font-mono text-xs uppercase tracking-wider text-muted";
  const modes = [
    { id: "dark", Icon: Moon, name: ui.labels.modeDark },
    { id: "light", Icon: Sun, name: ui.labels.modeLight },
  ] as const;

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center text-muted hover:text-accent transition-colors md:h-auto md:w-auto"
        onClick={() => setOpen((value) => !value)}
        aria-label={ui.labels.settings}
        aria-haspopup="true"
        aria-expanded={open}
        title={format(ui.labels.toggleTheme, { shortcut: "Alt+T" })}
      >
        <Settings size={19} />
      </button>

      {open && (
        <div
          role="group"
          aria-label={ui.labels.settings}
          className="absolute right-0 top-full z-[60] mt-3 w-64 animate-popover-in space-y-4 rounded-lg border border-border bg-surface p-4 shadow-lg shadow-black/20"
        >
          <section>
            <p className={title}>{ui.labels.settings}</p>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-md border border-border bg-bg p-1">
              {modes.map(({ id, Icon, name }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={theme === id}
                  onClick={() => theme !== id && toggleTheme()}
                  className={`inline-flex items-center justify-center gap-2 rounded px-2 py-1.5 font-mono text-xs capitalize transition-colors duration-150 ease-out ${theme === id ? "bg-surface-2 text-accent" : "text-muted hover:text-text"}`}
                >
                  <Icon size={14} aria-hidden="true" />
                  {name}
                </button>
              ))}
            </div>
          </section>

          {/* Each of these is one row that shows the current choice; the choices open under it when
              the pointer moves onto it (or on a tap) and fold away when it leaves. */}
          <Submenu label={ui.labels.style} current={STYLES.find((item) => item.id === style)?.name ?? style} swatch={<Brush size={16} className="shrink-0 text-accent" aria-hidden="true" />}>
            {STYLES.map((item) => (
              <Choice key={item.id} active={item.id === style} onSelect={() => setStyle(item.id)} title={item.description}>
                {item.name}
              </Choice>
            ))}
          </Submenu>

          <Submenu
            label={ui.labels.palette}
            current={ui.labels.paletteNames[palette]}
            swatch={swatch(PALETTE_SWATCHES[palette], "h-4 w-4")}
          >
            {PALETTES.map((id) => (
              <Choice key={id} active={id === palette} onSelect={() => setPalette(id)} swatch={swatch(PALETTE_SWATCHES[id], "h-3.5 w-3.5")}>
                {ui.labels.paletteNames[id]}
              </Choice>
            ))}
          </Submenu>

          <section className="border-t border-border pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className={title}>{ui.labels.motionTitle}</p>
              <span className="font-mono text-xs capitalize text-accent">{levelName(motion)}</span>
            </div>
            <div className="mt-3">
              <MotionSlider stops={STOPS} value={motion} onChange={setMotion} label={ui.labels.motionTitle} levelName={levelName} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
