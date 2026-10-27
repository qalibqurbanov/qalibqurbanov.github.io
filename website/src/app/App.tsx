import { isPaletteShortcut, OPEN_COMMAND_PALETTE_EVENT } from "@/components/command-palette/openPalette";
import { OPEN_CONTACT_EVENT } from "@/components/contact/openContact";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { BackToTop } from "@/components/ui/BackToTop";
import { OnDemand } from "@/components/ui/OnDemand";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { TooltipLayer } from "@/components/ui/TooltipLayer";
import { CursorGlow } from "@/components/ui/CursorGlow";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { About } from "@/features/about/About";
// import { Blog } from "@/features/blog/Blog";
import { Hero } from "@/features/hero/Hero";
import { CommandPalette, Contact, ContactModal, CyberButterfly, Experience, Fireflies, ProjectDetail, Projects, ResumeViewer, Skills } from "@/app/sections";
import { useEasterEggs } from "@/hooks/useEasterEggs";
import { useHashSectionFocus } from "@/hooks/useHashSectionFocus";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useMotion } from "@/motion/context";
import { NotFound } from "@/features/not-found/NotFound";
import { useNotFoundRedirect } from "@/hooks/useNotFoundRedirect";
import { useContent, useLocale } from "@/i18n/context";
import { isNotFoundPage } from "@/lib/notFound";
import { Suspense } from "react";

export function App() {
  const { projects, ui } = useContent();
  const { activeSlug, resumeOpen, closeProject } = useProjectRoute();
  const activeProject = activeSlug ? (projects.find((project) => project.slug === activeSlug) ?? null) : undefined;
  // The heavy decoration only runs at the full level; it is taken off the page as soon as the level drops.
  const decorated = useMotion().motion === "full";
  const { locale } = useLocale();
  const notFound = isNotFoundPage();
  useNotFoundRedirect(locale);
  useHashSectionFocus();
  useEasterEggs(ui.terminal.konami);

  return (
    <div className={notFound ? "nf-shell relative" : "relative min-h-screen"}>
      <AmbientBackground />
      {decorated ? <CursorGlow /> : null}
      {decorated ? <CustomCursor /> : null}
      <OnDemand component={CommandPalette} event={OPEN_COMMAND_PALETTE_EVENT} shortcut={isPaletteShortcut} />
      <ContextMenu />
      <TooltipLayer />
      <OnDemand component={ContactModal} event={OPEN_CONTACT_EVENT} />

      <Navbar />
      <main>
        {notFound ? (
          <NotFound />
        ) : (
          <>
            <Hero />
            <About />
            <Suspense fallback={null}>
              <Experience />
              <Projects />
              <Skills />
              {/* <Blog /> */}
              <Contact />
            </Suspense>
          </>
        )}
      </main>
      <Footer />
      {notFound ? null : <BackToTop />}
      <Suspense fallback={null}>
        {decorated ? <CyberButterfly /> : null}
        {decorated ? <Fireflies /> : null}

        {notFound ? null : resumeOpen ? (
          <ResumeViewer onBack={closeProject} />
        ) : activeProject !== undefined ? (
          <ProjectDetail project={activeProject} onBack={closeProject} />
        ) : null}
      </Suspense>
    </div>
  );
}
