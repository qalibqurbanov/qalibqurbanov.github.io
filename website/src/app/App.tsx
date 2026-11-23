import { OPEN_CONTACT_EVENT } from "@/components/contact/openContact";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BackToTop } from "@/components/ui/BackToTop";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { TooltipLayer } from "@/components/ui/TooltipLayer";
import { OnDemand } from "@/components/ui/OnDemand";
import { About } from "@/features/about/About";
import { Home } from "@/features/home/Home";
import { Blog, BlogPost, Contact, ContactModal, Experience, Links, ProjectDetail, Projects, ResumeViewer, Skills } from "@/app/sections";
import { useHashSectionFocus } from "@/hooks/useHashSectionFocus";
import { usePageSwitch } from "@/hooks/usePage";
import { useProjectRoute } from "@/hooks/useProjectRoute";
import { NotFound } from "@/features/not-found/NotFound";
import { useContent } from "@/i18n/context";
import { useNotFound } from "@/lib/notFound";
import type { CSSProperties } from "react";
import { Suspense, useEffect } from "react";

export function App() {
  const { projects, blogPosts } = useContent();
  const { activeSlug, postSlug, resumeOpen, closeProject } = useProjectRoute();
  const activeProject = activeSlug ? (projects.find((project) => project.slug === activeSlug) ?? null) : undefined;
  const activePost = postSlug ? (blogPosts.find((post) => post.slug === postSlug) ?? null) : undefined;
  const notFound = useNotFound();
  const { profile, ui } = useContent();
  const { shown: page, leaving, direction } = usePageSwitch();
  useHashSectionFocus();

  // The tab's title names what is open: the site, or the project or article over it.
  const openTitle = activeProject?.title ?? activePost?.title;
  useEffect(() => {
    document.title = notFound
      ? `404 | ${ui.notFound.title}`
      : openTitle
        ? `${openTitle} | ${profile.name}`
        : `${profile.name} | ${profile.role}`;
  }, [notFound, openTitle, profile, ui.notFound.title]);

  return (
    <div className="relative min-h-screen">
      <OnDemand component={ContactModal} event={OPEN_CONTACT_EVENT} />

      <CustomCursor />
      <TooltipLayer />
      <ContextMenu />
      <Sidebar />
      <Navbar />
      <div className="shell-main">
      <main className="min-h-dvh pb-14 pt-14 lg:pt-0">
        {notFound ? (
          <NotFound />
        ) : (
          <Suspense fallback={null}>
            <div key={page} className={leaving ? "page-leave" : "page-enter"} style={{ "--dy": direction } as CSSProperties}>
            {page === "home" && <Home />}
            {page === "about" && <About />}
            {page === "experience" && <Experience />}
            {page === "projects" && <Projects />}
            {page === "skills" && <Skills />}
            {page === "blog" && <Blog />}
            {page === "contact" && <Contact />}
            {page === "links" && <Links />}
            </div>
          </Suspense>

        )}
      </main>
      </div>
      <BackToTop />
      <Suspense fallback={null}>
        {resumeOpen ? (
          <ResumeViewer onBack={closeProject} />
        ) : activeProject !== undefined ? (
          <ProjectDetail project={activeProject} onBack={closeProject} />
        ) : activePost !== undefined ? (
          <BlogPost post={activePost} onBack={closeProject} />
        ) : null}
      </Suspense>
    </div>
  );
}
