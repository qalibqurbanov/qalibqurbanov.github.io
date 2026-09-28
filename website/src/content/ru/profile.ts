import type { Profile } from "@/types/content";

import { email, resumeUrl } from "../shared";

export const profile: Profile = {
  name: "Галиб Гурбанов",
  role: "Разработчик программного обеспечения",
  location: "Баку, Азербайджан",
  summary:
    "Я разрабатываю программное обеспечение полного цикла — от backend API и баз данных до отточенных веб-интерфейсов и мобильных приложений. Мне нравится превращать идеи в быстрые, надёжные и хорошо продуманные продукты.",
  email,
  resumeUrl,
  avatarInitials: "ГГ",
};

export { socials } from "../shared";
