import type { AboutContent } from "@/types/content";

import { profile } from "./profile";

export const about: AboutContent = {
  paragraphs: [
    "Mən **3+ illik təcrübəyə** malik backend developerəm və əsasən ==.NET== ekosistemində işləyirəm. Əsas işim və freelance təcrübəm birlikdə kiçik daxili alətlərdən tutmuş insanların real etibar etdiyi müştəri platformalarına qədər **20+ layihə** həyata keçirmişəm.",
    "Amma yalnız backend ilə məhdudlaşmıram. ==Verilənlər bazaları== ilə rahat işləyirəm, sadə ==DevOps== və ==Linux== server qurmağı bacarıram, layihə tələb etdikdə ==frontend== və ==mobil== tərəfdə də öhdəmdən gəlirəm. Bir stack-ə bağlı qalmaqdansa, məsələyə real uyğun olan aləti seçməyi üstün tuturam.",
    "Vaxt tapdıqca **şosse velosipedimə** minib qrup sürüşlərinə qoşuluram. Tək sürəndə isə məsafəni bir az da uzatmağı, yeni və gözəl mənzərəli yerlər kəşf etməyi, yolun özündən zövq almağı və yolda gözlənilməz maraqlı anlar yaşamağı sevirəm. Velosiped sürmədiyim vaxtlarda isə ağlımdakı dünyaları virtual aləmdə yaratmağı xoşlayıram. Bu məqsədlə ==Half-Life== və ==Counter-Strike==-in arxasında duran ==GoldSrc== engine üzərində **level dizaynı** ilə məşğul oluram. Bəzən isə pluginlər yazaraq serverə yeni mexanikalar əlavə edir, oyunu oynayanlar üçün daha maraqlı və əyləncəli hala gətirirəm.",
  ],
  highlights: [
    { label: "Fokus sahələri", value: ".NET / ASP.NET Core" },
    { label: "Təcrübə", value: "3+ il" },
    { label: "Layihələr", value: "20+" },
    { label: "Yerləşdiyi yer", value: profile.location },
    { label: "Açığam", value: "Tam ştat, freelance, remote işlərə" },
  ],
};
