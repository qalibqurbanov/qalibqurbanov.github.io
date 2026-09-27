import { Layout, Server, Smartphone, Wrench } from "lucide-react";
import type { ComponentType } from "react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";
import type { SkillCategory } from "@/types/content";

interface SkillGroupMeta {
  category: SkillCategory;
  icon: ComponentType<{ className?: string; size?: number }>;
}

const groups: SkillGroupMeta[] = [
  { category: "backend", icon: Server },
  { category: "frontend", icon: Layout },
  { category: "mobile", icon: Smartphone },
  { category: "tools", icon: Wrench },
];

export function Skills() {
  const { skills, ui } = useContent();

  return (
    <section id="skills" className="py-28">
      <Container>
        <SectionHeading index={ui.sections.skills.index} title={ui.sections.skills.title} />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {groups.map(({ category, icon: Icon }, index) => (
            <Reveal
              key={category}
              delayMs={index * 75}
              className="card-surface p-6 rounded-xl"
            >
              <div
                className="inline-block mb-4 animate-float-slow"
                style={{ animationDelay: `${index * 400}ms` }}
              >
                <Icon className="text-accent" size={24} />
              </div>
              <h3 className="font-semibold text-text mb-4">{ui.skillGroups[category]}</h3>
              <ul className="space-y-2">
                {skills[category].map((skill) => (
                  <li key={skill} className="font-mono text-sm text-muted flex items-center gap-2">
                    <span className="text-accent">▹</span> {skill}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        <SectionClosing />
      </Container>
    </section>
  );
}
