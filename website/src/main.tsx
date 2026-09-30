import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { loadContent } from "@/content";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { resolveInitialLocale } from "@/i18n/locale";
import { ThemeProvider } from "@/theme/ThemeProvider";

import "@/styles/index.css";

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
});
