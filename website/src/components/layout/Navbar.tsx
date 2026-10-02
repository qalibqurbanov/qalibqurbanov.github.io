import { ArrowLeft, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";

import { CommandPaletteTrigger } from "@/components/command-palette/CommandPalette";
import { GlitchText } from "@/components/ui/GlitchText";
import { Knockable } from "@/components/ui/Knockable";
import { useViewBar } from "@/components/ui/viewBar";
import { useContent } from "@/i18n/context";
import { format } from "@/lib/format";
import { useScrolledPast, useScrollProgress } from "@/hooks/useScrollPosition";
import { scrollToTop } from "@/lib/scroll";
import { useTheme } from "@/theme/context";

import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolledPast();
  const progress = useScrollProgress();
  const { theme, toggleTheme } = useTheme();
  const { profile, navigation, ui } = useContent();
  const viewBar = useViewBar();
  const inView = viewBar !== null;
  // While a view is open the navbar morphs into its back-bar: the logo swaps
  // for the back button and the rest of the menu fades out, in place.
  const FADE = "transition-all duration-300 ease-out";
  const hideInView = inView
    ? "opacity-0 -translate-y-1 pointer-events-none"
    : "";

  return (
    <header
      className={`fixed top-0 inset-x-0 ${inView ? "z-[70]" : "z-50"} transition-all duration-300 ${
        scrolled || inView
          ? "bg-bg/75 backdrop-blur-md border-b border-border shadow-lg shadow-black/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="h-[2px] w-full bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="relative">
          <Knockable
            seed={0}
            className={`inline-flex items-center ${FADE} ${inView ? "opacity-0 -translate-x-3 pointer-events-none" : ""}`}
          >
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
                scrollToTop();
              }}
              className="font-mono text-sm text-text tracking-tight inline-flex items-center gap-2.5"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-accent">&gt;</span>{" "}
              <GlitchText text={profile.name} />
            </a>
          </Knockable>
          <button
            type="button"
            onClick={viewBar?.onBack}
            tabIndex={inView ? 0 : -1}
            aria-hidden={!inView}
            className={`absolute left-0 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center gap-2 whitespace-nowrap font-mono text-sm text-muted hover:text-accent ${FADE} ${inView ? "pointer-events-auto opacity-100 translate-x-0" : "pointer-events-none opacity-0 translate-x-3"}`}
          >
            <ArrowLeft size={16} />
            {viewBar?.label}
          </button>
        </div>

        <ul
          className={`hidden md:flex items-center gap-8 font-mono text-sm text-muted ${FADE} ${hideInView}`}
        >
          {navigation.map((item, index) => (
            <li key={item.href}>
              <Knockable seed={index + 1} className="inline-flex items-center">
                <a
                  href={item.href}
                  className="group relative py-1 hover:text-accent transition-colors"
                >
                  <span className="text-accent/70 mr-0.5">
                    {String(index + 1).padStart(2, "0")}.
                  </span>
                  <GlitchText text={item.label} />
                  <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                </a>
              </Knockable>
            </li>
          ))}
        </ul>

        <div className={`flex items-center gap-4 ${FADE} ${hideInView}`}>
          <Knockable seed={90} className="inline-flex items-center">
            <CommandPaletteTrigger label={ui.nav.commandPaletteHint} />
          </Knockable>

          <Knockable seed={91} className="hidden md:inline-flex items-center">
            <LanguageSwitcher />
          </Knockable>

          <Knockable seed={92} className="inline-flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center text-muted hover:text-accent transition-colors"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? ui.labels.switchToLight
                  : ui.labels.switchToDark
              }
              title={format(ui.labels.toggleTheme, {
                shortcut: "Ctrl+Shift+L",
              })}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </Knockable>

          <Knockable seed={93} className="md:hidden inline-flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center text-text"
              onClick={() => setOpen((value) => !value)}
              aria-label={ui.nav.toggleMenu}
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </Knockable>
        </div>
      </nav>

      {open && (
        <div className="md:hidden flex flex-col gap-4 px-6 pb-4 bg-bg/95 border-b border-border">
          <ul className="flex flex-col gap-1 font-mono text-sm text-muted">
            {navigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-2 hover:text-accent transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <LanguageSwitcher />
        </div>
      )}
    </header>
  );
}
