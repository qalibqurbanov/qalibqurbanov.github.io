export const OPEN_CONTACT_EVENT = "open-contact-modal";

/** Opens the contact form. Kept apart from the modal so that the buttons which open it do not pull its code into the first load. */
export function openContactModal() {
  window.dispatchEvent(new Event(OPEN_CONTACT_EVENT));
}

/** Opens the contact form with the given text attached as a quote, shown above the message field. */
export function openContactModalWithQuote(text: string) {
  window.dispatchEvent(new CustomEvent<string>(OPEN_CONTACT_EVENT, { detail: text.trim() }));
}

/** The quote as it goes into the email: every line marked with "> ", the way mail apps show a quote. */
export function quoteAsText(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}
