import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";

import { renderEmphasis } from "@/components/ui/emphasis";
import { Reveal } from "@/components/ui/Reveal";
import { useContent } from "@/i18n/context";

/** "3+ years" is shown as a big "3+" with "years" under it; a value that does not start with a number stays whole. */
function splitFigure(value: string): { figure: string; unit: string } {
  const match = /^(\d+\+?)\s*(.*)$/.exec(value);
  return match ? { figure: match[1], unit: match[2] } : { figure: value, unit: "" };
}

/** Splits at the first separator: "Baku, Azerbaijan" into "Baku" and "Azerbaijan". */
function splitAt(value: string, separator: string): [string, string] {
  const at = value.indexOf(separator);
  return at === -1 ? [value, ""] : [value.slice(0, at), value.slice(at + separator.length)];
}

/** One figure: the label above, the main word big and filled with a slowly sliding cyan-to-magenta colour, the
 * rest under it. Each figure's colour is a little out of step with the others. */
function Figure({ index, label, figure, small, stack, children }: { index: number; label: string; figure: string; small?: boolean; stack?: boolean; children?: ReactNode }) {
  return (
    <div className="stat rise" style={{ "--i": index } as CSSProperties}>
      <dt className="label">
        <span className="mr-2 text-[0.8125rem] text-accent-2" aria-hidden="true">
          ✦
        </span>
        {label}
      </dt>
      <dd className={`stat-figure fig-fill ${small ? "stat-figure-sm" : ""}`} style={{ "--i": index } as CSSProperties}>
        {stack
          ? figure.split(" ").map((word, i) => (
              <span key={i} className="block">
                {word}
              </span>
            ))
          : figure}
      </dd>
      {children && <dd className="mt-1 text-sm text-muted">{children}</dd>}
    </div>
  );
}

/** A band of words that drifts slowly sideways and starts again without a seam; it eases down to a gentler pace
 * (never a stop) while pointed at, and back up when the pointer leaves. A big item
 * is a filled-on-hover figure; a small one is plain mono text that lights up. */
function Band({ label, items, speed, reverse = false, eachLabel = false }: { label: string; items: { text: string; big?: boolean }[]; speed: number; reverse?: boolean; eachLabel?: boolean }) {
  const band = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  // The pace is the animation's playback rate, eased towards its target a little each frame, so a hover
  // slows the band down smoothly instead of jerking it.
  useEffect(() => {
    const el = band.current;
    const run = track.current?.getAnimations()[0];
    if (!el || !run) return;
    let target = 1;
    let raf = 0;
    let last = 0;
    // Time-based, so the change takes the same moment on every screen: about a third of a second.
    const step = (now: number) => {
      const dt = last ? Math.min(now - last, 100) : 16;
      last = now;
      const next = target + (run.playbackRate - target) * Math.exp(-dt / 110);
      run.playbackRate = Math.abs(target - next) < 0.005 ? target : next;
      if (run.playbackRate === target) {
        raf = 0;
        last = 0;
      } else {
        raf = requestAnimationFrame(step);
      }
    };
    const go = (rate: number) => {
      target = rate;
      if (!raf) raf = requestAnimationFrame(step);
    };
    const slow = () => go(0.45);
    const normal = () => go(1);
    el.addEventListener("pointerenter", slow);
    el.addEventListener("pointerleave", normal);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", slow);
      el.removeEventListener("pointerleave", normal);
    };
  }, []);

  return (
    <div ref={band} className="home-band">
      <div ref={track} className={`home-band-track ${reverse ? "is-reverse" : ""}`} style={{ "--speed": `${speed}s` } as CSSProperties}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="home-band-set" aria-hidden={copy === 1 || undefined}>
            {!eachLabel && <li className="home-band-label label">{label}</li>}
            {items.map((item) => (
              <li key={item.text} className="home-band-item">
                {eachLabel && <span className="home-band-label label !p-0">{label}</span>}
                {item.big ? <span className="stat-figure fig-fill stat-figure-sm">{item.text}</span> : <span className="home-band-tag">{item.text}</span>}
                <span className="home-band-star" aria-hidden="true">
                  ✦
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** The one page about me: what I do in a line, three big figures, and below them the four facts that matter
 * first (what I do, where I am, where I work now, what I am open to) as a second row of
 * figures in the same style. The story itself (three chapters) is on the About page. */
export function Home() {
  const { about, experience, ui } = useContent();
  const [taglineBefore, taglineAfter] = ui.hero.tagline.split("{highlight}");
  const [focus, years, projects, based, open] = about.highlights;
  const job = experience.find((item) => item.current) ?? experience[0];

  const figures = [
    { label: `${years.label} (${splitFigure(years.value).unit})`, figure: splitFigure(years.value).figure, unit: "" },
    { label: projects.label, ...splitFigure(projects.value) },
    { label: ui.home.ecosystem, figure: ".NET", unit: "" },
  ];
  const [city, country] = splitAt(based.value, ", ");

  return (
    <section id="home" className="px-5 pt-8 sm:px-6 lg:px-10 lg:pt-14 xl:px-14">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <h1 className="text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">
            {taglineBefore}
            <span className="text-accent">{ui.hero.highlightWord}</span>
            {taglineAfter}
          </h1>

          <p className="mt-5 text-base leading-relaxed text-muted">{renderEmphasis(ui.home.intro)}</p>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-b border-border pb-7">
            {figures.map((item, index) => (
              <Figure key={item.label} index={index} label={item.label} figure={item.figure}>
                {item.unit}
              </Figure>
            ))}
          </dl>

          <dl className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Same three equal columns as the row above, so the columns line up in every language. */}
            <Figure index={3} label={focus.label} figure={focus.value} small stack />
            <Figure index={4} label={based.label} figure={city} small>
              <span className="text-accent-2">{country}</span>
            </Figure>
            {job && (
              <Figure index={5} label={ui.experienceLabels.currentlyAt} figure={job.org} small>
                <span className="text-accent-2">{job.role}</span>
              </Figure>
            )}
          </dl>

          {/* Two slow bands, running opposite ways, that pause when pointed at: what I am open to (all kinds the same size,
              none above the others) and the stack of my current job. */}
          <div className="mt-8 space-y-3 border-t border-border pt-6">
            <Band label={open.label} eachLabel speed={30} items={ui.contact.openTo.map((kind) => ({ text: kind, big: true }))} />
            {job && <Band label={ui.experienceLabels.stack} eachLabel speed={38} reverse items={job.tags.map((tag) => ({ text: tag }))} />}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
