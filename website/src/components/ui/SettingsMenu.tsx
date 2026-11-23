import { Moon, Settings, Sun } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Panel } from "@/components/ui/Panel";
import { Segmented } from "@/components/ui/Segmented";
import { useContent, useLocale } from "@/i18n/context";
import { SUPPORTED_LOCALES } from "@/i18n/locale";
import { useTheme } from "@/theme/context";

const MENU_WIDTH = 272;
const EDGE = 8;
const GAP = 12;

/** The settings button: a small glass card (the same one the dialogs use) with the light/dark switch and the language. The popup is drawn on the page
 * itself, at fixed coordinates under the button and above everything else (the menu column, the bars, the dialogs),
 * instead of inside whatever the button sits in, so nothing can cover it. */
export function SettingsMenu({ up = false }: { up?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const { ui } = useContent();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ left: number; top?: number; bottom?: number } | null>(null);

  // Where the popup goes: under the button (or over it, in the menu column), kept inside the window.
  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const box = rootRef.current?.getBoundingClientRect();
      if (!box) return;
      const left = Math.max(EDGE, Math.min(up ? box.left : box.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - EDGE));
      setPlace(up ? { left, bottom: window.innerHeight - box.top + GAP } : { left, top: box.bottom + GAP });
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, up]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
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

  const modes = [
    { id: "dark", Icon: Moon, name: ui.labels.modeDark },
    { id: "light", Icon: Sun, name: ui.labels.modeLight },
  ] as const;

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        className={`inline-flex cursor-pointer items-center justify-center text-muted transition-colors hover:text-accent ${up ? "h-7 w-7" : "h-10 w-10"}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={ui.labels.settings}
        aria-haspopup="true"
        aria-expanded={open}
        title={open ? undefined : ui.labels.settings}
      >
        <Settings size={up ? 15 : 19} />
      </button>

      {open &&
        place &&
        createPortal(
        <div
          ref={menuRef}
          role="group"
          aria-label={ui.labels.settings}
          style={{ left: place.left, top: place.top, bottom: place.bottom, width: MENU_WIDTH }}
          className="fixed z-[100001]"
        >
          <Panel title={ui.labels.settings} glass icon={<Settings size={14} />} onClose={() => setOpen(false)} className="shadow-2xl shadow-black/40">
            <div className="flex flex-col gap-3 p-3">
              <section>
                <h3 className="label mb-1.5">
                  <span className="mr-2 text-[0.8125rem] text-accent-2" aria-hidden="true">
                    ✦
                  </span>
                  {ui.labels.appearance}
                </h3>
                <Segmented
                  label={ui.labels.appearance}
                  value={theme}
                  onChange={() => toggleTheme()}
                  options={modes.map(({ id, Icon, name }) => ({
                    id,
                    label: (
                      <>
                        <Icon size={13} aria-hidden="true" />
                        {name}
                      </>
                    ),
                  }))}
                />
              </section>

              <section>
                <h3 className="label mb-1.5">
                  <span className="mr-2 text-[0.8125rem] text-accent-2" aria-hidden="true">
                    ✦
                  </span>
                  {ui.labels.language}
                </h3>
                <Segmented
                  label={ui.labels.language}
                  value={locale}
                  onChange={setLocale}
                  options={SUPPORTED_LOCALES.map((meta) => ({ id: meta.code, label: meta.nativeLabel, lang: meta.code }))}
                />
              </section>
            </div>
          </Panel>
        </div>,
        document.body,
      )}
    </div>
  );
}
