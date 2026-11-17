import { lazy } from "react";

/** The sections below the first screen load as separate chunks. They are
 * fetched right after the page is up (see `preloadSections`), so by the time a
 * visitor scrolls they are already there. */
const loaders = {
  experience: () => import("@/features/experience/Experience").then((m) => ({ default: m.Experience })),
  projects: () => import("@/features/projects/Projects").then((m) => ({ default: m.Projects })),
  skills: () => import("@/features/skills/Skills").then((m) => ({ default: m.Skills })),
  blog: () => import("@/features/blog/Blog").then((m) => ({ default: m.Blog })),
  blogPost: () => import("@/features/blog/BlogPost").then((m) => ({ default: m.BlogPost })),
  contact: () => import("@/features/contact/Contact").then((m) => ({ default: m.Contact })),
  links: () => import("@/features/links/Links").then((m) => ({ default: m.Links })),
  projectDetail: () => import("@/features/projects/ProjectDetail").then((m) => ({ default: m.ProjectDetail })),
  resume: () => import("@/features/resume/ResumeViewer").then((m) => ({ default: m.ResumeViewer })),
  commandPalette: () => import("@/components/command-palette/CommandPalette").then((m) => ({ default: m.CommandPalette })),
  contactModal: () => import("@/components/contact/ContactModal").then((m) => ({ default: m.ContactModal })),
};

export const Experience = lazy(loaders.experience);
export const Projects = lazy(loaders.projects);
export const Skills = lazy(loaders.skills);
export const Blog = lazy(loaders.blog);
export const BlogPost = lazy(loaders.blogPost);
export const Contact = lazy(loaders.contact);
export const Links = lazy(loaders.links);
export const ProjectDetail = lazy(loaders.projectDetail);
export const ResumeViewer = lazy(loaders.resume);
export const CommandPalette = lazy(loaders.commandPalette);
export const ContactModal = lazy(loaders.contactModal);

/** Fetches the palette and the contact form, which are only mounted once asked for. */
export function preloadDialogs(): Promise<unknown> {
  return Promise.all([loaders.commandPalette(), loaders.contactModal()]);
}

/** Fetches every section chunk. Awaited before the first render when the URL
 * points into the page (a hash or a project), so the target exists to scroll to. */
export function preloadSections(): Promise<unknown> {
  return Promise.all([loaders.experience(), loaders.projects(), loaders.skills(), loaders.blog(), loaders.contact(), loaders.links()]);
}
