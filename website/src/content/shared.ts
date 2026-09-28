import type { SocialLinks } from "@/types/content";

// Contact info and external profile links don't vary by locale — defined
// once here instead of copy-pasted into every locale's profile.ts, so
// updating a handle or the email address can't drift out of sync between
// languages the way the name once did.
export const email = "qalibqurbanow@gmail.com";
export const resumeUrl = "/resume.pdf";

export const socials: SocialLinks = {
  github: "https://github.com/qalibqurbanov",
  stackoverflow: "https://stackoverflow.com/users/13249741/qalibqurbanov",
  medium: "https://medium.com/@qalibqurbanov",
  linkedin: "https://www.linkedin.com/in/qalibqurbanov/",
  email: `mailto:${email}`,
  telegram: "https://t.me/inde_irae",
};
