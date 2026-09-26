import type { SkillGroups } from "@/types/content";

// Tech/tool names are proper nouns and intentionally stay the same across locales.
export const skills: SkillGroups = {
  backend: ["Node.js", "Express", "PostgreSQL", "MongoDB", "REST APIs", "Docker"],
  frontend: ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML/CSS"],
  mobile: ["React Native", "Flutter", "Android (Kotlin)", "iOS (Swift)"],
  tools: ["Git & GitHub", "CI/CD", "Figma", "Linux"],
};
