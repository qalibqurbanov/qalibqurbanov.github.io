import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { useContent } from "@/i18n/context";

export function Contact() {
  const { profile, socials, ui } = useContent();

  return (
    <section id="contact" className="py-28">
      <Container className="max-w-2xl text-center">
        <Reveal>
          <p className="font-mono text-sm mb-4">
            <span className="text-muted">{"// "}</span>
            <span className="text-accent">{ui.sections.contact.index}</span>
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-6">{ui.contact.heading}</h2>
          <p className="text-muted leading-relaxed mb-10">{ui.contact.body}</p>
          <a
            href={socials.email}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-md border border-accent text-accent font-mono text-sm hover:bg-accent/10 transition"
          >
            <span className="text-muted">$</span> {ui.contact.ctaPrefix} {profile.email}
          </a>
        </Reveal>
      </Container>
    </section>
  );
}
