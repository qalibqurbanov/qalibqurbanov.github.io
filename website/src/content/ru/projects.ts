import type { Project } from "@/types/content";

export const projects: Project[] = [
  {
    slug: "soundcloud-artwork-downloader",
    filename: "FormMain.cs",
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
    filename: "MainForm.cs",
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
];
