import type { SocialLinks } from "@/types/content";

// Contact info and external profile links don't vary by locale.
export const email = "qalibqurbanow@gmail.com";
export const resumeUrl = "/resume.pdf";

/** First month of the whole career ("YYYY-MM"). The "{years}" placeholder in
 * the About text is worked out from it, so it never needs hand-editing. */
export const careerStart = "2023-10";

export const socials: SocialLinks = {
  github: "https://github.com/qalibqurbanov",
  stackoverflow: "https://stackoverflow.com/users/13249741/qalibqurbanov",
  medium: "https://medium.com/@qalibqurbanov",
  linkedin: "https://www.linkedin.com/in/qalibqurbanov/",
  email: `mailto:${email}`,
  telegram: "https://t.me/inde_irae",
};
