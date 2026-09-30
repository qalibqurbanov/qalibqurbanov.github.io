import { openContactModal } from "@/components/contact/ContactModal";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionClosing } from "@/components/ui/SectionClosing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useContent } from "@/i18n/context";

export function Contact() {
  const { profile, ui } = useContent();

  return (
    <section id="contact" className="py-28">
      <Container>
        <SectionHeading index={ui.sections.contact.index} title={ui.sections.contact.title} />

        <Reveal className="max-w-2xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-text mb-6">{ui.contact.heading}</h3>
          <p className="text-muted leading-relaxed mb-10">{ui.contact.body}</p>
          <button
            type="button"
            onClick={openContactModal}
            className="btn-pulse inline-flex items-center gap-2 px-8 py-4 rounded-md border border-accent text-accent font-mono text-sm hover:bg-accent/10 transition"
          >
            <span className="text-muted">$</span> {ui.contact.ctaPrefix} {profile.email}
          </button>
        </Reveal>

        <SectionClosing />
      </Container>
    </section>
  );
}
