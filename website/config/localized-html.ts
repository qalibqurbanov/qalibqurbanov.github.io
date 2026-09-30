import fs from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

// The site is a client-rendered SPA, but each language still needs its own
// real HTML file at its own URL so crawlers and link previews see the right
// <html lang>, title, description and hreflang alternates without running JS.
// After the build this writes dist/<locale>/index.html for every
// locale, /en/ included), plus sitemap.xml and robots.txt. The root dist/index.html
// is the x-default landing page: an English copy (canonical -> /en/) whose
// script redirects visitors to their preferred language.
//
// Kept self-contained (no imports from src/) because it runs in Node at
// build time. When adding a locale, add it here and in src/i18n/locale.ts.

const SITE_URL = "https://qalibqurbanov.github.io";

interface LocalePage {
  code: string;
  /** Path the locale is served from. */
  path: string;
  ogLocale: string;
  title: string;
  description: string;
}

const PAGES: LocalePage[] = [
  {
    code: "en",
    path: "/en/",
    ogLocale: "en_US",
    title: "Galib Gurbanov | Software Developer",
    description:
      "Galib Gurbanov — Full Stack, Backend, Frontend & Mobile Developer. Portfolio, projects, and experience.",
  },
  {
    code: "az",
    path: "/az/",
    ogLocale: "az_AZ",
    title: "Qalib Qurbanov | Proqram təminatı tərtibatçısı",
    description:
      "Qalib Qurbanov — Full Stack, Backend, Frontend və Mobil tərtibatçı. Portfolio, layihələr və təcrübə.",
  },
  {
    code: "ru",
    path: "/ru/",
    ogLocale: "ru_RU",
    title: "Галиб Гурбанов | Разработчик программного обеспечения",
    description:
      "Галиб Гурбанов — Full Stack, Backend, Frontend и мобильный разработчик. Портфолио, проекты и опыт.",
  },
];

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function localize(template: string, page: LocalePage): string {
  const url = SITE_URL + page.path;
  const alternates = PAGES.map(
    (p) => `    <link rel="alternate" hreflang="${p.code}" href="${SITE_URL + p.path}" />`,
  );
  alternates.push(`    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />`);

  const head = [
    `    <link rel="canonical" href="${url}" />`,
    ...alternates,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:url" content="${url}" />`,
    `    <meta property="og:title" content="${escapeAttr(page.title)}" />`,
    `    <meta property="og:description" content="${escapeAttr(page.description)}" />`,
    `    <meta property="og:locale" content="${page.ogLocale}" />`,
    ...PAGES.filter((p) => p !== page).map(
      (p) => `    <meta property="og:locale:alternate" content="${p.ogLocale}" />`,
    ),
  ].join("\n");

  return template
    .replace(/<html lang="[^"]*"/, `<html lang="${page.code}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeAttr(page.description)}" />`,
    )
    .replace("</head>", `${head}\n  </head>`);
}

export function localizedHtml(): Plugin {
  let outDir = "dist";

  return {
    name: "localized-html",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const template = fs.readFileSync(path.join(outDir, "index.html"), "utf-8");

      const english = PAGES.find((page) => page.code === "en");
      if (english) fs.writeFileSync(path.join(outDir, "index.html"), localize(template, english));

      for (const page of PAGES) {
        const target = path.join(outDir, page.path, "index.html");
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, localize(template, page));
      }

      const urls = PAGES.map((page) => {
        const links = [...PAGES, { code: "x-default", path: "/" }]
          .map(
            (p) =>
              `      <xhtml:link rel="alternate" hreflang="${p.code}" href="${SITE_URL + p.path}" />`,
          )
          .join("\n");
        return `  <url>\n    <loc>${SITE_URL + page.path}</loc>\n${links}\n  </url>`;
      }).join("\n");
      fs.writeFileSync(
        path.join(outDir, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
      );
      fs.writeFileSync(
        path.join(outDir, "robots.txt"),
        `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      );
    },
  };
}
