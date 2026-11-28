export const OPEN_CONTACT_EVENT = "open-contact-modal";

/** Opens the contact form. Kept apart from the modal so that the buttons which open it do not pull its code into the first load. */
export function openContactModal() {
  window.dispatchEvent(new Event(OPEN_CONTACT_EVENT));
}

/** Opens the contact form with the message already started: the given text, quoted, and an empty line under it to write in. */
export function openContactModalWithQuote(text: string) {
  const quote = text
    .trim()
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
  window.dispatchEvent(new CustomEvent<string>(OPEN_CONTACT_EVENT, { detail: `${quote}\n\n` }));
}
