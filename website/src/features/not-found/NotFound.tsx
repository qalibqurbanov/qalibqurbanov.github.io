import { useEffect } from "react";

import { Container } from "@/components/ui/Container";
import { GlitchText } from "@/components/ui/GlitchText";
import { Reveal } from "@/components/ui/Reveal";
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
  const { eyebrow, message, back, home } = ui.notFound;
  const [beforePath, afterPath = ""] = message.split("{path}");
  const [beforeHome, afterHome = ""] = back.split("{home}");

  return (
    <section className="flex min-h-[calc(100vh-3rem)] items-center py-28">
      <Container className="w-full text-center">
        <Reveal>
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-accent">
            {eyebrow}
          </p>
          <div
            aria-hidden="true"
            className="font-display text-[clamp(96px,28vw,168px)] font-extrabold leading-none text-gradient"
          >
            <GlitchText text="404" idle />
          </div>
          <h1 className="mx-auto mt-6 max-w-2xl font-display text-lg font-semibold leading-relaxed text-text sm:text-xl">
            {beforePath}
            <span className="break-all font-mono text-accent">
              {window.location.pathname}
            </span>
            {afterPath}
          </h1>
          <p className="mt-4 text-muted">
            {beforeHome}
            <a
              href={pathForLocale(locale)}
              className="text-accent underline-offset-4 hover:underline"
            >
              {home}
            </a>
            {afterHome}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
