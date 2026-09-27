import type { ExperienceItem } from "@/types/content";

export const experience: ExperienceItem[] = [
  {
    role: "Backend Developer",
    org: "Crocusoft",
    period: "Dec 2023 — Present",
    current: true,
    description:
      "At Crocusoft, I develop and maintain backend solutions with the modern .NET stack for both public and internal systems.",
    projectsIntro: "Some of the public projects I have worked on here include:",
    projects: [
      { label: "Crocusoft Website", url: "https://crocusoft.com" },
      {
        label: "Kapital Bank HR Platform",
        url: "https://crocusoft.com/en/Project/Details/hr.kapitalbank.az",
      },
      {
        label: "SANAT Art Center",
        url: "https://crocusoft.com/en/Project/Details/sanat-art-center",
      },
    ],
    highlightsIntro: "In these projects, I worked with the following:",
    highlights: [
      "Designed, developed and maintained scalable backend services using modern architectural patterns.",
      "Implemented and optimized data access using relational and NoSQL databases to improve application performance.",
      "Enhanced application responsiveness and reliability through caching, asynchronous processing, monitoring, logging and metrics.",
      "Containerized applications with Docker to ensure consistent and reliable deployments.",
    ],
    tags: ["C#", "ASP.NET Web API", "EF Core", "Dapper", "Redis", "SignalR", "Docker", "PostgreSQL"],
  },
];
