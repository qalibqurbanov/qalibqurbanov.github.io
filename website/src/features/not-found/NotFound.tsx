import { useEffect } from "react";

import { useContent, useLocale } from "@/i18n/context";
import { pathForLocale } from "@/i18n/locale";
import { signalLoss } from "@/lib/effects";
import { useMotion } from "@/motion/context";

/** What the 404 page shows in place of the sections: the same site around it (navbar, footer,
 * background, effects), with a message that names the address that was not found. */
export function NotFound() {
  const { ui } = useContent();
  const { locale } = useLocale();
  const { motion } = useMotion();
  const { eyebrow, message, back, home } = ui.notFound;
  const [beforePath, afterPath = ""] = message.split("{path}");
  const [beforeHome, afterHome = ""] = back.split("{home}");

  // The page keeps losing its signal, at random moments, for as long as it is open.
  useEffect(() => {
    if (motion !== "full") return;
    let stop = () => {};
    const start = window.setTimeout(
      () => {
        stop = signalLoss(Infinity);
      },
      400 + Math.random() * 2600,
    );
    return () => {
      window.clearTimeout(start);
      stop();
    };
  }, [motion]);

  return (
    <section className="nf">
      <p className="nf-eyebrow">{eyebrow}</p>
      <div className="nf-code" data-text="404" aria-hidden="true">
        404
      </div>
      <h1 className="nf-title">
        {beforePath}
        <span>{window.location.pathname}</span>
        {afterPath}
      </h1>
      <p className="nf-back">
        {beforeHome}
        <a href={pathForLocale(locale)}>{home}</a>
        {afterHome}
      </p>
    </section>
  );
}
