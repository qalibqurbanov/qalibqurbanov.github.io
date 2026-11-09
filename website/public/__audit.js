(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 200));
  }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 600));
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const over = (top, base) => ({ r: top.r * top.a + base.r * (1 - top.a), g: top.g * top.a + base.g * (1 - top.a), b: top.b * top.a + base.b * (1 - top.a), a: 1 });
  const bodyBg = parse(getComputedStyle(document.body).backgroundColor);
  const rootBg = parse(getComputedStyle(document.documentElement).backgroundColor);
  let base = { r: 255, g: 255, b: 255, a: 1 };
  if (rootBg && rootBg.a > 0) base = over(rootBg, base);
  if (bodyBg && bodyBg.a > 0) base = over(bodyBg, base);
  const bgOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 0.99) break;
      }
    }
    let b = base;
    for (let i = layers.length - 1; i >= 0; i--) b = over(layers[i], b);
    return b;
  };
  const seen = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  let total = 0;
  while ((n = walker.nextNode())) {
    const t = n.nodeValue.trim();
    if (t.length < 2) continue;
    const el = n.parentElement;
    if (!el || el.closest("script,style,canvas,svg,[aria-hidden='true'],.theme-intro")) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (cs.webkitBackgroundClip === "text" || cs.backgroundClip === "text") continue;
    const fg = parse(cs.color);
    if (!fg || fg.a === 0) continue;
    const bg = bgOf(el);
    const f = over(fg, bg);
    const l1 = lum(f);
    const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    total++;
    if (ratio < 3) {
      const key = el.tagName + "." + (el.getAttribute("class") || "").split(" ").slice(0, 3).join(".") + " fg=" + cs.color + " bg=" + Math.round(bg.r) + "," + Math.round(bg.g) + "," + Math.round(bg.b);
      const cur = seen.get(key) || { ratio: ratio.toFixed(2), sample: t.slice(0, 28), n: 0 };
      cur.n++;
      seen.set(key, cur);
    }
  }
  const rows = [...seen.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 12).map(([k, v]) => `${v.ratio} x${v.n} "${v.sample}" ${k}`);
  document.documentElement.setAttribute("data-audit", `${document.documentElement.dataset.style}/${document.documentElement.dataset.theme} texts=${total} bad=${[...seen.values()].reduce((a, v) => a + v.n, 0)}\n` + rows.join("\n");
})();
