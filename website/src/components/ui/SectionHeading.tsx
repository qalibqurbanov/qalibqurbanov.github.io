import type { ReactNode } from "react";

import { Reveal } from "@/components/ui/Reveal";

interface SectionProps {
  /** Id of the section; the menu links to it. */
  id: string;
  /** The name of the section. It is not drawn on the page (the menu already says where you are), but screen readers get it as the heading. */
  title: string;
  children: ReactNode;
}

/** The frame every page after the first shares: the content in the page's column, under a heading only
 * a screen reader sees. */
export function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="px-5 pt-8 sm:px-6 lg:px-10 lg:pt-16 xl:px-14">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <h2 className="sr-only">{title}</h2>
        </Reveal>
        {children}
      </div>
    </section>
  );
}
