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
import { About } from "@/features/home-sections/about/About";
import { Hero } from "@/features/home-sections/hero/Hero";
import { CommandPalette, Contact, ContactModal, CyberButterfly, Experience, Fireflies, ProjectDetail, Projects, ResumeViewer, Skills } from "@/app/sections";
import { useEasterEggs } from "@/hooks/useEasterEggs";
import { useHashSectionFocus } from "@/hooks/useHashSectionFocus";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { useMotion } from "@/motion/context";
import { LinksPage } from "@/features/pages-without-language/links/LinksPage";
import { NotFound } from "@/features/pages-without-language/not-found/NotFound";
import { useStandaloneRedirect } from "@/features/pages-without-language/useStandaloneRedirect";
import { useContent, useLocale } from "@/i18n/context";
import { isLinksPage, isNotFoundPage } from "@/lib/notFound";
import { Suspense } from "react";
import { ThemeScene } from "@/themes/shared/scene/ThemeScene";
import { ThemeCursor } from "@/themes/shared/cursor/ThemeCursor";
import { useStyle } from "@/themes/shared/style/context";

export function App() {
  const { projects, ui } = useContent();
  const { activeSlug, resumeOpen, closeProject } = useProjectRoute();
  const activeProject = activeSlug ? (projects.find((project) => project.slug === activeSlug) ?? null) : undefined;
  // The heavy decoration only runs at the full level; it is taken off the page as soon as the level drops.
  const { motion } = useMotion();
  const decorated = motion === "full";
  // The original style decorates the page with its own components; every other style has a scene.
  const original = useStyle().style === "cyber";
  const { locale } = useLocale();
  const notFound = isNotFoundPage();
  const linksPage = isLinksPage();
  useStandaloneRedirect(locale);
  useHashSectionFocus();
  useEasterEggs(ui.terminal.konami);

  return (
    <div className={notFound ? "nf-shell relative" : "relative min-h-screen"}>
      {original ? <AmbientBackground /> : <ThemeScene />}
      {decorated && original ? <CursorGlow /> : null}
      {decorated && original ? <CustomCursor /> : null}
      {!original && motion !== "off" ? <ThemeCursor /> : null}
      <OnDemand component={CommandPalette} event={OPEN_COMMAND_PALETTE_EVENT} shortcut={isPaletteShortcut} />
      <ContextMenu />
      <TooltipLayer />
      <OnDemand component={ContactModal} event={OPEN_CONTACT_EVENT} />

      <Navbar />
      <main>
        {linksPage ? (
          <LinksPage />
        ) : notFound ? (
          <NotFound />
        ) : (
          <>
            <Hero />
            <About />
            <Suspense fallback={null}>
              <Experience />
              <Projects />
              <Skills />
              <Contact />
            </Suspense>
          </>
        )}
      </main>
      <Footer />
      {notFound || linksPage ? null : <BackToTop />}
      <Suspense fallback={null}>
        {decorated && original ? <CyberButterfly /> : null}
        {decorated && original ? <Fireflies /> : null}

        {notFound || linksPage ? null : resumeOpen ? (
          <ResumeViewer onBack={closeProject} />
        ) : activeProject !== undefined ? (
          <ProjectDetail project={activeProject} onBack={closeProject} />
        ) : null}
      </Suspense>
    </div>
  );
}
