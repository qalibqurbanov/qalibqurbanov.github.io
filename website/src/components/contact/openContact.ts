export const OPEN_CONTACT_EVENT = "open-contact-modal";

/** Opens the contact form. Kept apart from the modal so that the buttons which open it do not pull its code into the first load. */
export function openContactModal() {
  window.dispatchEvent(new Event(OPEN_CONTACT_EVENT));
}
