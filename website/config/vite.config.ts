import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { localizedHtml } from "./localized-html.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  // Absolute base: localized pages live at /az/ and /ru/, so a relative
  // "./assets/..." would resolve to /az/assets/... and 404. The site is a
  // user/org root site (username.github.io), which also matches the absolute
  // "/favicon.svg" and "/resume.pdf" references already in use.
  base: "/",
  plugins: [react(), localizedHtml()],
  server: {
    port: 1337,
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "../src"),
    },
  },
  css: {
    // postcss.config.js lives alongside this file in config/, not at the
    // project root, so point Vite at it explicitly.
    postcss: path.resolve(dirname, "./postcss.config.js"),
  },
});
