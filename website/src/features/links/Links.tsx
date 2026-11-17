import { ArrowUpRight, Check, FileText, Link2, Mail, Send } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { openContactModal } from "@/components/contact/openContact";
import { useCopy } from "@/features/contact/clipboard";
import { GithubIcon, LinkedinIcon, MediumIcon, StackOverflowIcon, TelegramIcon } from "@/components/icons/BrandIcons";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/SectionHeading";
import { resumeHref } from "@/hooks/useProjectRoute";
import { useContent } from "@/i18n/context";

type Icon = ComponentType<{ size?: number; className?: string }>;

interface Row {
  label: string;
  /** What sits at the right: the address the link goes to. */
  hint?: string;
  Icon: Icon;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  /** What the copy button puts on the clipboard; no button when absent. */
  copy?: string;
}

/** The short address of a profile on this site (/github/ and so on), which sends the visitor on to it. */
const shortLink = (name: string) => `${window.location.origin}/${name}/`;

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
};

/** A small button that puts `text` on the clipboard and shows a check for a moment. */
function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? done : label}
      title={copied ? done : label}
      className={`flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors duration-200 hover:text-accent ${copied ? "text-accent" : "text-muted"}`}
    >
      {copied ? <Check size={14} /> : <Link2 size={14} />}
    </button>
  );
}

/** `compact` sets the rows in two columns, shorter and smaller: for a list of places with nothing to say about each. */
function Group({ title, rows, start, compact = false }: { title: string; rows: Row[]; start: number; compact?: boolean }): ReactNode {
  const { ui } = useContent();
  return (
    <Reveal className="mt-9 first:mt-7">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{title}</h3>
      <ul className={`mt-3 border-t border-border ${compact ? "grid sm:grid-cols-2 sm:gap-x-8" : ""}`}>
        {rows.map(({ label, hint, Icon, href, onClick, external, copy }, index) => {
          const inner = (
            <>
              <Icon size={compact ? 15 : 17} className="text-accent transition-transform duration-300 group-hover:scale-110" />
              <span className={`flex-1 font-medium ${compact ? "text-sm" : "text-[15px]"}`}>{label}</span>
              {hint && !compact && <span className="hidden font-mono text-xs text-muted sm:inline">{hint}</span>}
              <ArrowUpRight size={compact ? 13 : 15} className="text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
            </>
          );
          const cls = `group flex min-w-0 flex-1 items-center text-left transition-colors duration-200 hover:text-accent ${compact ? "gap-3 py-2.5" : "gap-4 py-3.5"}`;
          return (
            <li key={label} className="rise flex items-center gap-1 border-b border-border" style={{ "--i": start + index } as React.CSSProperties}>
              {href ? (
                <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
                  {inner}
                </a>
              ) : (
                <button type="button" onClick={onClick} className={`${cls} cursor-pointer`}>
                  {inner}
                </button>
              )}
              {copy && <CopyButton text={copy} label={ui.projectDetail.copyLink} done={ui.projectDetail.linkCopied} />}
            </li>
          );
        })}
      </ul>
    </Reveal>
  );
}

/** The Links page, opened from the picture in the menu: every place I can be found, in one list. */
export function Links() {
  const { profile, socials, ui } = useContent();
  const hasResume = profile.resumeUrl && profile.resumeUrl !== "#";

  const profiles: Row[] = [
    { label: "GitHub", Icon: GithubIcon, href: socials.github, hint: hostOf(socials.github), external: true, copy: shortLink("github") },
    { label: "LinkedIn", Icon: LinkedinIcon, href: socials.linkedin, hint: hostOf(socials.linkedin), external: true, copy: shortLink("linkedin") },
  ];
  if (socials.stackoverflow) profiles.push({ label: "Stack Overflow", Icon: StackOverflowIcon, href: socials.stackoverflow, hint: hostOf(socials.stackoverflow), external: true, copy: shortLink("stackoverflow") });
  if (socials.medium) profiles.push({ label: "Medium", Icon: MediumIcon, href: socials.medium, hint: hostOf(socials.medium), external: true, copy: shortLink("medium") });
  if (socials.telegram) profiles.push({ label: "Telegram", Icon: TelegramIcon, href: socials.telegram, hint: hostOf(socials.telegram), external: true, copy: shortLink("telegram") });

  const contact: Row[] = [
    { label: profile.email, Icon: Mail, href: `mailto:${profile.email}`, copy: profile.email },
    { label: ui.labels.message, Icon: Send, onClick: openContactModal },
  ];

  return (
    <Section id="links" title={ui.links.title}>
      <Reveal>
        <h1 className="text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">{ui.links.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">{ui.links.intro}</p>
      </Reveal>
      {/* The resume comes first and is set larger than the rest, in the same hairline-row style, with
          more room around it: apart from the lists, not boxed off from them. */}
      {hasResume && (
        <Reveal className="mt-8">
          <a
            href={resumeHref("links")}
            className="group flex items-center gap-4 border-y border-border py-5 transition-colors duration-200 hover:text-accent"
          >
            <FileText size={22} className="text-accent transition-transform duration-300 group-hover:scale-110" />
            <span className="flex-1 text-xl font-semibold tracking-tight">{ui.labels.resume}</span>
            <span className="hidden font-mono text-xs text-muted sm:inline">PDF</span>
            <ArrowUpRight size={18} className="text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
          </a>
        </Reveal>
      )}
      <Group title={ui.links.profiles} rows={profiles} start={0} compact />
      <Group title={ui.links.contact} rows={contact} start={profiles.length} compact />
    </Section>
  );
}
