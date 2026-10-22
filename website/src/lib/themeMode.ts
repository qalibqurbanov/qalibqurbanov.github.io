/** Whether the page is showing its light theme right now (the theme is kept on the root element). */
export function isLightTheme(): boolean {
  return document.documentElement.getAttribute("data-theme") === "light";
}
