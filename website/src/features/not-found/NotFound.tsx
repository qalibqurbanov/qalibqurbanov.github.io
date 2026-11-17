import { useEffect } from "react";

import { useContent, useLocale } from "@/i18n/context";
import { pathForLocale } from "@/i18n/locale";
import { dismissNotFound, missingPath } from "@/lib/notFound";

/** The 404 view: it takes the place of the page in the content area, with the sidebar still beside it.
 * It names the address that was not found and gives way to the site on any move to a section. */
export function NotFound() {
  const { ui } = useContent();
  const { locale } = useLocale();
  const { eyebrow, title, message, back, home } = ui.notFound;
  const [beforePath, afterPath = ""] = message.split("{path}");
  const [beforeHome, afterHome = ""] = back.split("{home}");
  const homePath = pathForLocale(locale);

  useEffect(() => {
    const dismiss = () => dismissNotFound(pathForLocale(locale));
    window.addEventListener("hashchange", dismiss);
    return () => window.removeEventListener("hashchange", dismiss);
  }, [locale]);

  return (
    <section className="nf" aria-labelledby="nf-title">
      <p className="nf-eyebrow">{eyebrow}</p>
      <div className="nf-code" aria-hidden="true">
        404
      </div>
      <h1 id="nf-title" className="nf-title">
        {title}
      </h1>
      <p className="nf-text">
        {beforePath}
        <span className="nf-path">{missingPath}</span>
        {afterPath}
      </p>
      <p className="nf-back">
        {beforeHome}
        <a href={homePath} onClick={(event) => (event.preventDefault(), dismissNotFound(homePath))}>
          {home}
        </a>
        {afterHome}
      </p>
    </section>
  );
}
