import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { localizedHtml } from "./localized-html.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

function git(...args: string[]): string | null {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null;
  } catch {
    return null;
  }
}

// What the footer shows: the branch and commit this build was made from. On
// GitHub Actions those come from the environment (the deployed branch, not
// whatever the checkout calls it); locally they come from git itself. Null
// when neither is available (e.g. a build from an unpacked archive).
const buildInfo = {
  branch: process.env.GITHUB_REF_NAME ?? git("rev-parse", "--abbrev-ref", "HEAD"),
  sha: process.env.GITHUB_SHA ?? git("rev-parse", "HEAD"),
  date: git("log", "-1", "--format=%cI"),
  message: git("log", "-1", "--format=%s"),
};

// https://vite.dev/config/
export default defineConfig({
  // Absolute base: localized pages live at /az/ and /ru/, so a relative
  // "./assets/..." would resolve to /az/assets/... and 404. The site is a
  // user/org root site (username.github.io), which also matches the absolute
  // "/favicon.svg" and "/resume.pdf" references already in use.
  base: "/",
  plugins: [react(), localizedHtml()],
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo),
  },
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
