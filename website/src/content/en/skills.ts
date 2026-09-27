import type { SkillGroups } from "@/types/content";

// Tech/tool names are proper nouns and intentionally stay the same across locales.
export const skills: SkillGroups = {
  backend: [
    "C#",
    "ASP.NET MVC",
    "ASP.NET Web API",
    "EF Core",
    "Dapper ORM",
    "SignalR",
    "Redis",
    "Serilog",
    "Elasticsearch",
    "Kibana",
    "Quartz",
    "Hangfire",
    "MinIO",
    "Event-Driven Programming",
    "Microsoft SQL Server",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
  ],
  frontend: ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML/CSS"],
  mobile: ["React Native", "Flutter", "Android (Kotlin)", "iOS (Swift)"],
  tools: ["Git", "GitLab", "GitHub", "Docker", "Linux"],
};
