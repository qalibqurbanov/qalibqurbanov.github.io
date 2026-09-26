import type { UiStrings } from "@/types/content";

export const ui: UiStrings = {
  hero: {
    greeting: "Hi, my name is",
    tagline: "I build {highlight} that works end to end.",
    highlightWord: "software",
    ctaViewWork: "View my work",
    ctaGetInTouch: "Get in touch",
  },
  sections: {
    about: { index: "01", title: "About Me" },
    experience: { index: "02", title: "Experience" },
    projects: { index: "03", title: "Projects" },
    skills: { index: "04", title: "Skills" },
    blog: { index: "05", title: "Writing" },
    contact: { index: "06", title: "What's Next?" },
  },
  skillGroups: {
    backend: "Backend",
    frontend: "Frontend",
    mobile: "Mobile",
    tools: "Tools",
  },
  contact: {
    heading: "Get In Touch",
    body: "I'm currently open to new opportunities and interesting projects — backend, frontend, or mobile. Whether you have a question or just want to say hi, my inbox is always open.",
    ctaPrefix: "Say Hello —",
  },
  footer: {
    builtWith: "Built with React & Tailwind CSS.",
  },
  nav: {
    toggleMenu: "Toggle menu",
    scrollToAbout: "Scroll to About",
  },
};
