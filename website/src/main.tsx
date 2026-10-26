import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { preloadDialogs, preloadSections } from "@/app/sections";
import { loadContent } from "@/content";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { resolveInitialLocale } from "@/i18n/locale";
import { MotionProvider } from "@/motion/MotionProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

import { installBorderGlitch } from "@/hooks/borderGlitch";
import { glitchScreen } from "@/hooks/glitch";
import { installMagnetic } from "@/hooks/magnetic";
// Fonts are served from the site itself (no Google round trip); swap shows text at once in a fallback.
// Only the scripts the site is written in are bundled: latin, latin-ext (Azerbaijani) and cyrillic (Russian).
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/cyrillic-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/cyrillic-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/cyrillic-600.css";
import "@fontsource/onest/latin-600.css";
import "@fontsource/onest/latin-ext-600.css";
import "@fontsource/onest/cyrillic-600.css";
import "@fontsource/onest/latin-700.css";
import "@fontsource/onest/latin-ext-700.css";
import "@fontsource/onest/cyrillic-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-ext-400.css";
import "@fontsource/jetbrains-mono/cyrillic-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-ext-500.css";
import "@fontsource/jetbrains-mono/cyrillic-500.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "@fontsource/jetbrains-mono/latin-ext-700.css";
import "@fontsource/jetbrains-mono/cyrillic-700.css";
import "@fontsource/jetbrains-mono/latin-400-italic.css";
import "@fontsource/jetbrains-mono/latin-ext-400-italic.css";
import "@fontsource/jetbrains-mono/cyrillic-400-italic.css";
import "@/styles/index.css";

installBorderGlitch();
installMagnetic();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

// Load the active language's chunk before the first render so the page never
// paints empty or in the wrong language.
const initialLocale = resolveInitialLocale();
// A link into the page (a section or a project) also waits for the section chunks, so its target exists.
const ready = Promise.all([loadContent(initialLocale), window.location.hash ? preloadSections().catch(() => null) : null]);
void ready.then(([initialContent]) => {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <MotionProvider>
          <LocaleProvider initialLocale={initialLocale} initialContent={initialContent}>
            <App />
          </LocaleProvider>
        </MotionProvider>
      </ThemeProvider>
    </StrictMode>,
  );
  // The page boots with a glitch: one flash across the screen.
  window.setTimeout(glitchScreen, 250);
  // Fetch the rest of the page once the first screen has painted.
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
  idle(() => void preloadSections().then(preloadDialogs).catch(() => null));
});
