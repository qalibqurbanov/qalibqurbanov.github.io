import type { Project, SocialLinks, ExperienceItem } from "@/types/content";

// Contact info and external profile links don't vary by locale.
export const email = "qalibqurbanow@gmail.com";
export const resumeUrl = "/resume.pdf";

/** First month of the whole career ("YYYY-MM"). The "{years}" placeholder in
 * the About text is worked out from it, so it never needs hand-editing. */
export const careerStart = "2023-10";

export const socials: SocialLinks = {
  github: "https://github.com/qalibqurbanov",
  stackoverflow: "https://stackoverflow.com/users/13249741/qalibqurbanov",
  medium: "https://medium.com/@qalibqurbanov",
  linkedin: "https://www.linkedin.com/in/qalibqurbanov/",
  email: `mailto:${email}`,
  telegram: "https://t.me/inde_irae",
};

/** What does not change with the language about each project; every locale adds its own wording on top. */
export const projectFacts = {
  "soundcloud-artwork-downloader": {
    slug: "soundcloud-artwork-downloader",
    tags: ["C#", "WinForms", "HtmlAgilityPack"],
    repoUrl: "https://github.com/qalibqurbanov/SoundcloudArtworkDownloader",
    liveUrl: "https://github.com/qalibqurbanov/SoundcloudArtworkDownloader/releases",
    stack: ["C#", ".NET Framework 4.5.2", "WinForms", "HtmlAgilityPack", "MetroModernUI", "ini-parser"],
  },
  imager: {
    slug: "imager",
    tags: ["C#", "WinForms", "ImgBB API"],
    repoUrl: "https://github.com/qalibqurbanov/Imager",
    liveUrl: "https://github.com/qalibqurbanov/Imager/releases",
    stack: ["C#", ".NET Framework 4.7.2", "WinForms", "Newtonsoft.Json", "MaterialSkin"],
  },
  "always-open-tab-next": {
    slug: "always-open-tab-next",
    tags: ["JavaScript", "Chrome Extension", "Manifest V3"],
    repoUrl: "https://github.com/qalibqurbanov/AlwaysOpenTabNext",
    stack: ["JavaScript", "Chrome Extensions API", "Manifest V3", "Service Worker"],
  },
} satisfies Record<string, Pick<Project, "slug" | "tags" | "repoUrl" | "stack"> & { liveUrl?: string }>;

/** The same for the Crocusoft job. */
export const crocusoftFacts = {
  org: "Crocusoft",
  logo: "/logos/crocusoft.png",
  start: "2023-12",
  current: true,
  tags: ["C#", "ASP.NET Web API", "EF Core", "Dapper", "Redis", "SignalR", "Docker", "PostgreSQL"],
} satisfies Pick<ExperienceItem, "org" | "logo" | "start" | "current" | "tags">;
