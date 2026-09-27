import type { UiStrings } from "@/types/content";

export const ui: UiStrings = {
  hero: {
    greeting: "Salam, mənim adım",
    tagline: "Mən başdan-sona işləyən {highlight} qururam.",
    highlightWord: "proqram təminatı",
    ctaViewWork: "İşlərimə baxın",
    ctaGetInTouch: "Əlaqə saxlayın",
  },
  sections: {
    about: { index: "01", title: "Haqqımda" },
    experience: { index: "02", title: "Təcrübə" },
    projects: { index: "03", title: "Layihələr" },
    skills: { index: "04", title: "Bacarıqlar" },
    blog: { index: "05", title: "Yazılar" },
    contact: { index: "06", title: "Növbəti Addım" },
  },
  skillGroups: {
    backend: "Backend",
    frontend: "Frontend",
    mobile: "Mobil",
    tools: "Alətlər",
  },
  contact: {
    heading: "Əlaqə Saxlayın",
    body: "Hazırda yeni imkanlara və maraqlı layihələrə açığam — backend, frontend və ya mobil. Sualınız varsa və ya sadəcə salam demək istəyirsinizsə, qutum həmişə açıqdır.",
    ctaPrefix: "Salam deyin —",
  },
  footer: {
    builtWith: "React və Tailwind CSS ilə hazırlanıb.",
  },
  nav: {
    toggleMenu: "Menyunu aç/bağla",
    scrollToAbout: "Haqqımda bölməsinə keç",
  },
  backToTop: "Yuxarı qayıt",
};
