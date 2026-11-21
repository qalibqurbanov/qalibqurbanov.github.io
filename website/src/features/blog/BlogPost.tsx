import { ArrowLeft, ArrowRight } from "lucide-react";

import { CodeBlock } from "@/components/ui/CodeBlock";
import { Panel } from "@/components/ui/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { ViewModal } from "@/components/ui/ViewModal";
import { blogHref } from "@/hooks/useProjectRoute";
import { useContent, useLocale } from "@/i18n/context";
import { getLocaleMeta } from "@/i18n/locale";
import { formatDate } from "@/lib/date";
import type { BlogPost as Post } from "@/types/content";

interface BlogPostProps {
  post: Post | null;
  onBack: () => void;
}

const STEP = "group flex min-w-0 items-center gap-3 text-left transition-colors hover:text-accent";

/** An article's reading page: a comfortable column with its date, title, introduction and code, and links to the
 * previous and next article. Readability comes before compactness here. */
export function BlogPost({ post, onBack }: BlogPostProps) {
  const { blogPosts, ui } = useContent();
  const { locale } = useLocale();
  const t = ui.blogList;

  const index = post ? blogPosts.findIndex((item) => item.slug === post.slug) : -1;
  const count = blogPosts.length;
  const prev = count > 1 && index !== -1 ? blogPosts[(index - 1 + count) % count] : null;
  const next = count > 1 && index !== -1 ? blogPosts[(index + 1) % count] : null;

  return (
    <ViewModal title={post?.title ?? t.notFoundTitle} widthClass="max-w-3xl" onClose={onBack}>
      {(close) => (
        <main className="min-h-0 flex-1">
          {!post ? (
            <div className="py-24 text-center">
              <h1 className="text-2xl font-semibold">{t.notFoundTitle}</h1>
              <p className="mt-3 text-muted">{t.notFoundBody}</p>
              <button type="button" onClick={close} className="btn-solid mt-8 inline-flex cursor-pointer items-center px-6 py-3 text-sm font-medium">
                {t.backToWriting}
              </button>
            </div>
          ) : (
            // Keyed by article, so stepping to the next one plays the entrance again.
            <Reveal key={post.slug} className="flex h-full min-h-0 flex-col">
              <Panel title={t.backToWriting} glass className="flex min-h-0 flex-1 flex-col" onClose={close}>
                <article className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-10 sm:px-12 sm:py-14">
                  <p className="text-sm text-muted">
                    {t.published} <time dateTime={post.date}>{formatDate(post.date, getLocaleMeta(locale).bcp47)}</time>
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
                  <p className="mt-6 text-lg leading-relaxed text-muted">{post.excerpt}</p>
                  {post.codeSnippet && (
                    <div className="mt-10">
                      <CodeBlock filename={post.codeSnippet.filename} code={post.codeSnippet.code} />
                    </div>
                  )}
                </article>

                {prev && next && (
                  <nav aria-label={t.backToWriting} className="grid shrink-0 grid-cols-2 gap-4 border-t border-border bg-surface-2/60 px-5 py-3 text-sm text-muted">
                    <a href={blogHref(prev.slug)} className={`${STEP} justify-self-start`} aria-label={`${t.prev}: ${prev.title}`}>
                      <ArrowLeft size={15} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
                      <span className="min-w-0">
                        <span className="block text-xs">{t.prev}</span>
                        <span className="block truncate text-text">{prev.title}</span>
                      </span>
                    </a>
                    <a href={blogHref(next.slug)} className={`${STEP} justify-self-end text-right`} aria-label={`${t.next}: ${next.title}`}>
                      <span className="min-w-0">
                        <span className="block text-xs">{t.next}</span>
                        <span className="block truncate text-text">{next.title}</span>
                      </span>
                      <ArrowRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  </nav>
                )}
              </Panel>
            </Reveal>
          )}
        </main>
      )}
    </ViewModal>
  );
}
