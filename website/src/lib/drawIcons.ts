/** Makes every icon of the site drawable. An icon is drawn again, stroke by stroke, when it (or the button or link it sits in) is pointed at
 * (see draw-icons.css). To be drawn, each stroke needs `pathLength="1"` (so one dash as long as the stroke can be slid along it) and its own
 * start delay (`--d`, so the strokes follow one another). The icons from the icon library do not come with either, so they get both here,
 * once, when they appear, including icons that appear later (a menu opening, a page changing). Filled brand marks (`data-draw="fill"`) are
 * drawn as an outline that then fills in. */
const SHAPES = "path, line, polyline, polygon, circle, rect, ellipse";
const ICONS = "svg.lucide, svg[data-draw]";

function prepare(svg: Element) {
  if (!(svg instanceof SVGElement) || svg.dataset.drawn) return;
  svg.dataset.drawn = "1";
  let index = 0;
  svg.querySelectorAll(SHAPES).forEach((shape) => {
    shape.setAttribute("pathLength", "1");
    (shape as SVGElement).style.setProperty("--d", String(Math.min(index, 8)));
    index += 1;
  });
}

function scan(root: ParentNode) {
  root.querySelectorAll(ICONS).forEach(prepare);
}

export function installDrawIcons() {
  scan(document);
  new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches(ICONS)) prepare(node);
        scan(node);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}
