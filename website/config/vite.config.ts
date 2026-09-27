import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works whether it's served from a GitHub
  // Pages project site (username.github.io/repo-name/) or a user/org
  // root site (username.github.io/).
  base: "./",
  plugins: [react()],
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
