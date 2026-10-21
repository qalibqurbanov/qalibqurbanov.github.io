import { ContactModal } from "@/components/contact/ContactModal";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { BackToTop } from "@/components/ui/BackToTop";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { TooltipLayer } from "@/components/ui/TooltipLayer";
import { CursorGlow } from "@/components/ui/CursorGlow";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { About } from "@/features/about/About";
// import { Blog } from "@/features/blog/Blog";
import { Hero } from "@/features/hero/Hero";
import { Contact, CyberButterfly, Experience, Fireflies, ProjectDetail, Projects, ResumeViewer, Skills } from "@/app/sections";
import { useEasterEggs } from "@/hooks/useEasterEggs";
import { useHashSectionFocus } from "@/hooks/useHashSectionFocus";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";
import { Suspense } from "react";

export function App() {
  const { projects, ui } = useContent();
  const { activeSlug, resumeOpen, closeProject } = useProjectRoute();
  const activeProject = activeSlug ? (projects.find((project) => project.slug === activeSlug) ?? null) : undefined;
  useHashSectionFocus();
  useEasterEggs(ui.terminal.konami);

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />
      <CursorGlow />
      <CustomCursor />
      <CommandPalette />
      <ContextMenu />
      <TooltipLayer />
      <ContactModal />

      <Navbar />
      <main>
        <Hero />
        <About />
        <Suspense fallback={null}>
          <Experience />
          <Projects />
          <Skills />
          {/* <Blog /> */}
          <Contact />
        </Suspense>
      </main>
      <Footer />
      <BackToTop />
      <Suspense fallback={null}>
        <CyberButterfly />
        <Fireflies />

        {resumeOpen ? (
          <ResumeViewer onBack={closeProject} />
        ) : activeProject !== undefined ? (
          <ProjectDetail project={activeProject} onBack={closeProject} />
        ) : null}
      </Suspense>
    </div>
  );
}
