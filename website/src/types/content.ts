export interface Profile {
  name: string;
  role: string;
  /** The line under the name in the sidebar: the profession and the focus. */
  headline: string;
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
  /** A short line under the name saying what the project is. */
  description?: string;
  /** The project's own logo (a path under public/); its initials stand in without one. */
  logo?: string;
}

export interface ExperienceItem {
  role: string;
  org: string;
  /** Company logo (a path under public/), shown in the job row; the first letter of `org` stands in without one. */
  logo?: string;
  period: string;
  /** First month of the role, "YYYY-MM"; drives the "(2 years 11 months)" length. */
  start: string;
  /** Last month of the role, "YYYY-MM". Leave out while `current`. */
  end?: string;
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
  /** The short line under the title on its card, e.g. "Windows desktop tool". */
  kind: string;
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

export type SkillCategory = "backend" | "tools";

export type SkillGroups = Record<SkillCategory, string[]>;

export interface BlogPost {
  /** Stable id of the article; the same in every language. It forms the article's link. */
  slug: string;
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
  title: string;
}

/** Small UI microcopy that isn't "content" per se but still needs translating. */
export interface UiStrings {
  hero: {
    /** Contains the literal token "{highlight}", replaced with `highlightWord`. */
    tagline: string;
    highlightWord: string;
  };
  /** The Home page: its short introduction, the label of its third big figure (the ecosystem) and the titles of its three chapters. */
  home: { intro: string; ecosystem: string; chapters: [string, string, string] };
  /** The Links page, opened from the picture in the menu: every place I can be found, in one list. */
  links: { title: string; intro: string; profiles: string; contact: string };
  sections: {
    about: SectionHeadingText;
    experience: SectionHeadingText;
    projects: SectionHeadingText;
    skills: SectionHeadingText;
    blog: SectionHeadingText;
    contact: SectionHeadingText;
  };
  skillGroups: Record<SkillCategory, string>;
  skillsClient: { title: string; text: string };
  /** Labels in the experience list: the "current job" pill and the two detail captions. */
  experienceLabels: { currentlyAt: string; now: string; results: string; publicProjects: string; stack: string };
  contact: {
    /** The big headline, in two parts: the second one gets the colour gradient. */
    headlineLead: string;
    headlineAccent: string;
    body: string;
    /** On the contact card: the status line, the kinds of work, and the buttons. */
    status: string;
    openTo: string[];
    send: string;
    copy: string;
    copied: string;
    emailLabel: string;
  };
  contactModal: {
    title: string;
    description: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    attachLabel: string;
    dropHint: string;
    dropActive: string;
    /** `{max}` and `{count}` are filled in. */
    filesTooLarge: string;
    removeFile: string;
    send: string;
    sending: string;
    successTitle: string;
    successBody: string;
    error: string;
    /** Offered next to the error: write by email instead. */
    emailInstead: string;
    /** Shown in the notice when a field is empty or wrong. */
    /** The wait notices. `{time}` is the wait ("23 seconds"), `{clock}` the time of day it ends, `{seconds}` the pause
     * between messages and `{count}` the messages allowed an hour.
     * Fast: sent right after opening. Pause: sent again too soon. Limit: the hourly limit of this browser.
     * Server: the hourly limit of this internet connection (known time). tooMany: the same, time not known. */
    waitFast: string;
    waitPause: string;
    waitLimit: string;
    waitServer: string;
    tooMany: string;
    /** A line under the Send button about what is allowed; `{count}`, `{seconds}` and `{chars}` are filled in. */
    limits: string;
    /** Under the Send button: how many of the hour's messages are used (`{sent}` of `{count}`), and the version for when all are used (`{clock}` is when the next one may go). */
    sentCount: string;
    sentAll: string;
    needName: string;
    needEmail: string;
    needMessage: string;
    /** Shown when the message was handed to the visitor's email app. */
    mailTitle: string;
    /** `{email}` is filled in. */
    mailBody: string;
    mailSend: string;
    close: string;
  };
  nav: {
    toggleMenu: string;
    menu: string;
    primary: string;
  };
  blogList: {
    readArticle: string;
    backToWriting: string;
    prev: string;
    next: string;
    published: string;
    notFoundTitle: string;
    notFoundBody: string;
  };
  backToTop: string;
  resumeView: {
    back: string;
    fallback: string;
    open: string;
    download: string;
    /** Shown instead of the embedded viewer on devices that open PDFs in their own viewer. */
  };
  /** Hover tooltips and screen-reader labels for icon-only controls. Brand names (GitHub, LinkedIn…) stay literal in the components. */
  labels: {
    email: string;
    resume: string;
    reportBug: string;
    viewSource: string;
    socialMedia: string;
    projectLinks: string;
    language: string;
    /** Contains "{shortcut}". */
    toggleTheme: string;
    /** The colour palette switcher: its title, and the name of each palette. */
    settings: string;
    message: string;
    appearance: string;
    palette: string;
    /** The label of the visual style switcher. */
    style: string;
    close: string;
    home: string;
    modeLight: string;
    modeDark: string;
    /** Contains "{level}"; the three level names follow. */
    motion: string;
    /** Contains "{title}". */
    repository: string;
    /** Contains "{title}". */
    liveDemo: string;
    /** Contains "{title}". */
    download: string;
    /** The short texts on a project card's buttons. */
    downloadButton: string;
    liveDemoButton: string;
    stars: string;
    /** The status bar: where the numbers come from, the branch and the newest commit. */
    statusData: string;
    statusBranch: string;
    downloads: string;
  };
  /** The 404 page. "message" contains "{path}", "back" contains "{home}", which becomes a link worded "home". */
  notFound: {
    eyebrow: string;
    title: string;
    message: string;
    back: string;
    home: string;
  };
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
    overviewTab: string;
    caseTab: string;
    back: string;
    problemLabel: string;
    approachLabel: string;
    stackLabel: string;
    outcomeLabel: string;
    viewRepo: string;
    viewLive: string;
    /** Label of the primary link when it points at a release or download, not a live site. */
    viewDownload: string;
    notFoundTitle: string;
    notFoundBody: string;
    backHome: string;
    prev: string;
    next: string;
    copyLink: string;
    linkCopied: string;
  };
  projectList: {
    filterLabel: string;
    /** The "no filter" chip. */
    filterAll: string;
    moreTitle: string;
    moreBody: string;
    moreCta: string;
    /** Label of the Any/All switch that sets how several selected tags combine. */
    matchLabel: string;
    matchAny: string;
    matchAll: string;
    matchAnyHint: string;
    matchAllHint: string;
    /** Shown when the selected tags (in "all" mode) match no project. */
    noMatch: string;
    /** Contains "{count}". */
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
