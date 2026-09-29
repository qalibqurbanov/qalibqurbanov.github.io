import type { Project } from "@/types/content";

export const projects: Project[] = [
  {
    slug: "soundcloud-artwork-downloader",
    filename: "README.md",
    title: "SoundCloud Artwork Downloader",
    description:
      "SoundCloud trek səhifəsini parse edərək üz qabığı şəklini orijinal ölçüdə yükləyən Windows desktop tətbiqi — SoundCloud API açarı tələb olunmur.",
    tags: ["C#", "WinForms", "HtmlAgilityPack"],
    repoUrl: "https://github.com/qalibqurbanov/SoundcloudArtworkDownloader",
    liveUrl: "https://github.com/qalibqurbanov/SoundcloudArtworkDownloader/releases",
    problem:
      "SoundCloud trekin tam ölçülü üz qabığı şəklini əldə etməyin asan yolunu təklif etmir — API qeydiyyat tələb edir, sayt isə default olaraq yalnız kiçik önizləmə ölçülərini verir.",
    approach:
      "Yapışdırılan trek linkini regex ilə yoxlayan, HtmlAgilityPack ilə trek səhifəsini yükləyən və üz qabığı <img> teqinin src-ni çıxaran WinForms tətbiqi yazdım — sonra tam ölçülü, kəsilməmiş versiyanı almaq üçün URL-in ölçü şəkilçisini \"-original\"-a dəyişdirir və istifadəçinin seçdiyi ölçüdə yükləyir.",
    stack: ["C#", ".NET Framework", "WinForms", "HtmlAgilityPack", "MetroModernUI"],
    outcome:
      "Bir neçə klikdə şəkli yadda saxlayan, son istifadə olunan qovluğu və adlandırma seçimini INI konfiqurasiya faylı vasitəsilə yadda saxlayan kiçik, tək məqsədli alət.",
  },
  {
    slug: "imager",
    filename: "README.md",
    title: "Imager",
    description:
      "Şəkilləri toplu şəkildə ImgBB-yə yükləyən və dərhal paylaşıla bilən linklər verən Windows desktop tətbiqi.",
    tags: ["C#", "WinForms", "ImgBB API"],
    repoUrl: "https://github.com/qalibqurbanov/Imager",
    liveUrl: "https://github.com/qalibqurbanov/Imager/releases",
    problem:
      "Bir neçə şəkli hostinq saytına yükləyib hər birinin linkini ayrı-ayrı toplamaq, bir neçə skrinşotu tez paylaşmaq istəyəndə yavaş və təkrarlanandır.",
    approach:
      "Bir neçə şəkli növbəyə əlavə etməyə imkan verən, hər birini ardıcıl olaraq ImgBB API-yə yükləyən və JSON cavabını parse edərək yüklənmiş şəklin linkini çıxaran WinForms tətbiqi — nəticədə bir keçiddə paylaşıla bilən linklərin tam siyahısını alırsan.",
    stack: ["C#", ".NET Framework", "WinForms", "Newtonsoft.Json", "MaterialSkin"],
    outcome: "Çoxaddımlı əl ilə yükləmə-linki-kopyala rutinini tək bir sürükləyib-burax əməliyyatına çevirir.",
  },
];
