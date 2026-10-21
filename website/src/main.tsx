import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { preloadSections } from "@/app/sections";
import { loadContent } from "@/content";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { resolveInitialLocale } from "@/i18n/locale";
import { ThemeProvider } from "@/theme/ThemeProvider";

import { installBorderGlitch } from "@/hooks/borderGlitch";
import { glitchScreen } from "@/hooks/glitch";
import { installMagnetic } from "@/hooks/magnetic";
// Fonts are served from the site itself (no Google round trip); swap shows text at once in a fallback.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/onest/600.css";
import "@fontsource/onest/700.css";
import "@fontsource/onest/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/400-italic.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
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
        <LocaleProvider initialLocale={initialLocale} initialContent={initialContent}>
          <App />
        </LocaleProvider>
      </ThemeProvider>
    </StrictMode>,
  );
  // The page boots with a glitch: one flash as the hero lines cut in.
  window.setTimeout(glitchScreen, 250);
  // Fetch the rest of the page once the first screen has painted.
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
  idle(() => void preloadSections().catch(() => null));
});
