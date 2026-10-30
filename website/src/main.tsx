import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { preloadDialogs, preloadSections } from "@/app/sections";
import { loadContent } from "@/content";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { resolveInitialLocale } from "@/i18n/locale";
import { isNotFoundPage } from "@/lib/notFound";
import { MotionProvider } from "@/motion/MotionProvider";
import { playThemeIntro } from "@/themes/shared/intro";
import { StyleProvider } from "@/themes/shared/style/StyleProvider";
import { ThemeProvider } from "@/themes/shared/colour/ThemeProvider";

import { installBorderGlitch } from "@/hooks/borderGlitch";
import { glitchScreen } from "@/hooks/glitch";
import { installMagnetic } from "@/hooks/magnetic";
import { installThemeHover } from "@/hooks/themeHover";
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
// Fonts of the other styles: each style has its own display, text and label faces. The browser fetches a
// file only when its style is used.
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-ext-400.css";
import "@fontsource/ibm-plex-mono/cyrillic-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-ext-500.css";
import "@fontsource/ibm-plex-mono/cyrillic-500.css";
import "@fontsource/ibm-plex-mono/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-ext-700.css";
import "@fontsource/ibm-plex-mono/cyrillic-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-ext-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-ext-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-ext-600.css";
import "@fontsource/share-tech-mono/latin-400.css";
import "@fontsource/rajdhani/latin-500.css";
import "@fontsource/rajdhani/latin-ext-500.css";
import "@fontsource/rajdhani/latin-600.css";
import "@fontsource/rajdhani/latin-ext-600.css";
import "@fontsource/rajdhani/latin-700.css";
import "@fontsource/rajdhani/latin-ext-700.css";
import "@fontsource/martian-mono/latin-400.css";
import "@fontsource/martian-mono/latin-ext-400.css";
import "@fontsource/martian-mono/cyrillic-400.css";
import "@fontsource/martian-mono/latin-500.css";
import "@fontsource/martian-mono/latin-ext-500.css";
import "@fontsource/martian-mono/cyrillic-500.css";
import "@fontsource/martian-mono/latin-700.css";
import "@fontsource/martian-mono/latin-ext-700.css";
import "@fontsource/martian-mono/cyrillic-700.css";
import "@fontsource/inter-tight/latin-400.css";
import "@fontsource/inter-tight/latin-ext-400.css";
import "@fontsource/inter-tight/cyrillic-400.css";
import "@fontsource/inter-tight/latin-500.css";
import "@fontsource/inter-tight/latin-ext-500.css";
import "@fontsource/inter-tight/cyrillic-500.css";
import "@fontsource/inter-tight/latin-600.css";
import "@fontsource/inter-tight/latin-ext-600.css";
import "@fontsource/inter-tight/cyrillic-600.css";
import "@fontsource/syncopate/latin-700.css";
import "@fontsource/syncopate/latin-ext-700.css";
import "@fontsource/archivo/latin-400.css";
import "@fontsource/archivo/latin-ext-400.css";
import "@fontsource/archivo/latin-500.css";
import "@fontsource/archivo/latin-ext-500.css";
import "@fontsource/archivo/latin-600.css";
import "@fontsource/archivo/latin-ext-600.css";
import "@fontsource/orbitron/latin-700.css";
import "@fontsource/orbitron/latin-900.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-ext-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource/instrument-serif/latin-ext-400-italic.css";
import "@fontsource/major-mono-display/latin-400.css";
import "@fontsource/major-mono-display/latin-ext-400.css";
import "@/styles/index.css";

installBorderGlitch();
installMagnetic();
installThemeHover();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

// Load the active language's chunk before the first render so the page never
// paints empty or in the wrong language.
const initialLocale = resolveInitialLocale();
// A link into the page (a section or a project) also waits for the section chunks, so its target exists.
// The 404 page has none of the sections, so it loads none of them.
const notFound = isNotFoundPage();
const ready = Promise.all([loadContent(initialLocale), window.location.hash && !notFound ? preloadSections().catch(() => null) : null]);
void ready.then(([initialContent]) => {
  // A style with its own opening covers the page before it renders, and plays it.
  const themed = playThemeIntro(document.documentElement.getAttribute("data-style"));
  createRoot(rootElement).render(
    <StrictMode>
      <StyleProvider>
      <ThemeProvider>
        <MotionProvider>
          <LocaleProvider initialLocale={initialLocale} initialContent={initialContent}>
            <App />
          </LocaleProvider>
        </MotionProvider>
      </ThemeProvider>
      </StyleProvider>
    </StrictMode>,
  );
  // The page boots with a glitch: one flash across the screen.
  if (!themed) window.setTimeout(glitchScreen, 250);
  // Fetch the rest of the page once the first screen has painted.
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
  if (!notFound) idle(() => void preloadSections().then(preloadDialogs).catch(() => null));
});
