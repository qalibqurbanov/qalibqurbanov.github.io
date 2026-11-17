import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { preloadDialogs, preloadSections } from "@/app/sections";
import { loadContent } from "@/content";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { resolveInitialLocale } from "@/i18n/locale";
import { parseViewPath } from "@/lib/viewPath";
import { ThemeProvider } from "@/theme/ThemeProvider";

// Fonts are served from the site itself (no Google round trip); swap shows text at once in a fallback.
// Only the scripts the site is written in are bundled: latin, latin-ext (Azerbaijani) and cyrillic (Russian).
import "@fontsource/exo-2/latin-500.css";
import "@fontsource/exo-2/latin-600.css";
import "@fontsource/exo-2/latin-700.css";
import "@fontsource/exo-2/latin-ext-500.css";
import "@fontsource/exo-2/latin-ext-600.css";
import "@fontsource/exo-2/latin-ext-700.css";
import "@fontsource/exo-2/cyrillic-500.css";
import "@fontsource/exo-2/cyrillic-600.css";
import "@fontsource/exo-2/cyrillic-700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/cyrillic-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/cyrillic-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/cyrillic-600.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-ext-400.css";
import "@fontsource/jetbrains-mono/cyrillic-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-ext-500.css";
import "@fontsource/jetbrains-mono/cyrillic-500.css";
import "@/styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

// Load the active language's chunk before the first render so the page never
// paints empty or in the wrong language.
const initialLocale = resolveInitialLocale();
// A link into the page (a section or a project) also waits for the section chunks, so its target exists.
// The 404 page has none of the sections, so it loads none of them.
const ready = Promise.all([loadContent(initialLocale), window.location.hash || parseViewPath(window.location.pathname) ? preloadSections().catch(() => null) : null]);
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
  // Fetch the rest of the page once the first screen has painted.
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
  idle(() => void preloadSections().then(preloadDialogs).catch(() => null));
});
