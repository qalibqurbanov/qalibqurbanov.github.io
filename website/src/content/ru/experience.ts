import type { ExperienceItem } from "@/types/content";

export const experience: ExperienceItem[] = [
  {
    role: "Backend-разработчик",
    org: "Crocusoft",
    period: "Декабрь 2023 — Настоящее время",
    current: true,
    description:
      "В Crocusoft я разрабатываю и поддерживаю backend-решения на современном стеке .NET для публичных и внутренних систем.",
    projectsIntro: "Некоторые публичные проекты, над которыми я здесь работал:",
    projects: [
      { label: "Сайт Crocusoft", url: "https://crocusoft.com" },
      {
        label: "HR-платформа Kapital Bank",
        url: "https://crocusoft.com/en/Project/Details/hr.kapitalbank.az",
      },
      {
        label: "SANAT Art Center",
        url: "https://crocusoft.com/en/Project/Details/sanat-art-center",
      },
    ],
    highlightsIntro: "В этих проектах я занимался следующим:",
    highlights: [
      "Проектировал, разрабатывал и поддерживал масштабируемые backend-сервисы с использованием современных архитектурных паттернов.",
      "Реализовывал и оптимизировал доступ к данным в реляционных и NoSQL базах данных для повышения производительности приложений.",
      "Повышал отзывчивость и надёжность приложений за счёт кеширования, асинхронной обработки, мониторинга, логирования и метрик.",
      "Контейнеризировал приложения с помощью Docker для обеспечения стабильных и надёжных развёртываний.",
    ],
    tags: ["C#", "ASP.NET Web API", "EF Core", "Dapper", "Redis", "SignalR", "Docker", "PostgreSQL"],
  },
];
