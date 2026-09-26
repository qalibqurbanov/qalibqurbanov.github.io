import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

import { ProjectCard } from "./ProjectCard";

export function Projects() {
  const { projects, ui } = useContent();

  return (
    <section id="projects" className="py-28">
      <Container>
        <SectionHeading index={ui.sections.projects.index} title={ui.sections.projects.title} />

        <div className="grid sm:grid-cols-2 gap-6">
          {projects.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} delayMs={index * 75} />
          ))}
        </div>
      </Container>
    </section>
  );
}
