import { ContactModal } from "@/components/contact/ContactModal";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { BackToTop } from "@/components/ui/BackToTop";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { CursorGlow } from "@/components/ui/CursorGlow";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { About } from "@/features/about/About";
// import { Blog } from "@/features/blog/Blog";
import { Contact } from "@/features/contact/Contact";
import { Experience } from "@/features/experience/Experience";
import { Hero } from "@/features/hero/Hero";
import { ProjectDetail } from "@/features/projects/ProjectDetail";
import { Projects } from "@/features/projects/Projects";
import { ResumeViewer } from "@/features/resume/ResumeViewer";
import { Skills } from "@/features/skills/Skills";
import { useEasterEggs } from "@/hooks/useEasterEggs";
import { useHashSectionFocus } from "@/hooks/useHashSectionFocus";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";

export function App() {
  const { projects, ui } = useContent();
  const { activeSlug, resumeOpen, closeProject } = useProjectRoute();
  const activeProject = activeSlug ? (projects.find((project) => project.slug === activeSlug) ?? null) : undefined;
  useHashSectionFocus();
  useEasterEggs(ui.terminal.konami);

  return (
    <div className="min-h-screen">
      <AmbientBackground />
      <CursorGlow />
      <CustomCursor />
      <CommandPalette />
      <ContextMenu />
      <ContactModal />

      <Navbar />
      <main>
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
        {/* <Blog /> */}
        <Contact />
      </main>
      <Footer />
      <BackToTop />

      {resumeOpen ? (
        <ResumeViewer onBack={closeProject} />
      ) : activeProject !== undefined ? (
        <ProjectDetail project={activeProject} onBack={closeProject} />
      ) : null}
    </div>
  );
}
