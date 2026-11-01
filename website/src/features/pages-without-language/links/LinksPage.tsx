import { Check, Copy, FileText, Mail, Send } from "lucide-react";
import type { ReactNode } from "react";

import avatarUrl from "@/assets/avatar.webp";
import { GithubIcon, LinkedinIcon, MediumIcon, StackOverflowIcon, TelegramIcon } from "@/components/icons/BrandIcons";
import { openContactModal } from "@/components/contact/openContact";
import { useContent, useLocale } from "@/i18n/context";
import { pathForLocale } from "@/i18n/locale";
import { useCopy } from "@/lib/clipboard";

interface LinkEntry {
  /** The short address /slug that the copy button puts on the clipboard. */
  slug: string;
  icon: ReactNode;
  label: string;
  detail: string;
  href: string;
  /** Opens the contact form on this page instead of following `href`. */
  contactForm?: boolean;
}

/** One row: the link itself, and a button that copies its short address. */
function LinkRow({ entry, copyLabel, copiedLabel }: { entry: LinkEntry; copyLabel: string; copiedLabel: string }) {
  const short = `${window.location.origin}/${entry.slug}`;
  const { copied, copy } = useCopy(short);
  const external = /^https?:/.test(entry.href);

  return (
    <li className="card-surface flex items-stretch rounded-xl">
      <a
        href={entry.href}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        onClick={
          entry.contactForm
            ? (event) => {
                event.preventDefault();
                openContactModal();
              }
            : undefined
        }
        className="tap flex min-w-0 flex-1 items-center gap-3.5 rounded-l-xl px-4 py-3.5 text-text transition hover:text-accent"
      >
        <span className="shrink-0 text-accent">{entry.icon}</span>
        <span className="flex min-w-0 flex-col">
          <span className="font-display font-semibold">{entry.label}</span>
          <span className="truncate font-mono text-xs text-muted">{entry.detail}</span>
        </span>
      </a>
      <button
        type="button"
        onClick={copy}
        title={copyLabel}
        aria-label={`${copyLabel}: /${entry.slug}`}
        className={`mx-2 inline-flex w-28 shrink-0 items-center justify-center gap-1.5 self-center rounded-md border px-2 py-2 font-mono text-xs transition ${
          copied ? "border-syn-number text-syn-number" : "border-border text-muted hover:border-accent hover:text-text"
        }`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span aria-live="polite">{copied ? copiedLabel : `/${entry.slug}`}</span>
      </button>
    </li>
  );
}

/** The /links page: who I am in one line, then every way to find or reach me. */
export function LinksPage() {
  const { profile, socials, ui } = useContent();
  const { locale } = useLocale();
  const home = pathForLocale(locale);
  const { links } = ui;

  const entries: LinkEntry[] = [
    { slug: "cv", icon: <FileText size={22} />, label: links.resume, detail: "PDF", href: profile.resumeUrl },
    { slug: "contact", icon: <Send size={22} />, label: links.contact, detail: ui.contact.send, href: `${home}#contact`, contactForm: true },
    { slug: "mail", icon: <Mail size={22} />, label: links.email, detail: profile.email, href: socials.email },
    { slug: "github", icon: <GithubIcon size={22} />, label: "GitHub", detail: "github.com/qalibqurbanov", href: socials.github },
    { slug: "linkedin", icon: <LinkedinIcon size={22} />, label: "LinkedIn", detail: "linkedin.com/in/qalibqurbanov", href: socials.linkedin },
    ...(socials.telegram ? [{ slug: "telegram", icon: <TelegramIcon size={22} />, label: "Telegram", detail: "t.me/inde_irae", href: socials.telegram }] : []),
    ...(socials.medium ? [{ slug: "medium", icon: <MediumIcon size={22} />, label: "Medium", detail: "medium.com/@qalibqurbanov", href: socials.medium }] : []),
    ...(socials.stackoverflow
      ? [{ slug: "stackoverflow", icon: <StackOverflowIcon size={22} />, label: "Stack Overflow", detail: "stackoverflow.com/users/13249741", href: socials.stackoverflow }]
      : []),
  ];

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center px-4 pb-16 pt-28 sm:px-6">
      <img src={avatarUrl} alt="" width={96} height={96} className="h-24 w-24 rounded-full border border-border object-cover" />
      <h1 className="mt-5 text-center font-display text-3xl font-bold text-text">{profile.name}</h1>
      <p className="mt-1 text-center font-mono text-sm text-accent">{profile.role}</p>
      <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-muted">{links.intro}</p>

      <ul className="mt-8 flex w-full flex-col gap-3">
        {entries.map((entry) => (
          <LinkRow key={entry.slug} entry={entry} copyLabel={links.copyShort} copiedLabel={links.copied} />
        ))}
      </ul>

      <a href={home} className="mt-8 font-mono text-xs text-muted transition hover:text-accent">
        {links.back} →
      </a>
    </section>
  );
}
