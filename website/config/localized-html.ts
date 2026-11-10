import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

import { externalLinks, siteLinks } from "../src/features/pages-without-language/links/shortLinks.ts";
import { loadContents, renderContent } from "./prerender.ts";

// The site is a client-rendered SPA, but each language still needs its own
// real HTML file at its own URL so crawlers and link previews see the right
// <html lang>, title, description and hreflang alternates without running JS.
// After the build this writes dist/<locale>/index.html for every
// locale, /en/ included), plus sitemap.xml and robots.txt. The root dist/index.html
// is the x-default landing page: an English copy (canonical -> /en/) whose
// script redirects visitors to their preferred language.
//
// Kept self-contained because it runs in Node at build time: the one import from src/ is the
// short addresses, a plain data file with no imports of its own. When adding a locale, add it here and in src/i18n/locale.ts.

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

// The same person is spelled differently in each language (and the handle is "qalibqurbanov"), so people
// searching for any of these spellings can still land here. Listed as alternate names in the structured data.
const NAME_VARIANTS = ["Qalib Qurbanov", "Galib Gurbanov", "Qalib Qurbanow", "Галиб Гурбанов"];

// What the person works with, for the structured data's knowsAbout and the plain-text copy of the page.
// Tech names are proper nouns and stay the same in every language.
const SKILLS = [
  "C#", ".NET", "ASP.NET Core", "ASP.NET Web API", "REST API", "EF Core", "Dapper", "PostgreSQL", "Microsoft SQL Server",
  "Redis", "RabbitMQ", "SignalR", "Docker", "Linux", "Nginx", "Git", "GitHub Actions", "GitLab CI/CD", "CQRS",
  "Domain-Driven Design", "Clean Architecture", "React", "TypeScript",
];

const PROJECTS: Array<[name: string, url: string]> = [
  ["SoundCloud Artwork Downloader", "https://github.com/qalibqurbanov/SoundcloudArtworkDownloader"],
  ["Imager", "https://github.com/qalibqurbanov/Imager"],
];

const SITE_NAME = "Qalib Qurbanov — Portfolio";

/** The date of the newest commit (what the sitemap calls "last modified"), so it only moves when the site does
 * and not on every hourly rebuild. Falls back to today when git is not available. */
function lastModified(): string {
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cs"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (/^d{4}-d{2}-d{2}$/.test(date)) return date;
  } catch {
    // Not a git checkout.
  }
  return new Date().toISOString().slice(0, 10);
}

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** The picture link previews show (public/og/<language>.jpg, 1200x630, with the name and title in that language),
 * and the card type that asks the big-image layout on X/Twitter. */
function previewTags(code: string, alt: string, title: string, description: string): string[] {
  const image = `${SITE_URL}/og/${code}.jpg`;
  return [
    `    <meta property="og:image" content="${image}" />`,
    `    <meta property="og:image:type" content="image/jpeg" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta property="og:image:alt" content="${escapeAttr(alt)}" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `    <meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `    <meta name="twitter:image" content="${image}" />`,
    `    <meta name="twitter:image:alt" content="${escapeAttr(alt)}" />`,
  ];
}

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

function localize(template: string, page: LocalePage, assets: string[], modified: string, body: string): string {
  const url = SITE_URL + page.path;
  const alternates = PAGES.map(
    (p) => `    <link rel="alternate" hreflang="${p.code}" href="${SITE_URL + p.path}" />`,
  );
  alternates.push(`    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />`);

  const personId = `${SITE_URL}/#person`;
  const websiteId = `${SITE_URL}/#website`;
  const graph = [
    {
      "@type": "Person",
      "@id": personId,
      name: page.name,
      alternateName: [...new Set(NAME_VARIANTS.filter((n) => n !== page.name))],
      givenName: page.name.split(" ")[0],
      familyName: page.name.split(" ")[1],
      jobTitle: page.jobTitle,
      description: page.description,
      url,
      image: `${SITE_URL}/og/${page.code}.jpg`,
      homeLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Baku", addressCountry: "AZ" } },
      address: { "@type": "PostalAddress", addressLocality: "Baku", addressCountry: "AZ" },
      worksFor: { "@type": "Organization", name: "Crocusoft", url: "https://crocusoft.com" },
      knowsAbout: SKILLS,
      knowsLanguage: PAGES.map((p) => p.code),
      sameAs: SAME_AS,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: SITE_URL + "/",
      name: SITE_NAME,
      inLanguage: PAGES.map((p) => p.code),
      publisher: { "@id": personId },
    },
    {
      "@type": "ProfilePage",
      "@id": `${url}#profilepage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: page.code,
      isPartOf: { "@id": websiteId },
      mainEntity: { "@id": personId },
      primaryImageOfPage: { "@type": "ImageObject", url: `${SITE_URL}/og/${page.code}.jpg`, width: 1200, height: 630 },
      dateModified: modified,
    },
    ...PROJECTS.map(([name, projectUrl]) => ({
      "@type": "SoftwareSourceCode",
      name,
      codeRepository: projectUrl,
      author: { "@id": personId },
    })),
  ];
  // "<" is escaped so no value can ever close the script tag early.
  const structuredData = `    <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`;

  const head = [
    ...fontPreloads(assets, page.code),
    `    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
    `    <meta name="author" content="${escapeAttr(page.name)}" />`,
    `    <link rel="canonical" href="${url}" />`,
    ...alternates,
    `    <meta property="og:type" content="profile" />`,
    `    <meta property="og:site_name" content="${SITE_NAME}" />`,
    `    <meta property="profile:first_name" content="${escapeAttr(page.name.split(" ")[0])}" />`,
    `    <meta property="profile:last_name" content="${escapeAttr(page.name.split(" ")[1])}" />`,
    `    <meta property="profile:username" content="qalibqurbanov" />`,
    `    <meta property="og:url" content="${url}" />`,
    `    <meta property="og:title" content="${escapeAttr(page.title)}" />`,
    `    <meta property="og:description" content="${escapeAttr(page.description)}" />`,
    `    <meta property="og:locale" content="${page.ogLocale}" />`,
    ...previewTags(page.code, `${page.name} — ${page.jobTitle}`, page.title, page.description),
    ...PAGES.filter((p) => p !== page).map(
      (p) => `    <meta property="og:locale:alternate" content="${p.ogLocale}" />`,
    ),
    structuredData,
  ].join("\n");

  // The page itself is drawn by JavaScript, so a program that only reads the raw HTML (search and AI
  // crawlers, link scanners, text-only browsers) would otherwise find it empty. The real text of the
  // page goes inside the root, kept off screen; the site replaces it the moment it starts. Without
  // JavaScript the noscript style shows it as an ordinary page.
  const hidden = "position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
  const prerenderStyle = [
    `    <style>[data-prerender]{${hidden}}</style>`,
    `    <noscript><style>[data-prerender]{position:static;width:auto;height:auto;margin:1rem;overflow:visible;clip:auto;white-space:normal;color:#ddd;font:16px/1.6 system-ui,sans-serif}[data-prerender] a{color:#b185ff}</style></noscript>`,
  ].join("\n");
  const root = `<div id="root"><div data-prerender>\n${body}\n</div></div>`;

  return template
    .replace(/<html lang="[^"]*"/, `<html lang="${page.code}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeAttr(page.description)}" />`,
    )
    .replace("</head>", `${head}\n${prerenderStyle}\n  </head>`)
    .replace('<div id="root"></div>', root);
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

/** The /links page: the same site, marked so the app shows the list of links instead of the sections
 * (see src/features/links). It has no language path of its own; the app picks the visitor's language. */
export function linksHtml(template: string): string {
  const english = PAGES[0];
  const url = `${SITE_URL}/links/`;
  const title = `${english.name} | Links`;
  const description = `${english.name} — GitHub, LinkedIn, Telegram, email and resume in one place.`;
  const head = [
    `    <meta name="robots" content="index, follow, max-image-preview:large" />`,
    `    <meta name="author" content="${escapeAttr(english.name)}" />`,
    `    <link rel="canonical" href="${url}" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="${SITE_NAME}" />`,
    `    <meta property="og:url" content="${url}" />`,
    `    <meta property="og:title" content="${escapeAttr(title)}" />`,
    `    <meta property="og:description" content="${escapeAttr(description)}" />`,
    ...previewTags(english.code, `${english.name} — ${english.jobTitle}`, title, description),
  ].join("\n");
  const plainText = [
    "    <noscript>",
    `      <h1>${english.name} — Links</h1>`,
    "      <ul>",
    `        <li><a href="${SITE_URL}/resume.pdf">${english.resumeLabel}</a></li>`,
    ...PROFILE_LINKS.map(([label, href]) => `        <li><a href="${href}">${label}</a></li>`),
    "      </ul>",
    "    </noscript>",
  ].join("\n");
  return template
    .replace(/<html lang="[^"]*"/, '<html lang="en" data-page="links"')
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeAttr(description)}" />`)
    .replace("</head>", `${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"></div>\n${plainText}`);
}

/** Every short address (/github, /cv, ...) with the page that sends the visitor on. These are plain
 * pages with no site in them, so a link preview or a crawler sees a short redirect, never the portfolio. */
export function redirectPages(): Array<[slug: string, html: string]> {
  const codes = JSON.stringify(PAGES.map((page) => page.code));
  const page = (target: string, script: string, fallback: string) =>
    [
      "<!doctype html>",
      '<html lang="en">',
      "  <head>",
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      "    <title>Redirecting…</title>",
      '    <meta name="robots" content="noindex" />',
      fallback,
      `    <script>${script.replace(/</g, "\\u003c")}</script>`,
      "  </head>",
      `  <body><p>Redirecting to <a href="${escapeAttr(target)}">${escapeAttr(target)}</a>…</p></body>`,
      "</html>",
      "",
    ].join("\n");

  const external = Object.entries(externalLinks).map(
    ([slug, target]): [string, string] => [
      slug,
      page(target, `location.replace(${JSON.stringify(target)});`, `    <meta http-equiv="refresh" content="0;url=${escapeAttr(target)}" />`),
    ],
  );
  // Inside the site: the language is the one the visitor chose there before, else their browser's, else English.
  const inside = Object.entries(siteLinks).map(([slug, target]): [string, string] => {
    const script =
      `var t=${JSON.stringify(target)},c=${codes},l="en";` +
      `try{l=localStorage.getItem("portfolio:locale")}catch(e){}` +
      `if(c.indexOf(l)<0){l="en";var n=navigator.languages||[navigator.language];` +
      `for(var i=0;i<n.length;i++){var p=String(n[i]).slice(0,2).toLowerCase();if(c.indexOf(p)>=0){l=p;break}}}` +
      `location.replace(t.replace("{lang}",l));`;
    const english = target.replace("{lang}", "en");
    return [slug, page(english, script, `    <noscript><meta http-equiv="refresh" content="0;url=${escapeAttr(english)}" /></noscript>`)];
  });
  return [...external, ...inside];
}

export function localizedHtml(): Plugin {
  let outDir = "dist";

  return {
    name: "localized-html",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const template = fs.readFileSync(path.join(outDir, "index.html"), "utf-8");
      const assets = fs.existsSync(path.join(outDir, "assets")) ? fs.readdirSync(path.join(outDir, "assets")) : [];

      fs.writeFileSync(path.join(outDir, "404.html"), notFoundHtml(template));

      const contents = await loadContents(PAGES.map((page) => page.code));
      const bodyOf = (page: LocalePage) => renderContent(contents[page.code], SITE_URL);

      const english = PAGES.find((page) => page.code === "en");
      if (english) fs.writeFileSync(path.join(outDir, "index.html"), localize(template, english, assets, lastModified(), bodyOf(english)));

      const linksDir = path.join(outDir, "links");
      fs.mkdirSync(linksDir, { recursive: true });
      fs.writeFileSync(path.join(linksDir, "index.html"), linksHtml(template));
      for (const [slug, html] of redirectPages()) {
        fs.mkdirSync(path.join(outDir, slug), { recursive: true });
        fs.writeFileSync(path.join(outDir, slug, "index.html"), html);
      }

      for (const page of PAGES) {
        const target = path.join(outDir, page.path, "index.html");
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, localize(template, page, assets, lastModified(), bodyOf(page)));
      }

      const built = lastModified();
      const urls = PAGES.map((page) => {
        const links = [...PAGES, { code: "x-default", path: "/" }]
          .map((p) => `      <xhtml:link rel="alternate" hreflang="${p.code}" href="${SITE_URL + p.path}" />`)
          .join("\n");
        const image = `      <image:image>\n        <image:loc>${SITE_URL}/og/${page.code}.jpg</image:loc>\n        <image:title>${escapeAttr(page.title)}</image:title>\n      </image:image>`;
        const priority = page.code === "en" ? "1.0" : "0.9";
        return `  <url>\n    <loc>${SITE_URL + page.path}</loc>\n    <lastmod>${built}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n${links}\n${image}\n  </url>`;
      }).join("\n");
      const linksUrl = `  <url>\n    <loc>${SITE_URL}/links/</loc>\n    <lastmod>${built}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.5</priority>\n  </url>`;
      fs.writeFileSync(
        path.join(outDir, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n${linksUrl}\n</urlset>\n`,
      );
      fs.writeFileSync(path.join(outDir, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
      // A short plain-text description of the site for AI assistants and other tools that read it (llmstxt.org).
      const en = PAGES[0];
      fs.writeFileSync(
        path.join(outDir, "llms.txt"),
        [
          `# ${SITE_NAME}`,
          "",
          `> ${en.name} (also written ${NAME_VARIANTS.filter((n) => n !== en.name).join(", ")}) — ${en.jobTitle} based in ${en.location}. ${en.summary}`,
          "",
          "## Pages",
          ...PAGES.map((p) => `- [${p.title}](${SITE_URL + p.path}): ${p.description}`),
          `- [Links](${SITE_URL}/links/): GitHub, LinkedIn, Telegram, email and resume in one place.`,
          `- [${en.resumeLabel}](${SITE_URL}/resume.pdf): resume`,
          "",
          "## Profiles",
          ...PROFILE_LINKS.map(([label, href]) => `- [${label}](${href})`),
          "",
          "## Projects",
          ...PROJECTS.map(([name, href]) => `- [${name}](${href})`),
          "",
          "## Skills",
          SKILLS.join(", "),
          "",
        ].join("\n"),
      );
    },
  };
}
