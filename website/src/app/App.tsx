import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { BackToTop } from "@/components/ui/BackToTop";
import { About } from "@/features/about/About";
// import { Blog } from "@/features/blog/Blog";
import { Contact } from "@/features/contact/Contact";
import { Experience } from "@/features/experience/Experience";
import { Hero } from "@/features/hero/Hero";
import { ProjectDetail } from "@/features/projects/ProjectDetail";
import { Projects } from "@/features/projects/Projects";
import { Skills } from "@/features/skills/Skills";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useScrollbarActivity } from "@/hooks/useScrollPosition";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { useContent } from "@/i18n/context";

export function App() {
  useScrollbarActivity();
  useSmoothScroll();
  const { projects } = useContent();
  const { activeSlug, closeProject } = useProjectRoute();
  const activeProject = activeSlug ? (projects.find((project) => project.slug === activeSlug) ?? null) : undefined;

  return (
    <div className="min-h-screen">
      <AmbientBackground />
      <CommandPalette />

      {activeProject !== undefined ? (
        <ProjectDetail project={activeProject} onBack={closeProject} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
