import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { loadContent } from "@/content";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { resolveInitialLocale } from "@/i18n/locale";
import { ThemeProvider } from "@/theme/ThemeProvider";

import { installBorderGlitch } from "@/hooks/borderGlitch";
import { glitchScreen } from "@/hooks/glitch";
import { installMagnetic } from "@/hooks/magnetic";
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
void loadContent(initialLocale).then((initialContent) => {
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
});
