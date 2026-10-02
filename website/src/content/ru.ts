import type { Content, Profile } from "@/types/content";

import { email, resumeUrl, socials } from "./shared";

const ruProfile: Profile = {
  name: "Галиб Гурбанов",
  role: "Разработчик программного обеспечения",
  location: "Баку, Азербайджан",
  summary:
    "Я разрабатываю программное обеспечение полного цикла — от backend API и баз данных до отточенных веб-интерфейсов и мобильных приложений. Мне нравится превращать идеи в быстрые, надёжные и хорошо продуманные продукты.",
  email,
  resumeUrl,
};

const ru: Content = {
  profile: ruProfile,
  socials,
  about: {
    paragraphs: [
      "Я backend-разработчик с опытом **3+ года**, работаю в основном в экосистеме ==.NET==. Между основной работой и фрилансом я выпустил **20+ проектов** — от небольших внутренних инструментов до клиентских платформ, на которые люди реально полагаются.",
      "При этом я не зацикливаюсь только на backend. Я уверенно работаю с ==базами данных==, могу настроить базовый ==DevOps== и ==Linux==-сервер, а также разберусь во ==frontend== и ==мобильной== разработке, если проект этого требует. Мне важнее выбрать инструмент, который реально подходит задаче, чем держаться только одного стека.",
      "Когда есть время, я сажусь на **шоссейный велосипед** и присоединяюсь к групповым покатушкам. А в одиночных поездках люблю немного увеличить дистанцию, находить новые и красивые места, получать удовольствие от самой дороги и переживать неожиданные интересные моменты в пути. Когда я не на велосипеде, мне нравится создавать миры из головы в виртуальном пространстве. Для этого я занимаюсь **левел-дизайном** на ==GoldSrc== — движке, на котором сделаны ==Half-Life== и ==Counter-Strike==. Иногда пишу и плагины, добавляя новые механики, чтобы играть на сервере было интереснее и веселее.",
    ],
    highlights: [
      { label: "Направления", value: ".NET / ASP.NET Core" },
      { label: "Опыт", value: "3+ года" },
      { label: "Проекты", value: "20+" },
      { label: "Живу в", value: ruProfile.location },
      { label: "Открыт к", value: "Штатной работе, фрилансу, удалёнке" },
    ],
  },
  experience: [
    {
      role: "Backend-разработчик",
      org: "Crocusoft",
      period: "Декабрь 2023 — Настоящее время",
      start: "2023-12",
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
  ],
  projects: [
    {
      slug: "soundcloud-artwork-downloader",
      filename: "README.md",
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
      stack: ["C#", ".NET Framework 4.5.2", "WinForms", "HtmlAgilityPack", "MetroModernUI", "ini-parser"],
      outcome:
        "Небольшая узкоспециализированная утилита, которая сохраняет обложку в пару кликов и запоминает последнюю выбранную папку и настройки именования через INI-файл конфигурации.",
    },
    {
      slug: "imager",
      filename: "README.md",
      title: "Imager",
      description:
        "Десктопное приложение для Windows для массовой загрузки изображений на ImgBB с мгновенным получением ссылок для шаринга.",
      tags: ["C#", "WinForms", "ImgBB API"],
      repoUrl: "https://github.com/qalibqurbanov/Imager",
      liveUrl: "https://github.com/qalibqurbanov/Imager/releases",
      problem:
        "Загружать пачку изображений на хостинг и собирать ссылку на каждое по отдельности медленно и утомительно, когда нужно быстро поделиться парой скриншотов.",
      approach:
        "WinForms-приложение, в котором изображения (или целые папки) перетаскиваются в drop-зону. Каждый файл проверяется по допустимым расширениям, последовательно загружается в ImgBB API, а из JSON-ответа извлекается ссылка на загруженное изображение — готовые ссылки копируются в буфер обмена за один проход. Также есть светлая/тёмная тема и сворачивание в системный трей.",
      stack: ["C#", ".NET Framework 4.7.2", "WinForms", "Newtonsoft.Json", "MaterialSkin"],
      outcome: "Превращает многошаговую рутину «загрузить и скопировать ссылку» в одно действие — перетащил и готово.",
    },
  ],
  // Tech/tool names are proper nouns and intentionally stay the same across locales.
  skills: {
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
  },
  blogPosts: [
    {
      title: "Создание моего первого full-stack приложения",
      excerpt:
        "Короткий рассказ о проекте, который я создал, чему научился и что сделал бы иначе в следующий раз.",
      date: "2026-01-01",
      url: "#",
      codeSnippet: {
        filename: "server.ts",
        code: `export async function getUser(id: string) {
    // Cache first — the DB round trip was the slowest part of this route.
    const cached = await cache.get(\`user:\${id}\`);
    if (cached) return cached;

    const user = await db.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User not found");

    await cache.set(\`user:\${id}\`, user, { ttl: 60 });
    return user;
  }`,
      },
    },
    {
      title: "Заметки о переходе от веб- к мобильной разработке",
      excerpt:
        "Мысли об освоении мобильной разработки после работы преимущественно над вебом.",
      date: "2026-01-01",
      url: "#",
    },
    {
      title: "Почему я структурирую backend API именно так",
      excerpt: "Обзор архитектурных паттернов API, которые я использую по умолчанию, и почему.",
      date: "2026-01-01",
      url: "#",
    },
  ],
  navigation: [
    { label: "Обо мне", href: "#about" },
    { label: "Опыт", href: "#experience" },
    { label: "Проекты", href: "#projects" },
    { label: "Навыки", href: "#skills" },
    // { label: "Блог", href: "#blog" },
    { label: "Контакты", href: "#contact" },
  ],
  ui: {
    hero: {
      greeting: "Привет, меня зовут",
      tagline: "Я превращаю идеи в рабочее {highlight}.",
      highlightWord: "программное обеспечение",
      ctaViewWork: "Смотреть работы",
      ctaGetInTouch: "Связаться",
      terminalTabLabel: "terminal",
      stackValue: "То, что нужно проекту",
      minimized: {
        title: "Тссс! Ни звука — тебе не следовало это найти.",
        joke: "ФБР завело на него дело, как только увидело список навыков — никто не может быть настолько хорош во всём. {name} понятия не имеет, что мы его отслеживаем.",
        restoreWarning: "Этот терминал восстановится через {seconds} сек. — никому ни слова о том, что ты здесь видел.",
      },
      closeAttempt: "Хорошая попытка — это окно никуда не денется.",
      tinkerWarning: "Так, хватит тут ковыряться — здесь ничего нет.",
    },
    sections: {
      about: { index: "01", title: "Обо мне" },
      experience: { index: "02", title: "Опыт" },
      projects: { index: "03", title: "Проекты" },
      skills: { index: "04", title: "Навыки" },
      blog: { index: "05", title: "Блог" },
      contact: { index: "06", title: "Что дальше?" },
    },
    contactModal: {
      title: "Отправить сообщение",
      description: "Оставьте свои данные и сообщение — я отвечу вам по электронной почте.",
      nameLabel: "Имя",
      emailLabel: "Ваш e-mail",
      messageLabel: "Сообщение",
      attachLabel: "Вложения (необязательно)",
      dropHint: "Перетащите файлы сюда или нажмите для выбора",
      dropActive: "Отпустите файлы, чтобы прикрепить",
      filesTooLarge: "Суммарный размер файлов — не более {max}, не более {count} файлов.",
      removeFile: "Удалить файл",
      send: "Отправить",
      sending: "Отправка…",
      successTitle: "Сообщение отправлено",
      successBody: "Спасибо, что написали — отвечу как можно скорее.",
      error: "Не удалось отправить сообщение. Попробуйте ещё раз чуть позже.",
      close: "Закрыть",
    },
    skillGroups: {
      backend: "Backend",
      frontend: "Frontend",
      mobile: "Mobile",
      tools: "Инструменты",
    },
    contact: {
      heading: "Связаться со мной",
      body: "Сейчас я открыт к новым возможностям и интересным проектам — backend, frontend или мобильная разработка. Если у вас есть вопрос или вы просто хотите поздороваться, мой почтовый ящик всегда открыт.",
      ctaPrefix: "Черкни пару строк —",
    },
    nav: {
      toggleMenu: "Открыть/закрыть меню",
      scrollToAbout: "Перейти к разделу «Обо мне»",
      commandPaletteHint: "Поиск",
    },
    backToTop: "Наверх",
    resumeView: {
      back: "Назад",
      fallback: "Ваш браузер не может показать PDF на этой странице.",
    },
    labels: {
      email: "Эл. почта",
      resume: "Резюме",
      reportBug: "Сообщить об ошибке",
      viewSource: "Исходный код на GitHub",
      lastCommit: "Последний коммит",
      socialMedia: "Социальные сети",
      projectLinks: "Проект",
      language: "Язык",
      switchToLight: "Включить светлую тему",
      switchToDark: "Включить тёмную тему",
      toggleTheme: "Сменить тему ({shortcut})",
      minimize: "Свернуть",
      close: "Закрыть",
      home: "Главная",
      modeLight: "светлую",
      modeDark: "тёмную",
      terminalInput: "Ввод терминала",
      repository: "Репозиторий {title}",
      liveDemo: "Демо {title}",
    },
    commandPalette: {
      placeholder: "Введите команду или начните поиск…",
      empty: "Ничего не найдено.",
      groupNavigation: "Навигация",
      groupExperience: "Опыт",
      groupProjects: "Проекты",
      groupSkills: "Навыки",
      groupActions: "Действия",
      groupLanguages: "Язык",
      actionToggleTheme: "Переключить светлую / тёмную тему",
      actionCopyEmail: "Скопировать email",
      actionEmailCopied: "Email скопирован",
      actionOpenResume: "Открыть резюме",
      actionOpenGithub: "Открыть профиль на GitHub",
      actionOpenLinkedin: "Открыть профиль на LinkedIn",
      actionOpenTelegram: "Открыть Telegram",
      actionOpenMedium: "Открыть блог на Medium",
      actionOpenStackOverflow: "Открыть профиль на Stack Overflow",
      actionReportBug: "Сообщить об ошибке",
      openCaseStudy: "Открыть кейс",
    },
    contextMenu: {
      copyRepoLink: "Скопировать ссылку на репозиторий",
      repoLinkCopied: "Ссылка на репозиторий скопирована",
      copyPageLink: "Скопировать ссылку на страницу",
      pageLinkCopied: "Ссылка на страницу скопирована",
      openCommandPalette: "Панель команд",
      downloadResume: "Скачать резюме",
      viewSourceOnGithub: "Исходный код на GitHub",
      reportBug: "Сообщить об ошибке",
    },
    projectDetail: {
      back: "Назад к проектам",
      problemLabel: "Проблема",
      approachLabel: "Подход",
      stackLabel: "Стек",
      outcomeLabel: "Результат",
      viewRepo: "Открыть репозиторий",
      viewLive: "Открыть демо",
      notFoundTitle: "Проект не найден",
      notFoundBody: "Этого кейса не существует, либо ссылка устарела.",
      backHome: "На главную",
    },
    terminal: {
      welcome: "Введите 'help', чтобы увидеть доступные команды.",
      helpText:
        "help              показать этот список\nwhoami            кто я\nabout             краткое описание\nskills            технологии\nexperience        опыт работы\nprojects          список проектов\nopen <slug>       открыть кейс проекта\ncontact           как со мной связаться\nresume            открыть резюме\ngithub            открыть профиль на GitHub\nlinkedin          открыть профиль на LinkedIn\ntelegram          открыть Telegram\nmedium            открыть блог на Medium\nstackoverflow     открыть профиль на Stack Overflow\ntheme             переключить светлую / тёмную тему\nlang <code>       сменить язык (en, az, ru)\nclear             очистить терминал",
      notFound: "команда не найдена: {cmd} — введите 'help' для списка команд.",
      permissionDenied: "Хорошая попытка. В доступе отказано.",
      glitchOn: "Реальность нестабильна…",
      matrixOn: "Проснись… (нажми любую клавишу, чтобы выйти)",
      konami: "Код Konami принят. Режим глитча включён.",
      openingProject: "Открываю кейс «{title}»…",
      projectNotFound: "Проект «{slug}» не найден. Введите 'projects', чтобы увидеть список.",
      themeSwitched: "Тема переключена на {mode}.",
      langSwitched: "Язык переключён на {label}.",
      langInvalid: "Неизвестный язык «{code}». Попробуйте: en, az, ru.",
    },
  },
};

export default ru;
