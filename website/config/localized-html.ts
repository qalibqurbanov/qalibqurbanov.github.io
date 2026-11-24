import fs from "node:fs";
import path from "node:path";

import { createServer, type Plugin } from "vite";

// The site is a client-rendered SPA, but each language still needs its own
// real HTML file at its own URL so crawlers and link previews see the right
// <html lang>, title, description and hreflang alternates without running JS.
// After the build this writes dist/<locale>/index.html for every
// locale, /en/ included), plus sitemap.xml and robots.txt. The root dist/index.html
// is the x-default landing page: an English copy (canonical -> /en/) whose
// script redirects visitors to their preferred language.
//
// It runs in Node at
// build time, and reads each language's content (through Vite) for the pages of the projects and articles. When adding a locale, add it here and in src/i18n/locale.ts.

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

/** Short addresses that send the visitor on to one of the profiles: /github/ and so on. Each is a tiny page
 * (GitHub Pages has no server-side redirects) that leaves at once and stays out of search results. */
const SHORTCUTS: Record<string, string> = {
  github: "https://github.com/qalibqurbanov",
  linkedin: "https://www.linkedin.com/in/qalibqurbanov/",
  stackoverflow: "https://stackoverflow.com/users/13249741/qalibqurbanov",
  medium: "https://medium.com/@qalibqurbanov",
  telegram: "https://t.me/inde_irae",
  resume: `${SITE_URL}/resume.pdf`,
};

function redirectHtml(target: string): string {
  const url = escapeAttr(target);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting…</title>
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=${url}" />
    <link rel="canonical" href="${url}" />
    <script>location.replace(${JSON.stringify(target).replace(/</g, "\\u003c")});</script>
  </head>
  <body><a href="${url}">${url}</a></body>
</html>
`;
}

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** The few font files the first screen needs, per language, so they start downloading with the HTML
 * instead of waiting for the CSS and the script. Names are matched in the build's hashed assets. */
const FIRST_SCREEN_FONTS: Record<string, string[]> = {
  en: ["exo-2-latin-700", "exo-2-latin-600", "inter-latin-400", "jetbrains-mono-latin-400"],
  az: ["exo-2-latin-700", "exo-2-latin-600", "inter-latin-400", "jetbrains-mono-latin-400", "jetbrains-mono-latin-ext-400"],
  ru: ["exo-2-cyrillic-700", "exo-2-cyrillic-600", "inter-cyrillic-400", "jetbrains-mono-cyrillic-400", "jetbrains-mono-latin-400"],
};

function fontPreloads(assets: string[], code: string): string[] {
  return (FIRST_SCREEN_FONTS[code] ?? []).flatMap((name) => {
    const file = assets.find((asset) => asset.startsWith(`${name}-normal-`) && asset.endsWith(".woff2"));
    return file ? [`    <link rel="preload" as="font" type="font/woff2" href="/assets/${file}" crossorigin />`] : [];
  });
}

/** Everything that differs from one built page to the next: a language's home page, or one project or article. */
interface Head {
  lang: string;
  title: string;
  description: string;
  url: string;
  ogType: "website" | "article";
  ogLocale: string;
  otherOgLocales: string[];
  /** Every language this page exists in, for the hreflang links (the root page is added as the default). */
  alternates: Array<{ code: string; url: string }>;
  structuredData: object;
  /** The plain-text copy of the page, one HTML line each. */
  plainText: string[];
}

function render(template: string, head: Head, assets: string[], fontCode: string): string {
  const alternates = head.alternates.map((a) => `    <link rel="alternate" hreflang="${a.code}" href="${a.url}" />`);
  alternates.push(`    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />`);

  // "<" is escaped so no value can ever close the script tag early.
  const structuredData = `    <script type="application/ld+json">${JSON.stringify(head.structuredData).replace(/</g, "<")}</script>`;

  const tags = [
    ...fontPreloads(assets, fontCode),
    `    <link rel="canonical" href="${head.url}" />`,
    ...alternates,
    `    <meta property="og:type" content="${head.ogType}" />`,
    `    <meta property="og:url" content="${head.url}" />`,
    `    <meta property="og:title" content="${escapeAttr(head.title)}" />`,
    `    <meta property="og:description" content="${escapeAttr(head.description)}" />`,
    `    <meta property="og:locale" content="${head.ogLocale}" />`,
    ...head.otherOgLocales.map((code) => `    <meta property="og:locale:alternate" content="${code}" />`),
    structuredData,
  ].join("\n");

  // The page itself is drawn by JavaScript, so a program that only reads the raw HTML (some
  // recruiter and job-site tools, link scanners, text-only browsers) would otherwise find it
  // empty. This short copy gives it the essentials; visitors with JavaScript never see it.
  const plainText = ["    <noscript>", ...head.plainText.map((line) => `      ${line}`), "    </noscript>"].join("\n");

  return template
    .replace(/<html lang="[^"]*"/, `<html lang="${head.lang}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${head.title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeAttr(head.description)}" />`,
    )
    .replace("</head>", `${tags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"></div>\n${plainText}`);
}

function localize(template: string, page: LocalePage, assets: string[]): string {
  const url = SITE_URL + page.path;
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: page.name,
    jobTitle: page.jobTitle,
    url,
    address: { "@type": "PostalAddress", addressLocality: "Baku", addressCountry: "AZ" },
    sameAs: SAME_AS,
  };
  return render(
    template,
    {
      lang: page.code,
      title: page.title,
      description: page.description,
      url,
      ogType: "website",
      ogLocale: page.ogLocale,
      otherOgLocales: PAGES.filter((p) => p !== page).map((p) => p.ogLocale),
      alternates: PAGES.map((p) => ({ code: p.code, url: SITE_URL + p.path })),
      structuredData: person,
      plainText: [
        `<h1>${page.name} — ${page.jobTitle}</h1>`,
        `<p>${page.location}</p>`,
        `<p>${page.summary}</p>`,
        "<ul>",
        `  <li><a href="${SITE_URL}/resume.pdf">${page.resumeLabel}</a></li>`,
        ...PROFILE_LINKS.map(([label, href]) => `  <li><a href="${href}">${label}</a></li>`),
        "</ul>",
      ],
    },
    assets,
    page.code,
  );
}

// A project and an article each have their own address in every language, /<language>/projects/<slug>/ and
// /<language>/blog/<slug>/, so each can be found, linked to and shown in a link preview on its own.
// (The site reads the same addresses in the browser; see src/lib/viewPath.ts.)

type ViewKind = "projects" | "blog";

/** The parts of a language's content that the built pages of the projects and articles need. */
interface ViewContent {
  profile: { name: string };
  projects: Array<{ slug: string; title: string; kind: string; description?: string; repoUrl?: string; tags: string[] }>;
  blogPosts: Array<{ slug: string; title: string; excerpt: string; date: string }>;
}

interface ViewPage {
  kind: ViewKind;
  slug: string;
  /** Address per language that has it. */
  paths: Array<{ code: string; path: string }>;
}

const viewPath = (code: string, kind: ViewKind, slug: string) => `/${code}/${kind}/${encodeURIComponent(slug)}/`;

function viewHtml(template: string, assets: string[], page: LocalePage, content: ViewContent, view: ViewPage): string {
  const url = SITE_URL + viewPath(page.code, view.kind, view.slug);
  const home = SITE_URL + page.path;
  const author = { "@type": "Person", name: content.profile.name, url: home };
  const alternates = view.paths.map((p) => ({ code: p.code, url: SITE_URL + p.path }));
  const other = PAGES.filter((p) => p !== page && view.paths.some((v) => v.code === p.code)).map((p) => p.ogLocale);

  if (view.kind === "projects") {
    const project = content.projects.find((item) => item.slug === view.slug)!;
    const description = project.description ?? `${project.title} — ${project.kind}`;
    const code = {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: project.title,
      description,
      url,
      inLanguage: page.code,
      author,
      ...(project.repoUrl ? { codeRepository: project.repoUrl } : {}),
    };
    return render(
      template,
      {
        lang: page.code,
        title: `${project.title} | ${content.profile.name}`,
        description,
        url,
        ogType: "website",
        ogLocale: page.ogLocale,
        otherOgLocales: other,
        alternates,
        structuredData: code,
        plainText: [
          `<h1>${project.title}</h1>`,
          `<p>${project.kind}</p>`,
          `<p>${description}</p>`,
          `<p>${project.tags.join(", ")}</p>`,
          ...(project.repoUrl ? [`<p><a href="${project.repoUrl}">GitHub</a></p>`] : []),
          `<p><a href="${home}">${content.profile.name}</a></p>`,
        ],
      },
      assets,
      page.code,
    );
  }

  const post = content.blogPosts.find((item) => item.slug === view.slug)!;
  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    url,
    mainEntityOfPage: url,
    inLanguage: page.code,
    author,
  };
  return render(
    template,
    {
      lang: page.code,
      title: `${post.title} | ${content.profile.name}`,
      description: post.excerpt,
      url,
      ogType: "article",
      ogLocale: page.ogLocale,
      otherOgLocales: other,
      alternates,
      structuredData: article,
      plainText: [
        `<h1>${post.title}</h1>`,
        `<p><time datetime="${post.date}">${post.date}</time></p>`,
        `<p>${post.excerpt}</p>`,
        `<p><a href="${home}">${content.profile.name}</a></p>`,
      ],
    },
    assets,
    page.code,
  );
}

/** Reads each language's content the way the site does (through Vite, so its imports and aliases resolve). */
async function loadContents(root: string): Promise<Record<string, ViewContent>> {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: "silent",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true },
    resolve: { alias: { "@": path.resolve(root, "src") } },
  });
  try {
    const contents: Record<string, ViewContent> = {};
    for (const page of PAGES) {
      const module = (await server.ssrLoadModule(`/src/content/${page.code}.ts`)) as { default: ViewContent };
      contents[page.code] = module.default;
    }
    return contents;
  } finally {
    await server.close();
  }
}

const escapeXml = (value: string) => value.replace(/&/g, "&amp;");

function sitemapEntry(url: string, alternates: Array<{ code: string; url: string }>): string {
  const links = [...alternates, { code: "x-default", url: `${SITE_URL}/` }]
    .map((a) => `      <xhtml:link rel="alternate" hreflang="${a.code}" href="${escapeXml(a.url)}" />`)
    .join("\n");
  return `  <url>\n    <loc>${escapeXml(url)}</loc>\n${links}\n  </url>`;
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
  let root = process.cwd();

  return {
    name: "localized-html",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      root = config.root;
    },
    async closeBundle() {
      const template = fs.readFileSync(path.join(outDir, "index.html"), "utf-8");
      const assets = fs.existsSync(path.join(outDir, "assets")) ? fs.readdirSync(path.join(outDir, "assets")) : [];

      fs.writeFileSync(path.join(outDir, "404.html"), notFoundHtml(template));

      for (const [name, target] of Object.entries(SHORTCUTS)) {
        fs.mkdirSync(path.join(outDir, name), { recursive: true });
        fs.writeFileSync(path.join(outDir, name, "index.html"), redirectHtml(target));
      }

      const english = PAGES.find((page) => page.code === "en");
      if (english) fs.writeFileSync(path.join(outDir, "index.html"), localize(template, english, assets));

      for (const page of PAGES) {
        const target = path.join(outDir, page.path, "index.html");
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, localize(template, page, assets));
      }

      // One page per project and per article, in each language that has it.
      const contents = await loadContents(root);
      const itemsOf = (code: string, kind: ViewKind) => (kind === "projects" ? contents[code].projects : contents[code].blogPosts);
      const views: ViewPage[] = [];
      for (const kind of ["projects", "blog"] as const) {
        const slugs = new Set(PAGES.flatMap((page) => itemsOf(page.code, kind).map((item) => item.slug)));
        for (const slug of slugs) {
          const paths = PAGES.filter((page) => itemsOf(page.code, kind).some((item) => item.slug === slug)).map((page) => ({
            code: page.code,
            path: viewPath(page.code, kind, slug),
          }));
          views.push({ kind, slug, paths });
        }
      }
      for (const view of views) {
        for (const { code, path: viewUrl } of view.paths) {
          const page = PAGES.find((p) => p.code === code)!;
          const target = path.join(outDir, viewUrl, "index.html");
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, viewHtml(template, assets, page, contents[code], view));
        }
      }

      const urls = [
        ...PAGES.map((page) =>
          sitemapEntry(
            SITE_URL + page.path,
            PAGES.map((p) => ({ code: p.code, url: SITE_URL + p.path })),
          ),
        ),
        ...views.flatMap((view) => {
          const alternates = view.paths.map((p) => ({ code: p.code, url: SITE_URL + p.path }));
          return alternates.map((a) => sitemapEntry(a.url, alternates));
        }),
      ].join("\n");
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
