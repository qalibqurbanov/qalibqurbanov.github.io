import { lazy } from "react";

/** The sections below the first screen load as separate chunks. They are
 * fetched right after the page is up (see `preloadSections`), so by the time a
 * visitor scrolls they are already there. */
const loaders = {
  experience: () => import("@/features/experience/Experience").then((m) => ({ default: m.Experience })),
  projects: () => import("@/features/projects/Projects").then((m) => ({ default: m.Projects })),
  skills: () => import("@/features/skills/Skills").then((m) => ({ default: m.Skills })),
  contact: () => import("@/features/contact/Contact").then((m) => ({ default: m.Contact })),
  projectDetail: () => import("@/features/projects/ProjectDetail").then((m) => ({ default: m.ProjectDetail })),
  resume: () => import("@/features/resume/ResumeViewer").then((m) => ({ default: m.ResumeViewer })),
  butterfly: () => import("@/components/ui/CyberButterfly").then((m) => ({ default: m.CyberButterfly })),
  fireflies: () => import("@/components/ui/Fireflies").then((m) => ({ default: m.Fireflies })),
};

export const Experience = lazy(loaders.experience);
export const Projects = lazy(loaders.projects);
export const Skills = lazy(loaders.skills);
export const Contact = lazy(loaders.contact);
export const ProjectDetail = lazy(loaders.projectDetail);
export const ResumeViewer = lazy(loaders.resume);
export const CyberButterfly = lazy(loaders.butterfly);
export const Fireflies = lazy(loaders.fireflies);

/** Fetches every section chunk. Awaited before the first render when the URL
 * points into the page (a hash or a project), so the target exists to scroll to. */
export function preloadSections(): Promise<unknown> {
  return Promise.all([loaders.experience(), loaders.projects(), loaders.skills(), loaders.contact()]);
}
