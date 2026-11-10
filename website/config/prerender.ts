import path from "node:path";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

// Only the fields this file reads. The real type lives in src/types/content.ts, which uses the `@/` alias
// this Node-side config cannot resolve, so the shape is spelled out here (a mismatch fails the build).
interface Link {
  label: string;
  url: string;
  description?: string;
}
interface Content {
  profile: { name: string; role: string; location: string; summary: string; resumeUrl: string };
  socials: { github: string; linkedin: string; stackoverflow?: string; medium?: string; telegram?: string };
  about: { paragraphs: string[]; highlights: Array<{ label: string; value: string }> };
  experience: Array<{
    role: string;
    org: string;
    period: string;
    description: string;
    projectsIntro?: string;
    projects?: Link[];
    highlightsIntro?: string;
    highlights?: string[];
    tags: string[];
  }>;
  projects: Array<{
    title: string;
    kind: string;
    description: string;
    problem?: string;
    approach?: string;
    outcome?: string;
    stack?: string[];
    repoUrl: string;
    liveUrl: string;
  }>;
  skills: Record<string, string[]>;
  ui: {
    sections: Record<"about" | "experience" | "projects" | "skills" | "contact", { title: string }>;
    skillGroups: Record<string, string>;
    skillsClient: { title: string; text: string };
    contact: { body: string };
  };
}
interface LiveStats {
  careerYears(now: Date): number;
  withLiveStats(content: Content, locale: string, years: number): Content;
}

// The page is drawn by JavaScript, so a program that reads only the raw HTML would find it empty.
// This turns the site's real text (the same content files the page uses, so the two can never drift
// apart) into plain HTML for each language. localized-html.ts writes it into the page's root; the
// site replaces it the moment it starts, so visitors never see it.

const dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(dirname, "../src");

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Content files use `**bold**` and `==chip==` marks and `{years}` placeholders; plain text needs none of them. */
const plain = (value: string) => value.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/==([^=]+)==/g, "$1");

type Loaded = Record<string, Content>;

/** Loads every language's content through Vite itself, so the content files can keep their `@/` imports. */
export async function loadContents(codes: string[]): Promise<Loaded> {
  const server = await createServer({
    configFile: false,
    root: path.resolve(dirname, ".."),
    logLevel: "silent",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { "@": srcDir } },
  });
  try {
    const stats = (await server.ssrLoadModule("/src/lib/liveStats.ts")) as LiveStats;
    const years = stats.careerYears(new Date());
    const result: Loaded = {};
    for (const code of codes) {
      const module = (await server.ssrLoadModule(`/src/content/${code}.ts`)) as { default: Content };
      result[code] = stats.withLiveStats(module.default, code, years);
    }
    return result;
  } finally {
    await server.close();
  }
}

const link = (label: string, url: string) => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
const list = (items: string[]) => (items.length ? `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>` : "");

/** The page's text as plain, semantic HTML: one H1, then a section per part of the site. */
export function renderContent(content: Content, siteUrl: string): string {
  const { profile, about, experience, projects, skills, ui, socials } = content;
  const out: string[] = [];

  out.push(`<header><h1>${escapeHtml(profile.name)} — ${escapeHtml(profile.role)}</h1>`);
  out.push(`<p>${escapeHtml(profile.location)}</p><p>${escapeHtml(profile.summary)}</p></header>`);

  out.push(`<section id="about"><h2>${escapeHtml(ui.sections.about.title)}</h2>`);
  out.push(about.paragraphs.map((p) => `<p>${escapeHtml(plain(p))}</p>`).join(""));
  out.push(list(about.highlights.map((h) => `${escapeHtml(h.label)}: ${escapeHtml(plain(h.value))}`)));
  out.push("</section>");

  out.push(`<section id="experience"><h2>${escapeHtml(ui.sections.experience.title)}</h2>`);
  for (const job of experience) {
    out.push(`<article><h3>${escapeHtml(job.role)} — ${escapeHtml(job.org)}</h3><p>${escapeHtml(job.period)}</p>`);
    out.push(`<p>${escapeHtml(job.description)}</p>`);
    if (job.projects?.length) {
      if (job.projectsIntro) out.push(`<p>${escapeHtml(job.projectsIntro)}</p>`);
      out.push(list(job.projects.map((p) => link(p.label, p.url) + (p.description ? ` — ${escapeHtml(p.description)}` : ""))));
    }
    if (job.highlights?.length) {
      if (job.highlightsIntro) out.push(`<p>${escapeHtml(job.highlightsIntro)}</p>`);
      out.push(list(job.highlights.map((h) => escapeHtml(plain(h)))));
    }
    out.push(`<p>${escapeHtml(job.tags.join(", "))}</p></article>`);
  }
  out.push("</section>");

  out.push(`<section id="projects"><h2>${escapeHtml(ui.sections.projects.title)}</h2>`);
  for (const project of projects) {
    out.push(`<article><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.kind)}</p><p>${escapeHtml(project.description)}</p>`);
    for (const text of [project.problem, project.approach, project.outcome]) if (text) out.push(`<p>${escapeHtml(text)}</p>`);
    if (project.stack?.length) out.push(`<p>${escapeHtml(project.stack.join(", "))}</p>`);
    out.push(list([link("Source", project.repoUrl), link("Download", project.liveUrl)]));
    out.push("</article>");
  }
  out.push("</section>");

  out.push(`<section id="skills"><h2>${escapeHtml(ui.sections.skills.title)}</h2>`);
  for (const [group, items] of Object.entries(skills)) {
    out.push(`<h3>${escapeHtml(ui.skillGroups[group as keyof typeof ui.skillGroups] ?? group)}</h3>${list(items.map(escapeHtml))}`);
  }
  out.push(`<h3>${escapeHtml(ui.skillsClient.title)}</h3><p>${escapeHtml(ui.skillsClient.text)}</p></section>`);

  out.push(`<section id="contact"><h2>${escapeHtml(ui.sections.contact.title)}</h2><p>${escapeHtml(ui.contact.body)}</p>`);
  const profiles: Array<[string, string | undefined]> = [
    ["GitHub", socials.github],
    ["LinkedIn", socials.linkedin],
    ["Stack Overflow", socials.stackoverflow],
    ["Medium", socials.medium],
    ["Telegram", socials.telegram],
  ];
  out.push(
    list([
      link(profile.resumeUrl.endsWith(".pdf") ? "Resume (PDF)" : "Resume", siteUrl + profile.resumeUrl),
      ...profiles.flatMap(([label, url]) => (url ? [link(label, url)] : [])),
    ]),
  );
  out.push("</section>");

  return out.join("\n");
}
