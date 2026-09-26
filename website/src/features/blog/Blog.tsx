import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent, useLocale } from "@/i18n/context";
import { getLocaleMeta } from "@/i18n/locale";
import { formatDate } from "@/lib/date";

export function Blog() {
  const { blogPosts, ui } = useContent();
  const { locale } = useLocale();
  const bcp47 = getLocaleMeta(locale).bcp47;

  return (
    <section id="blog" className="py-28">
      <Container>
        <SectionHeading index={ui.sections.blog.index} title={ui.sections.blog.title} />

        <div className="space-y-4">
          {blogPosts.map((post, index) => (
            <Reveal key={post.title} delayMs={index * 75}>
              <a
                href={post.url}
                target="_blank"
                rel="noreferrer"
                className="card-surface group flex items-start justify-between gap-6 p-6 rounded-xl"
              >
                <div>
                  <p className="font-mono text-xs text-accent mb-2">
                    {formatDate(post.date, bcp47)}
                  </p>
                  <h3 className="font-semibold text-text group-hover:text-accent transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted text-sm mt-2 leading-relaxed">{post.excerpt}</p>
                </div>
                <ArrowUpRight
                  className="text-muted group-hover:text-accent transition-colors shrink-0 mt-1"
                  size={20}
                />
              </a>
            </Reveal>
          ))}
        </div>

        <SectionClosing />
      </Container>
    </section>
  );
}
