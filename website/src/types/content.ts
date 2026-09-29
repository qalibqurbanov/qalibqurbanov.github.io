export interface Profile {
  name: string;
  role: string;
  location: string;
  summary: string;
  email: string;
  resumeUrl: string;
}

export interface SocialLinks {
  github: string;
  linkedin: string;
  email: string;
  /** Optional — the footer only shows the icon when these are set. */
  telegram?: string;
  medium?: string;
  stackoverflow?: string;
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

export interface ExperienceLink {
  label: string;
  url: string;
}

export interface ExperienceItem {
  role: string;
  org: string;
  period: string;
  /** True while this role is still ongoing (no end date). */
  current?: boolean;
  description: string;
  /** Optional lead-in line shown above `projects`. */
  projectsIntro?: string;
  /** Optional bullet list of named, linked projects rendered under the description. */
  projects?: ExperienceLink[];
  /** Optional lead-in line shown above `highlights`. */
  highlightsIntro?: string;
  /** Optional bullet list of responsibilities/achievements. */
  highlights?: string[];
  tags: string[];
}

export interface Project {
  /** Stable, untranslated identifier used in case-study URLs — keep it the same across locales. */
  slug: string;
  /** Filename shown in the fake code-editor window chrome (card + case study).
   * Falls back to a derived name from tags[0]/title when omitted — set this
   * explicitly whenever that derivation would produce something misleading,
   * e.g. a non-JS/TS project whose first tag doesn't slugify into anything
   * readable (a "C#" tag alone becomes just "c"). */
  filename?: string;
  title: string;
  description: string;
  tags: string[];
  repoUrl: string;
  liveUrl: string;
  /** Optional case-study detail shown on the project's own page, if provided. */
  problem?: string;
  approach?: string;
  stack?: string[];
  outcome?: string;
}

export type SkillCategory = "backend" | "frontend" | "mobile" | "tools";

export type SkillGroups = Record<SkillCategory, string[]>;

export interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  url: string;
  /** Optional highlighted code snippet rendered under the excerpt. */
  codeSnippet?: {
    filename: string;
    code: string;
  };
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
    terminalTabLabel: string;
    /** The Developer.cs snippet's `Stack` array value — deliberately not a
     * tech list, so it never looks outdated or narrow. */
    stackValue: string;
    minimized: {
      title: string;
      /** Contains the literal token "{name}", replaced with `profile.name` via `format()`. */
      joke: string;
      /** Contains the literal token "{seconds}", replaced with the live countdown via `format()`. */
      restoreWarning: string;
    };
    closeAttempt: string;
    /** Shown instead of `closeAttempt` once the FBI reveal has already been shown once. */
    tinkerWarning: string;
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
  nav: {
    toggleMenu: string;
    scrollToAbout: string;
    commandPaletteHint: string;
  };
  backToTop: string;
  commandPalette: {
    placeholder: string;
    empty: string;
    groupNavigation: string;
    groupExperience: string;
    groupProjects: string;
    groupSkills: string;
    groupActions: string;
    groupLanguages: string;
    actionToggleTheme: string;
    actionCopyEmail: string;
    actionEmailCopied: string;
    actionOpenResume: string;
    actionOpenGithub: string;
    actionOpenLinkedin: string;
    actionOpenTelegram: string;
    actionOpenMedium: string;
    actionOpenStackOverflow: string;
    actionReportBug: string;
    openCaseStudy: string;
  };
  contextMenu: {
    copyRepoLink: string;
    repoLinkCopied: string;
    copyPageLink: string;
    pageLinkCopied: string;
    openCommandPalette: string;
    downloadResume: string;
    viewSourceOnGithub: string;
    reportBug: string;
  };
  projectDetail: {
    back: string;
    problemLabel: string;
    approachLabel: string;
    stackLabel: string;
    outcomeLabel: string;
    viewRepo: string;
    viewLive: string;
    notFoundTitle: string;
    notFoundBody: string;
    backHome: string;
  };
  terminal: {
    welcome: string;
    helpText: string;
    notFound: string;
    permissionDenied: string;
    openingProject: string;
    projectNotFound: string;
    themeSwitched: string;
    langSwitched: string;
    langInvalid: string;
  };
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
