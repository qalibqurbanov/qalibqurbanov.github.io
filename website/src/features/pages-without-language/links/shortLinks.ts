// Short addresses on this site (qalibqurbanov.github.io/github, /cv, ...). Each one is built into a small
// page that sends the visitor on (see config/localized-html.ts), and the /links page offers a button
// that copies them. Plain data with no imports, so the build script can read it too.

export const email = "qalibqurbanow@gmail.com";

/** Short address -> where it leads: places outside this site, and the resume file (the same
 * PDF in every language, so /cv and /resume open it directly and need no language). */
export const externalLinks = {
  github: "https://github.com/qalibqurbanov",
  linkedin: "https://www.linkedin.com/in/qalibqurbanov/",
  stackoverflow: "https://stackoverflow.com/users/13249741/qalibqurbanov",
  medium: "https://medium.com/@qalibqurbanov",
  telegram: "https://t.me/inde_irae",
  mail: `mailto:${email}`,
  cv: "/resume.pdf",
  resume: "/resume.pdf",
} as const;

/** Short address -> where it leads inside this site. "{lang}" becomes the visitor's language
 * (the one they picked on the site before, else their browser's, else English). */
export const siteLinks = {
  contact: "/{lang}/#contact",
} as const;
