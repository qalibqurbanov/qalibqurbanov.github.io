import type { Project } from "@/types/content";

function slugify(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Filename shown in a project's fake code-editor window chrome. Prefers an
 * explicit `project.filename`; otherwise falls back to a derived name from
 * tags[0]/title, since project titles are translated per-locale and don't
 * always yield a usable slug. The fallback assumes a JS/TS project — set
 * `filename` explicitly for anything else (a "C#" tag alone would otherwise
 * slugify into just "c", with a misleading ".tsx" extension on top). */
export function filenameFor(project: Project, index: number): string {
  if (project.filename) return project.filename;
  const slug = slugify(project.tags[0] ?? "") || slugify(project.title) || `project-${index + 1}`;
  return `${slug}.tsx`;
}
