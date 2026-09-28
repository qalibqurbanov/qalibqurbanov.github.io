import type { AboutContent } from "@/types/content";

import { profile } from "./profile";

export const about: AboutContent = {
  paragraphs: [
    "I'm a backend developer with **3+ years of experience**, working mostly in the ==.NET ecosystem==. I've shipped **20+ projects** between my day job and freelance work, ranging from small internal tools to client-facing platforms that people actually depend on.",
    "I don't stay boxed into backend, though. I'm comfortable working with ==databases==, setting up basic ==DevOps== and ==Linux== server stuff, and can hold my own on the ==frontend== and ==mobile== side when a project calls for it. I'd rather reach for whatever tool actually fits the problem than force everything through one stack.",
    "Whenever I find the time, I hop on my **road bike** and join group rides. Riding solo, though, I like to push the distance a bit further, discover new and scenic places, enjoy the ride itself, and see what interesting, unexpected moments the road throws at me. When I'm not out riding, I like bringing the worlds in my head to life in a virtual one. That's what draws me to **level design** in ==GoldSrc==, the engine behind ==Half-Life== and ==Counter-Strike==. I also write plugins from time to time, adding new mechanics to make the server more fun for whoever's playing.",
  ],
  highlights: [
    { label: "Focus areas", value: ".NET / ASP.NET Core" },
    { label: "Experience", value: "3+ years" },
    { label: "Projects shipped", value: "20+" },
    { label: "Based in", value: profile.location },
    { label: "Open to", value: "Full-time, freelance, remote" },
  ],
};
