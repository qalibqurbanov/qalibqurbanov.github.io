import type { Project } from "@/types/content";

export const projects: Project[] = [
  {
    slug: "soundcloud-artwork-downloader",
    filename: "README.md",
    title: "SoundCloud Artwork Downloader",
    description:
      "A Windows desktop tool that scrapes a SoundCloud track page for its cover art and downloads the full-resolution original — no SoundCloud API key needed.",
    tags: ["C#", "WinForms", "HtmlAgilityPack"],
    repoUrl: "https://github.com/qalibqurbanov/SoundcloudArtworkDownloader",
    liveUrl: "https://github.com/qalibqurbanov/SoundcloudArtworkDownloader/releases",
    problem:
      "SoundCloud doesn't expose an easy way to grab a track's full-resolution artwork — the API requires registration, and the site only serves small thumbnail sizes by default.",
    approach:
      "Built a WinForms app that validates the pasted track URL with a regex, loads the track page with HtmlAgilityPack, and pulls the artwork <img> tag's src — then rewrites the URL's size suffix to \"-original\" to get the uncropped, full-resolution version before downloading it in the size the user picked.",
    stack: ["C#", ".NET Framework", "WinForms", "HtmlAgilityPack", "MetroModernUI"],
    outcome:
      "A small, single-purpose utility that saves an artwork image in a few clicks, and remembers the user's last-used folder and naming preference via an INI config file.",
  },
  {
    slug: "imager",
    filename: "README.md",
    title: "Imager",
    description: "A Windows desktop app for uploading images to ImgBB in bulk and instantly getting shareable links back.",
    tags: ["C#", "WinForms", "ImgBB API"],
    repoUrl: "https://github.com/qalibqurbanov/Imager",
    liveUrl: "https://github.com/qalibqurbanov/Imager/releases",
    problem:
      "Uploading a batch of images to a hosting site and collecting each one's link individually is slow and repetitive when you just want to quickly share a few screenshots.",
    approach:
      "A WinForms app that lets you queue up multiple images, uploads each one to the ImgBB API in sequence, and parses the JSON response for its hosted URL — so you end up with a full list of ready-to-share links in one pass.",
    stack: ["C#", ".NET Framework", "WinForms", "Newtonsoft.Json", "MaterialSkin"],
    outcome: "Turns a multi-step manual upload-and-copy-link routine into a single drag-and-drop-and-go action.",
  },
];
