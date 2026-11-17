import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/SectionHeading";
import { blogHref } from "@/hooks/useProjectRoute";
import { useContent, useLocale } from "@/i18n/context";
import { getLocaleMeta } from "@/i18n/locale";
import { formatDate } from "@/lib/date";

/** The writing list: one ruled card per article with its date, title and excerpt. Each opens its own reading page. */
export function Blog() {
  const { blogPosts, ui } = useContent();
  const { locale } = useLocale();
  const bcp47 = getLocaleMeta(locale).bcp47;

  return (
    <Section id="blog" title={ui.sections.blog.title}>
      <ol className="space-y-3">
        {blogPosts.map((post, index) => (
          <li key={post.slug}>
            <Reveal delayMs={index * 60} className="panel group relative p-5">
              <time dateTime={post.date} className="font-mono text-xs text-muted">
                {formatDate(post.date, bcp47)}
              </time>
              <h3 className="mt-1.5 text-base font-semibold leading-snug">
                <a href={blogHref(post.slug)} className="entry-title transition-colors after:absolute after:inset-0 after:content-['']">
                  {post.title}
                </a>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent">
                {ui.blogList.readArticle}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
