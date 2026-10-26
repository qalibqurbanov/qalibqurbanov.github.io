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
  /** Name and job title as written in this language, for the structured data. */
  name: string;
  jobTitle: string;
  /** Where the person is based and a short intro, for the plain-text copy of the page. */
  location: string;
  summary: string;
  /** Label for the resume link in the plain-text copy. */
  resumeLabel: string;
  title: string;
  description: string;
}

const PAGES: LocalePage[] = [
  {
    code: "en",
    path: "/en/",
    ogLocale: "en_US",
    name: "Galib Gurbanov",
    jobTitle: "Software Developer",
    location: "Baku, Azerbaijan",
    summary:
      "I build software end-to-end — from backend APIs and databases to polished web frontends and mobile apps. I like turning ideas into fast, reliable, well-designed products.",
    resumeLabel: "Resume (PDF)",
    title: "Galib Gurbanov | Software Developer",
    description:
      "Galib Gurbanov — Full Stack, Backend, Frontend & Mobile Developer. Portfolio, projects, and experience.",
  },
  {
    code: "az",
    path: "/az/",
    ogLocale: "az_AZ",
    name: "Qalib Qurbanov",
    jobTitle: "Proqram təminatı tərtibatçısı",
    location: "Bakı, Azərbaycan",
    summary:
      "Mən proqram təminatını başdan sona hazırlayıram — backend API-lardan və verilənlər bazalarından tutmuş, zərif veb interfeyslərə və mobil tətbiqlərə qədər. Fikirləri sürətli, etibarlı və yaxşı dizayn edilmiş məhsullara çevirməyi sevirəm.",
    resumeLabel: "CV (PDF)",
    title: "Qalib Qurbanov | Proqram təminatı tərtibatçısı",
    description:
      "Qalib Qurbanov — Full Stack, Backend, Frontend və Mobil tərtibatçı. Portfolio, layihələr və təcrübə.",
  },
  {
    code: "ru",
    path: "/ru/",
    ogLocale: "ru_RU",
    name: "Галиб Гурбанов",
    jobTitle: "Разработчик программного обеспечения",
    location: "Баку, Азербайджан",
    summary:
      "Я разрабатываю программное обеспечение полного цикла — от backend API и баз данных до отточенных веб-интерфейсов и мобильных приложений. Мне нравится превращать идеи в быстрые, надёжные и хорошо продуманные продукты.",
    resumeLabel: "Резюме (PDF)",
    title: "Галиб Гурбанов | Разработчик программного обеспечения",
    description:
      "Галиб Гурбанов — Full Stack, Backend, Frontend и мобильный разработчик. Портфолио, проекты и опыт.",
  },
];

// Where else the person can be found; search engines use these to connect the profiles to one identity.
const SAME_AS = [
  "https://github.com/qalibqurbanov",
  "https://www.linkedin.com/in/qalibqurbanov/",
  "https://stackoverflow.com/users/13249741/qalibqurbanov",
  "https://medium.com/@qalibqurbanov",
];

const PROFILE_LINKS: Array<[label: string, url: string]> = [
  ["GitHub", "https://github.com/qalibqurbanov"],
  ["LinkedIn", "https://www.linkedin.com/in/qalibqurbanov/"],
  ["Stack Overflow", "https://stackoverflow.com/users/13249741/qalibqurbanov"],
  ["Medium", "https://medium.com/@qalibqurbanov"],
];

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** The few font files the first screen needs, per language, so they start downloading with the HTML
 * instead of waiting for the CSS and the script. Names are matched in the build's hashed assets. */
const FIRST_SCREEN_FONTS: Record<string, string[]> = {
  en: ["onest-latin-700", "inter-latin-400", "jetbrains-mono-latin-400"],
  az: ["onest-latin-700", "inter-latin-400", "jetbrains-mono-latin-400"],
  ru: ["onest-cyrillic-700", "inter-cyrillic-400", "jetbrains-mono-cyrillic-400", "jetbrains-mono-latin-400"],
};

function fontPreloads(assets: string[], code: string): string[] {
  return (FIRST_SCREEN_FONTS[code] ?? []).flatMap((name) => {
    const file = assets.find((asset) => asset.startsWith(`${name}-normal-`) && asset.endsWith(".woff2"));
    return file ? [`    <link rel="preload" as="font" type="font/woff2" href="/assets/${file}" crossorigin />`] : [];
  });
}

function localize(template: string, page: LocalePage, assets: string[]): string {
  const url = SITE_URL + page.path;
  const alternates = PAGES.map(
    (p) => `    <link rel="alternate" hreflang="${p.code}" href="${SITE_URL + p.path}" />`,
  );
  alternates.push(`    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />`);

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: page.name,
    jobTitle: page.jobTitle,
    url,
    address: { "@type": "PostalAddress", addressLocality: "Baku", addressCountry: "AZ" },
    sameAs: SAME_AS,
  };
  // "<" is escaped so no value can ever close the script tag early.
  const structuredData = `    <script type="application/ld+json">${JSON.stringify(person).replace(/</g, "\u003c")}</script>`;

  const head = [
    ...fontPreloads(assets, page.code),
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
    structuredData,
  ].join("\n");

  // The page itself is drawn by JavaScript, so a program that only reads the raw HTML (some
  // recruiter and job-site tools, link scanners, text-only browsers) would otherwise find it
  // empty. This short copy gives it the essentials; visitors with JavaScript never see it.
  const plainText = [
    "    <noscript>",
    `      <h1>${page.name} — ${page.jobTitle}</h1>`,
    `      <p>${page.location}</p>`,
    `      <p>${page.summary}</p>`,
    "      <ul>",
    `        <li><a href="${SITE_URL}/resume.pdf">${page.resumeLabel}</a></li>`,
    ...PROFILE_LINKS.map(([label, href]) => `        <li><a href="${href}">${label}</a></li>`),
    "      </ul>",
    "    </noscript>",
  ].join("\n");

  return template
    .replace(/<html lang="[^"]*"/, `<html lang="${page.code}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeAttr(page.description)}" />`,
    )
    .replace("</head>", `${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"></div>\n${plainText}`);
}

/** The 404 page: the same page as the rest of the site, marked so the app shows its not-found view
 * (see src/lib/notFound.ts). GitHub Pages serves it, with a 404 status, for every address that does
 * not exist, at any depth, so it only uses absolute paths. It stays out of search results. */
export function notFoundHtml(template: string): string {
  const message = "<noscript><h1>404 | Page not found</h1><p><a href=\"/en/\">Home</a></p></noscript>";
  return template
    .replace(/<html lang="[^"]*"/, '<html lang="en" data-page="not-found"')
    .replace(/<title>[^<]*<\/title>/, "<title>404 | Page not found</title>")
    .replace(/<meta name="description" content="[^"]*" \/>\s*/, "")
    .replace("</head>", '    <meta name="robots" content="noindex" />\n  </head>')
    .replace('<div id="root"></div>', `<div id="root"></div>\n    ${message}`);
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
      const assets = fs.existsSync(path.join(outDir, "assets")) ? fs.readdirSync(path.join(outDir, "assets")) : [];

      fs.writeFileSync(path.join(outDir, "404.html"), notFoundHtml(template));

      const english = PAGES.find((page) => page.code === "en");
      if (english) fs.writeFileSync(path.join(outDir, "index.html"), localize(template, english, assets));

      for (const page of PAGES) {
        const target = path.join(outDir, page.path, "index.html");
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, localize(template, page, assets));
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
