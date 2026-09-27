export interface Profile {
  name: string;
  role: string;
  location: string;
  summary: string;
  email: string;
  resumeUrl: string;
  avatarInitials: string;
}

export interface SocialLinks {
  github: string;
  linkedin: string;
  email: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface Highlight {
  label: string;
  value: string;
}

export interface AboutContent {
  paragraphs: string[];
  highlights: Highlight[];
}

export interface ExperienceItem {
  role: string;
  org: string;
  period: string;
  description: string;
  tags: string[];
}

export interface Project {
  title: string;
  description: string;
  tags: string[];
  repoUrl: string;
  liveUrl: string;
}

export type SkillCategory = "backend" | "frontend" | "mobile" | "tools";

export type SkillGroups = Record<SkillCategory, string[]>;

export interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  url: string;
}

export interface SectionHeadingText {
  index: string;
  title: string;
}

/** Small UI microcopy that isn't "content" per se but still needs translating. */
export interface UiStrings {
  hero: {
    greeting: string;
    /** Contains the literal token "{highlight}", replaced with `highlightWord`. */
    tagline: string;
    highlightWord: string;
    ctaViewWork: string;
    ctaGetInTouch: string;
  };
  sections: {
    about: SectionHeadingText;
    experience: SectionHeadingText;
    projects: SectionHeadingText;
    skills: SectionHeadingText;
    blog: SectionHeadingText;
    contact: SectionHeadingText;
  };
  skillGroups: Record<SkillCategory, string>;
  contact: {
    heading: string;
    body: string;
    ctaPrefix: string;
  };
  footer: {
    builtWith: string;
  };
  nav: {
    toggleMenu: string;
    scrollToAbout: string;
  };
  backToTop: string;
}

/** Everything the site renders, for a single locale. */
export interface Content {
  profile: Profile;
  socials: SocialLinks;
  navigation: NavItem[];
  about: AboutContent;
  experience: ExperienceItem[];
  projects: Project[];
  skills: SkillGroups;
  blogPosts: BlogPost[];
  ui: UiStrings;
}
