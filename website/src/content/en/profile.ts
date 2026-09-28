import type { Profile } from "@/types/content";

import { email, resumeUrl } from "../shared";

// Edit this file to personalize your identity and bio; contact links and
// other locale-independent values live in content/shared.ts.
export const profile: Profile = {
  name: "Galib Gurbanov",
  role: "Software Developer",
  location: "Baku, Azerbaijan",
  summary:
    "I build software end-to-end — from backend APIs and databases to polished web frontends and mobile apps. I like turning ideas into fast, reliable, well-designed products.",
  email,
  resumeUrl,
};

export { socials } from "../shared";
