import type { ExperienceItem } from "@/types/content";

export const experience: ExperienceItem[] = [
  {
    role: "Backend Developeri",
    org: "Crocusoft",
    period: "Dekabr 2023 — İndiyədək",
    current: true,
    description:
      "Crocusoft-da mən həm hər kəsə açıq, həm də daxili sistemlər üçün müasir .NET stack-i ilə backend həlləri qurur və dəstəkləyirəm.",
    projectsIntro: "Burada üzərində işlədiyim, hər kəsə açıq layihələrdən bəziləri:",
    projects: [
      { label: "Crocusoft Veb Saytı", url: "https://crocusoft.com" },
      {
        label: "Kapital Bank HR Platforması",
        url: "https://crocusoft.com/en/Project/Details/hr.kapitalbank.az",
      },
      {
        label: "SANAT Art Center",
        url: "https://crocusoft.com/en/Project/Details/sanat-art-center",
      },
    ],
    highlightsIntro: "Bu layihələrdə aşağıdakılarla məşğul olmuşam:",
    highlights: [
      "Müasir arxitektura nümunələrindən istifadə edərək miqyaslana bilən backend xidmətləri dizayn etmiş, hazırlamış və dəstəkləmişəm.",
      "Tətbiqin performansını artırmaq üçün relyasion və NoSQL verilənlər bazalarında məlumat girişini tətbiq etmiş və optimallaşdırmışam.",
      "Keşləmə, asinxron emal, monitorinq, loglama və metriklər vasitəsilə tətbiqin sürətini və etibarlılığını artırmışam.",
      "Sabit və etibarlı yerləşdirmələri təmin etmək üçün tətbiqləri Docker ilə konteynerləşdirmişəm.",
    ],
    tags: ["C#", "ASP.NET Web API", "EF Core", "Dapper", "Redis", "SignalR", "Docker", "PostgreSQL"],
  },
];
