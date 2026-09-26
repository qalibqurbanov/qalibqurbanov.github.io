import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";

import { useContent } from "@/i18n/context";
import { useScrolledPast } from "@/hooks/useScrollPosition";
import { useTheme } from "@/hooks/useTheme";

import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolledPast();
  const { theme, toggleTheme } = useTheme();
  const { profile, navigation, ui } = useContent();

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/75 backdrop-blur-md border-b border-border shadow-lg shadow-black/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <a href="#top" className="font-mono text-sm text-text tracking-tight">
          <span className="text-accent">&gt;</span> {profile.avatarInitials}
        </a>

        <ul className="hidden md:flex items-center gap-8 font-mono text-sm text-muted">
          {navigation.map((item, index) => (
            <li key={item.href}>
              <a href={item.href} className="group relative py-1 hover:text-accent transition-colors">
                <span className="text-accent/70 mr-0.5">{String(index + 1).padStart(2, "0")}.</span>
                {item.label}
                <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          <button
            type="button"
            className="text-muted hover:text-accent transition-colors"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Toggle theme (Ctrl+Shift+L)`}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <button
            type="button"
            className="md:hidden text-text"
            onClick={() => setOpen((value) => !value)}
            aria-label={ui.nav.toggleMenu}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
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
