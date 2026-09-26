import type { UiStrings } from "@/types/content";

export const ui: UiStrings = {
  hero: {
    greeting: "Привет, меня зовут",
    tagline: "Я создаю {highlight}, которое работает от начала до конца.",
    highlightWord: "программное обеспечение",
    ctaViewWork: "Смотреть работы",
    ctaGetInTouch: "Связаться",
  },
  sections: {
    about: { index: "01", title: "Обо мне" },
    experience: { index: "02", title: "Опыт" },
    projects: { index: "03", title: "Проекты" },
    skills: { index: "04", title: "Навыки" },
    blog: { index: "05", title: "Блог" },
    contact: { index: "06", title: "Что дальше?" },
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
    ctaPrefix: "Написать —",
  },
  footer: {
    builtWith: "Создано на React и Tailwind CSS.",
  },
  nav: {
    toggleMenu: "Открыть/закрыть меню",
    scrollToAbout: "Перейти к разделу «Обо мне»",
  },
};
