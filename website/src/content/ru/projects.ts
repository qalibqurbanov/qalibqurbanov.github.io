import type { Project } from "@/types/content";

export const projects: Project[] = [
  {
    slug: "soundcloud-artwork-downloader",
    title: "SoundCloud Artwork Downloader",
    description:
      "Десктопное приложение для Windows, которое парсит страницу трека SoundCloud и скачивает обложку в оригинальном разрешении — без ключа SoundCloud API.",
    tags: ["C#", "WinForms", "HtmlAgilityPack"],
    repoUrl: "https://github.com/qalibqurbanov/SoundcloudArtworkDownloader",
    liveUrl: "https://github.com/qalibqurbanov/SoundcloudArtworkDownloader/releases",
    problem:
      "SoundCloud не даёт простого способа получить обложку трека в полном разрешении — API требует регистрации, а сайт по умолчанию отдаёт только маленькие превью.",
    approach:
      "Написал WinForms-приложение, которое проверяет вставленную ссылку на трек регулярным выражением, загружает страницу трека через HtmlAgilityPack и достаёт src из тега <img> с обложкой — затем переписывает суффикс размера в URL на «-original», чтобы получить некадрированную версию в полном разрешении, и скачивает её в выбранном пользователем размере.",
    stack: ["C#", ".NET Framework", "WinForms", "HtmlAgilityPack", "MetroModernUI"],
    outcome:
      "Небольшая узкоспециализированная утилита, которая сохраняет обложку в пару кликов и запоминает последнюю выбранную папку и настройки именования через INI-файл конфигурации.",
  },
  {
    slug: "imager",
    title: "Imager",
    description:
      "Десктопное приложение для Windows для массовой загрузки изображений на ImgBB с мгновенным получением ссылок для шаринга.",
    tags: ["C#", "WinForms", "ImgBB API"],
    repoUrl: "https://github.com/qalibqurbanov/Imager",
    liveUrl: "https://github.com/qalibqurbanov/Imager/releases",
    problem:
      "Загружать пачку изображений на хостинг и собирать ссылку на каждое по отдельности медленно и утомительно, когда нужно быстро поделиться парой скриншотов.",
    approach:
      "WinForms-приложение, в котором можно добавить в очередь несколько изображений, каждое из которых последовательно загружается через ImgBB API, а JSON-ответ парсится для получения ссылки на загруженное изображение — в итоге получаешь готовый список ссылок за один проход.",
    stack: ["C#", ".NET Framework", "WinForms", "Newtonsoft.Json", "MaterialSkin"],
    outcome: "Превращает многошаговую рутину «загрузить и скопировать ссылку» в одно действие — перетащил и готово.",
  },
  {
    slug: "project-one",
    title: "Проект Один",
    description:
      "Краткое описание того, что делает этот проект и какую проблему он решает. Замените реальным проектом.",
    tags: ["React", "Node.js", "PostgreSQL"],
    repoUrl: "https://github.com/your-username/project-one",
    liveUrl: "#",
    problem: "Опишите в одном-двух предложениях проблему, которую решал этот проект.",
    approach: "Опишите свой подход — архитектуру, ключевые решения, компромиссы.",
    stack: ["React", "Node.js", "PostgreSQL"],
    outcome: "Опишите результат — что было выпущено, что улучшилось, что бы вы сделали иначе.",
  },
  {
    slug: "project-two",
    title: "Проект Два",
    description:
      "Краткое описание того, что делает этот проект и какую проблему он решает. Замените реальным проектом.",
    tags: ["React Native", "Firebase"],
    repoUrl: "https://github.com/your-username/project-two",
    liveUrl: "#",
    problem: "Опишите в одном-двух предложениях проблему, которую решал этот проект.",
    approach: "Опишите свой подход — архитектуру, ключевые решения, компромиссы.",
    stack: ["React Native", "Firebase"],
    outcome: "Опишите результат — что было выпущено, что улучшилось, что бы вы сделали иначе.",
  },
  {
    slug: "project-three",
    title: "Проект Три",
    description:
      "Краткое описание того, что делает этот проект и какую проблему он решает. Замените реальным проектом.",
    tags: ["Express", "MongoDB", "Docker"],
    repoUrl: "https://github.com/your-username/project-three",
    liveUrl: "#",
    problem: "Опишите в одном-двух предложениях проблему, которую решал этот проект.",
    approach: "Опишите свой подход — архитектуру, ключевые решения, компромиссы.",
    stack: ["Express", "MongoDB", "Docker"],
    outcome: "Опишите результат — что было выпущено, что улучшилось, что бы вы сделали иначе.",
  },
  {
    slug: "project-four",
    title: "Проект Четыре",
    description:
      "Краткое описание того, что делает этот проект и какую проблему он решает. Замените реальным проектом.",
    tags: ["Next.js", "Tailwind CSS"],
    repoUrl: "https://github.com/your-username/project-four",
    liveUrl: "#",
    problem: "Опишите в одном-двух предложениях проблему, которую решал этот проект.",
    approach: "Опишите свой подход — архитектуру, ключевые решения, компромиссы.",
    stack: ["Next.js", "Tailwind CSS"],
    outcome: "Опишите результат — что было выпущено, что улучшилось, что бы вы сделали иначе.",
  },
];
