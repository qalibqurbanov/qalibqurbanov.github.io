# Every colour in the site

Generated from the source (src/theme/parts/*.css, src/**/*.tsx, index.html). Dark theme is the default; the light theme overrides the same tokens.

## 1. Palette (tokens)

| Token | Role | Dark hex | Dark RGB | Light hex | Light RGB |
|---|---|---|---|---|---|
| bg | page background | #0a0a12 | 10, 10, 18 | #f5f4fb | 245, 244, 251 |
| surface | cards, panels, menus, popups | #11111c | 17, 17, 28 | #ffffff | 255, 255, 255 |
| surface-2 | raised surface, hover fills | #1a1a2a | 26, 26, 42 | #ebeaf5 | 235, 234, 245 |
| border | hairlines, card and input borders | #2a2a40 | 42, 42, 64 | #d8d6e8 | 216, 214, 232 |
| accent | main accent (blue/cyan): active states, links, icons, glows | #00e5ff | 0, 229, 255 | #0096b8 | 0, 150, 184 |
| accent-2 | second accent (magenta/pink): hover, buttons, arrows, selection | #ff2e97 | 255, 46, 151 | #d4007c | 212, 0, 124 |
| on-accent | text on solid accent buttons | #04040a | 4, 4, 10 | #ffffff | 255, 255, 255 |
| text | main text, name at rest | #e9e9f5 | 233, 233, 245 | #15151f | 21, 21, 31 |
| muted | secondary text, icons at rest, labels | #9494b0 | 148, 148, 176 | #5d5b78 | 93, 91, 120 |
| danger | errors, bug button, 'not allowed' cursor | #ff4d6d | 255, 77, 109 | #c4132f | 196, 19, 47 |
| syn-type | code type names | #00e5ff | 0, 229, 255 | #0096b8 | 0, 150, 184 |
| syn-number | code numbers | #ff2e97 | 255, 46, 151 | #d4007c | 212, 0, 124 |
| green | 'View source' hover, menu aurora | #2ee6a6 | 46, 230, 166 | #0a8f64 | 10, 143, 100 |

Other token: `--neon-glow` = accent mixed 60% with transparent in dark (rgba(0, 229, 255, 0.6)); 55% of #00b4dc in light (rgba(0, 180, 220, 0.55)).

## 2. Fixed colours written directly in the code (not tokens)

| Colour | RGB | Where |
|---|---|---|
| #8b5cf6 | 139, 92, 246 | violet: right-click menu aurora edge; a pool in the light page background |
| #2ee6a6 / #0a8f64 | 46, 230, 166 / 10, 143, 100 | green: menu aurora, 'View source' hover (dark / light) |
| #fbfaff | 251, 250, 255 | light page background tint base |
| #fff | 255, 255, 255 | text on text selection; comet/pulse highlights on the card rim; 'neon' edge highlights; button shine; white logo tiles; PDF pages |
| #000 | 0, 0, 0 | mask edges (not visible colour); shadows |
| rgb(0 0 0 / 0.18 – 0.8) | 0, 0, 0 at 18%–80% | card and menu shadows, dark theme |
| rgb(255 255 255 / 0.05 – 0.95) | 255, 255, 255 at 5%–95% | card edge light, shine, rim highlights |
| rgb(30 30 80 / 0.06 – 0.3) | 30, 30, 80 at 6%–30% | card shadows, light theme |
| shadow-black/20, /30 | 0, 0, 0 at 20%, 30% | settings popup, PDF page shadows |
| #0a0a12 | 10, 10, 18 | browser theme colour (index.html meta) |
| [255,255,255] WHITE | 255, 255, 255 | custom cursor: default dot |
| [20,16,40] INK | 20, 16, 40 | custom cursor: dark fallback over bright areas |
| [0,229,255] [255,46,151] [233,233,245] [255,77,109] |  | custom cursor canvas fallbacks = accent, accent-2, text, danger |
| [10,10,18] | 10, 10, 18 | custom cursor: assumed page colour |

Company logos in public/logos (crocusoft.png, kapital-bank.png, sanat.png, sdg-azstat.ico) are images with their own colours; they sit on a white tile.

## 3. Element by element (CSS)

Tokens are shown as name(dark RGB); the light theme swaps in the light column of section 1. `color-mix(in srgb, X N%, transparent)` means X at N% opacity.

### avatar.css

- `.avatar-photo img`
  - border: 3px solid transparent
  - background: conic-gradient(from 140deg, accent(0, 229, 255), accent-2(255, 46, 151), accent(0, 229, 255)) border-box
- `.avatar-ring-a`
  - border-color: accent(0, 229, 255)
- `.avatar-ring-b`
  - border-color: accent-2(255, 46, 151)
- `.avatar-aurora`
  - background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, accent(0, 229, 255) 90%, transparent), transparent 48%), radial-gradient(circle at calc(100% - var(--mx, 50%)) calc(100% - var(--my, 50%)), color-mix(in srgb, accent-2(255, 46, 151) 90%, transparent), transparent 48%)
- `.text-flow`
  - background-image: repeating-linear-gradient( in oklab var(--flow-ang), text(233, 233, 245) calc(var(--flow-p) + 0px), color-mix(in oklab, accent(0, 229, 255) 16%, text(233, 233, 245)) calc(var(--flow-p) + 20px), color-mix(in oklab, accent(0, 229, 255) 50%, text(233, 233, 245)) calc(var(--flow-p) + 40px), color-mix(in oklab, accent(0, 229, 255) 84%, text(233, 233, 245)) calc(var(--flow-p) + 60px), accent(0, 229, 255) calc(var(--flow-p) + 80px), color-mix(in oklab, accent(0, 229, 255) 84%, text(233, 233, 245)) calc(var(--flow-p) + 100px), color-mix(in oklab, accent(0, 229, 255) 50%, text(233, 233, 245)) calc(var(--flow-p) + 120px), color-mix(in oklab, accent(0, 229, 255) 16%, text(233, 233, 245)) calc(var(--flow-p) + 140px), text(233, 233, 245) calc(var(--flow-p) + 160px), text(233, 233, 245) calc(var(--flow-p) + 360px), text(233, 233, 245) calc(var(--flow-p) + 360px), color-mix(in oklab, accent-2(255, 46, 151) 16%, text(233, 233, 245)) calc(var(--flow-p) + 380px), color-mix(in oklab, accent-2(255, 46, 151) 50%, text(233, 233, 245)) calc(var(--flow-p) + 400px), color-mix(in oklab, accent-2(255, 46, 151) 84%, text(233, 233, 245)) calc(var(--flow-p) + 420px), accent-2(255, 46, 151) calc(var(--flow-p) + 440px), color-mix(in oklab, accent-2(255, 46, 151) 84%, text(233, 233, 245)) calc(var(--flow-p) + 460px), color-mix(in oklab, accent-2(255, 46, 151) 50%, text(233, 233, 245)) calc(var(--flow-p) + 480px), color-mix(in oklab, accent-2(255, 46, 151) 16%, text(233, 233, 245)) calc(var(--flow-p) + 500px), text(233, 233, 245) calc(var(--flow-p) + 520px), text(233, 233, 245) calc(var(--flow-p) + 720px) )
  - color: text(233, 233, 245)
- `.text-flow:hover`
  - color: transparent

### backgrounds.css

- `.card-mesh i:nth-child(1)`
  - background: color-mix(in srgb, accent(0, 229, 255) 12%, transparent)
- `.card-mesh i:nth-child(2)`
  - background: color-mix(in srgb, accent(0, 229, 255) 40%, accent-2(255, 46, 151) 60%)
- `.card-mesh i:nth-child(3)`
  - background: color-mix(in srgb, accent-2(255, 46, 151) 14%, transparent)
- `body::before`
  - background: radial-gradient(1000px 700px at 92% -8%, color-mix(in srgb, accent(0, 229, 255) 15%, transparent), transparent 70%), radial-gradient(900px 800px at 6% 108%, color-mix(in srgb, accent-2(255, 46, 151) 13%, transparent), transparent 70%), radial-gradient(800px 600px at 58% 52%, color-mix(in srgb, color-mix(in srgb, accent(0, 229, 255) 35%, accent-2(255, 46, 151)) 8%, transparent), transparent 70%), linear-gradient(160deg, color-mix(in srgb, accent(0, 229, 255) 6%, bg(10, 10, 18)), bg(10, 10, 18) 45%, color-mix(in srgb, accent-2(255, 46, 151) 6%, bg(10, 10, 18)))
- `[data-theme="light"] body::before`
  - background: radial-gradient(1000px 700px at 92% -8%, color-mix(in srgb, accent(0, 229, 255) 16%, transparent), transparent 70%), radial-gradient(900px 800px at 6% 108%, color-mix(in srgb, accent-2(255, 46, 151) 14%, transparent), transparent 70%), linear-gradient(160deg, color-mix(in srgb, accent(0, 229, 255) 7%, #fff), bg(10, 10, 18) 45%, color-mix(in srgb, accent-2(255, 46, 151) 7%, #fff))
- `body::before`
  - background: radial-gradient(60% 50% at 88% 0%, color-mix(in srgb, accent(0, 229, 255) 13%, transparent), transparent 70%), radial-gradient(55% 55% at 100% 100%, color-mix(in srgb, accent-2(255, 46, 151) 11%, transparent), transparent 70%), radial-gradient(50% 45% at 45% 110%, color-mix(in srgb, accent(0, 229, 255) 7%, accent-2(255, 46, 151) 7%), transparent 70%), linear-gradient(160deg, color-mix(in srgb, bg(10, 10, 18) 92%, accent(0, 229, 255)) 0%, bg(10, 10, 18) 38%, color-mix(in srgb, bg(10, 10, 18) 93%, accent-2(255, 46, 151)) 100%)

### base.css

- `body`
  - background-color: bg(10, 10, 18)
  - color: text(233, 233, 245)
- `::selection`
  - background: accent-2(255, 46, 151)
  - color: #fff
- `html, .custom-scrollbar`
  - scrollbar-color: color-mix(in srgb, accent(0, 229, 255) 45%, border(42, 42, 64)) transparent
- `.view-overlay`
  - background: color-mix(in srgb, bg(10, 10, 18) 55%, transparent)

### context-menu.css

- `.ctx-menu`
  - border: 1px solid color-mix(in srgb, accent(0, 229, 255) 30%, border(42, 42, 64))
  - background: color-mix(in srgb, surface(17, 17, 28) 94%, transparent)
  - color: text(233, 233, 245)
  - box-shadow: 0 18px 40px -12px rgb(0 0 0 / 0.6), 0 0 22px -8px neon-glow(0, 229, 255 @60%)
- `.ctx-menu::before`
  - background: linear-gradient(to right, accent(0, 229, 255), accent-2(255, 46, 151) 60%, transparent)
  - box-shadow: 0 0 8px neon-glow(0, 229, 255 @60%)
- `.ctx-head`
  - border-bottom: 1px solid border(42, 42, 64)
  - background: color-mix(in srgb, surface-2(26, 26, 42) 60%, transparent)
  - color: muted(148, 148, 176)
- `.ctx-dot`
  - background: accent(0, 229, 255)
  - box-shadow: 0 0 8px accent(0, 229, 255)
- `.ctx-item`
  - color: text(233, 233, 245)
- `:root`
  - --color-green: #2ee6a6
- `[data-theme="light"]`
  - --color-green: #0a8f64
- `.ctx-item::before`
  - background: var(--tone)
  - box-shadow: 0 0 8px var(--tone)
- `.ctx-item:hover, .ctx-item:focus-visible`
  - background: color-mix(in srgb, var(--tone) 10%, transparent)
  - color: var(--tone)
- `.ctx-icon`
  - color: muted(148, 148, 176)
- `.ctx-item:hover .ctx-icon, .ctx-item:focus-visible .ctx-icon`
  - color: currentColor
- `.ctx-kbd`
  - border: 1px solid border(42, 42, 64)
  - background: bg(10, 10, 18)
  - color: muted(148, 148, 176)
- `.ctx-sep`
  - background: linear-gradient(to right, transparent, border(42, 42, 64), transparent)
- `.ctx-primary`
  - border: 1px solid color-mix(in srgb, accent(0, 229, 255) 35%, transparent)
  - background: linear-gradient(to right, color-mix(in srgb, accent(0, 229, 255) 14%, transparent), color-mix(in srgb, accent-2(255, 46, 151) 10%, transparent))
  - color: accent(0, 229, 255)
- `.ctx-primary:hover, .ctx-primary:focus-visible`
  - border-color: accent(0, 229, 255)
  - box-shadow: 0 0 14px -6px neon-glow(0, 229, 255 @60%)
- `.aurora-r::before, .aurora-r::after`
  - background-image: linear-gradient(to bottom, transparent 0%, accent(0, 229, 255) 22%, transparent 46%, accent-2(255, 46, 151) 70%, transparent 100%), linear-gradient(to bottom, transparent 0%, #8b5cf6 30%, transparent 55%, #2ee6a6 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, accent-2(255, 46, 151) 35%, transparent 60%, accent(0, 229, 255) 85%, transparent 100%)
- `.aurora-r::before`
  - box-shadow: 0 0 6px neon-glow(0, 229, 255 @60%)
- `.tool-danger:hover, .tool-danger:focus-visible`
  - color: danger(255, 77, 109)
- `.tool-green:hover, .tool-green:focus-visible`
  - color: green(46, 230, 166)

### cursor.css

- `.custom-cursor-dot`
  - background: var(--cur, #fff)
  - box-shadow: 0 0 10px var(--cur, neon-glow(0, 229, 255 @60%))
- `.custom-cursor-glyph`
  - color: var(--cur, accent(0, 229, 255))
  - filter: drop-shadow(0 0 6px var(--cur, neon-glow(0, 229, 255 @60%)))
- `.custom-cursor-glyph svg`
  - stroke: currentColor
- `.custom-cursor-glyph[data-g="download"], .custom-cursor-glyph[data-g="help"]`
  - color: var(--cur, accent-2(255, 46, 151))
- `.custom-cursor-glyph[data-g="no"]`
  - color: var(--cur, danger(255, 77, 109))

### experience.css

- `.exp-job::before`
  - background: border(42, 42, 64)
- `.exp-job::after`
  - border: 1.5px solid muted(148, 148, 176)
  - background: bg(10, 10, 18)
- `.exp-job:has(> button[aria-expanded="true"])::after`
  - border-color: accent(0, 229, 255)
  - background: accent(0, 229, 255)
  - box-shadow: 0 0 10px neon-glow(0, 229, 255 @60%)
- `.exp-job:has(> button:hover)::after`
  - border-color: accent(0, 229, 255)
- `.exp-job:has(.now-dot)::after`
  - border-color: accent(0, 229, 255)
  - background: accent(0, 229, 255)
- `0%`
  - box-shadow: 0 0 8px neon-glow(0, 229, 255 @60%), 0 0 0 0 color-mix(in srgb, accent(0, 229, 255) 60%, transparent)
- `70%, 100%`
  - box-shadow: 0 0 8px neon-glow(0, 229, 255 @60%), 0 0 0 10px transparent
- `.exp-job:has(.now-dot)::after`
  - box-shadow: 0 0 8px neon-glow(0, 229, 255 @60%)

### home.css

- `.stat-figure`
  - color: transparent
  - -webkit-text-stroke: 1.5px text(233, 233, 245)
- `.stat:hover .stat-figure`
  - color: accent(0, 229, 255)
  - -webkit-text-stroke-color: accent(0, 229, 255)
- `.stat:nth-child(2):hover .stat-figure`
  - color: accent-2(255, 46, 151)
  - -webkit-text-stroke-color: accent-2(255, 46, 151)
- `.chapter::after`
  - background: border(42, 42, 64)
- `.chapter::before`
  - border: 1.5px solid muted(148, 148, 176)
  - background: bg(10, 10, 18)
- `.chapter:hover::before`
  - border-color: accent(0, 229, 255)
  - background: accent(0, 229, 255)
  - box-shadow: 0 0 10px neon-glow(0, 229, 255 @60%)
- `.tile-icon`
  - color: accent(0, 229, 255)
  - background: color-mix(in srgb, accent(0, 229, 255) 9%, transparent)
  - border: 1px solid color-mix(in srgb, accent(0, 229, 255) 30%, border(42, 42, 64))
- `0%, 100%`
  - box-shadow: 0 0 0 0 transparent
- `50%`
  - box-shadow: 0 0 16px -2px color-mix(in srgb, accent(0, 229, 255) 45%, transparent)
- `.kind-chip`
  - background: color-mix(in srgb, accent(0, 229, 255) 7%, transparent)
- `.kind-chip::before`
  - background: linear-gradient(120deg, accent(0, 229, 255), accent-2(255, 46, 151))
- `.stat-figure.fig-fill`
  - color: transparent
  - -webkit-text-stroke: 1.5px text(233, 233, 245)
  - background-image: linear-gradient(90deg, accent(0, 229, 255), accent-2(255, 46, 151), accent(0, 229, 255))
- `.stat:hover .stat-figure.fig-fill:not(:hover), .stat:nth-child(2):hover .stat-figure.fig-fill:not(:hover)`
  - color: transparent
  - -webkit-text-stroke-color: text(233, 233, 245)
- `.stat-figure.fig-fill:hover`
  - color: transparent
  - -webkit-text-stroke-color: transparent
  - filter: drop-shadow(0 0 14px color-mix(in srgb, accent(0, 229, 255) 26%, transparent))
- `.marquee-large:hover`
  - color: accent(0, 229, 255)
- `.marquee-small`
  - color: muted(148, 148, 176)
- `.marquee-small:hover`
  - color: accent-2(255, 46, 151)
- `.marquee-star`
  - color: accent-2(255, 46, 151)
- `.home-band-label`
  - color: accent(0, 229, 255)
- `.home-band-star`
  - color: accent-2(255, 46, 151)
- `.home-band-tag`
  - color: muted(148, 148, 176)
- `.home-band-tag:hover`
  - color: accent(0, 229, 255)

### light.css

- `[data-theme="light"]`
  - --color-green: #0a8f64
- `[data-theme="light"] body::before`
  - background: radial-gradient(60% 52% at 90% -4%, color-mix(in srgb, accent(0, 229, 255) 30%, transparent), transparent 72%), radial-gradient(58% 58% at 4% 104%, color-mix(in srgb, accent-2(255, 46, 151) 24%, transparent), transparent 72%), radial-gradient(48% 44% at 62% 58%, color-mix(in srgb, #8b5cf6 13%, transparent), transparent 72%), radial-gradient(40% 36% at 36% -6%, color-mix(in srgb, accent(0, 229, 255) 10%, transparent), transparent 74%), linear-gradient(160deg, color-mix(in srgb, accent(0, 229, 255) 7%, #fbfaff) 0%, bg(10, 10, 18) 42%, color-mix(in srgb, accent-2(255, 46, 151) 8%, #fbfaff) 100%)
- `[data-theme="light"] .side-card`
  - border-color: color-mix(in srgb, accent(0, 229, 255) 22%, rgb(255 255 255 / 0.7))
- `[data-theme="light"] .panel:hover, [data-theme="light"] .panel:focus-within`
  - box-shadow: 0 14px 34px -16px color-mix(in srgb, accent(0, 229, 255) 55%, transparent)
- `[data-theme="light"] .btn-solid`
  - box-shadow: 0 8px 22px -10px color-mix(in srgb, accent(0, 229, 255) 70%, transparent)
- `[data-theme="light"] .tile-icon, [data-theme="light"] .stat-figure.fig-fill:hover`
  - filter: drop-shadow(0 0 12px color-mix(in srgb, accent(0, 229, 255) 40%, transparent))
- `[data-theme="light"] .kind-chip`
  - background: color-mix(in srgb, accent(0, 229, 255) 11%, #fff)

### living-edges.css

- `.neon-b::before`
  - background-image: linear-gradient(to right, transparent, rgb(255 255 255 / 0.3) 30%, rgb(255 255 255 / 0.95) 50%, rgb(255 255 255 / 0.3) 70%, transparent), linear-gradient(to right, transparent, color-mix(in srgb, accent-2(255, 46, 151) 40%, white) 50%, transparent), linear-gradient(to right, accent(0, 229, 255), accent-2(255, 46, 151), accent(0, 229, 255))
- `.neon-r::before`
  - background-image: linear-gradient(to bottom, transparent, rgb(255 255 255 / 0.3) 30%, rgb(255 255 255 / 0.95) 50%, rgb(255 255 255 / 0.3) 70%, transparent), linear-gradient(to bottom, transparent, color-mix(in srgb, accent-2(255, 46, 151) 40%, white) 50%, transparent), linear-gradient(to bottom, accent(0, 229, 255), accent-2(255, 46, 151), accent(0, 229, 255))
- `.neon-t::before`
  - background-image: linear-gradient(to right, transparent, rgb(255 255 255 / 0.3) 30%, rgb(255 255 255 / 0.95) 50%, rgb(255 255 255 / 0.3) 70%, transparent), linear-gradient(to right, transparent, color-mix(in srgb, accent-2(255, 46, 151) 40%, white) 50%, transparent), linear-gradient(to right, accent(0, 229, 255), accent-2(255, 46, 151), accent(0, 229, 255))

### motion.css

- `.panel::before`
  - background: linear-gradient(135deg, accent(0, 229, 255), accent-2(255, 46, 151))
- `.btn-solid::after`
  - background: linear-gradient(105deg, transparent 40%, rgb(255 255 255 / 0.35) 50%, transparent 60%)

### neon-edges.css

- `.neon-r::after, .neon-b::after, .neon-t::after`
  - box-shadow: 0 0 10px 0 neon-glow(0, 229, 255 @60%), 0 0 2px 0 neon-glow(0, 229, 255 @60%)
- `.neon-r::after`
  - background: linear-gradient(to bottom, transparent, accent(0, 229, 255) var(--y1, 3.5rem), accent-2(255, 46, 151) calc(100% - var(--y2, 2.5rem)), transparent)
- `.neon-b::after`
  - background: linear-gradient(to right, accent(0, 229, 255), accent-2(255, 46, 151) 60%, transparent)
- `.neon-t::after`
  - background: linear-gradient(to right, accent-2(255, 46, 151), accent(0, 229, 255) 60%, transparent)

### not-found.css

- `.nf-eyebrow`
  - color: accent(0, 229, 255)
- `.nf-code`
  - color: text(233, 233, 245)
- `.nf-text`
  - color: muted(148, 148, 176)
- `.nf-path`
  - border: 1px solid border(42, 42, 64)
  - background: surface(17, 17, 28)
  - color: text(233, 233, 245)
- `.nf-back`
  - color: muted(148, 148, 176)
- `.nf-back a`
  - color: text(233, 233, 245)

### sidebar-card.css

- `.side-card`
  - border: 1px solid color-mix(in srgb, text(233, 233, 245) 10%, transparent)
  - background: radial-gradient(190px circle at var(--mx) var(--my), color-mix(in srgb, accent(0, 229, 255) calc(var(--hover) * 10%), transparent), transparent 70%), linear-gradient(180deg, rgb(255 255 255 / 0.06), transparent 28%, transparent 70%, rgb(0 0 0 / 0.18)), color-mix(in srgb, surface(17, 17, 28) 58%, transparent)
  - box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.16), inset 0 -1px 0 rgb(0 0 0 / 0.4), inset 1px 0 0 rgb(255 255 255 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.32), 0 2px 3px rgb(0 0 0 / 0.4), 0 6px 0 -3px rgb(0 0 0 / 0.3), 0 18px 30px -10px rgb(0 0 0 / 0.6), 0 44px 80px -24px rgb(0 0 0 / 0.8), 0 70px 120px -40px rgb(0 0 0 / 0.55)
- `[data-theme="light"] .side-card`
  - background: radial-gradient(190px circle at var(--mx) var(--my), color-mix(in srgb, accent(0, 229, 255) calc(var(--hover) * 10%), transparent), transparent 70%), linear-gradient(180deg, rgb(255 255 255 / 0.7), transparent 30%, transparent 72%, rgb(30 30 80 / 0.06)), color-mix(in srgb, surface(17, 17, 28) 70%, transparent)
  - box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.95), inset 0 -1px 0 rgb(30 30 80 / 0.1), 0 0 0 1px rgb(30 30 80 / 0.08), 0 2px 3px rgb(30 30 80 / 0.1), 0 12px 22px -8px rgb(30 30 80 / 0.18), 0 34px 64px -22px rgb(30 30 80 / 0.3)
- `.card-rim`
  - border: 1px solid transparent
- `.card-rim[data-rim="comet"]`
  - background: conic-gradient(from var(--ang), transparent 0 56%, color-mix(in srgb, accent(0, 229, 255) 40%, transparent) 78%, color-mix(in srgb, accent(0, 229, 255) 60%, #fff) 93%, transparent) border-box
- `.card-rim[data-rim="twin"]`
  - background: conic-gradient(from var(--ang), transparent 0 24%, accent(0, 229, 255) 36%, transparent 46%, transparent 74%, accent-2(255, 46, 151) 86%, transparent 97%) border-box
- `.card-rim[data-rim="dashes"]`
  - background: repeating-conic-gradient(from var(--ang), color-mix(in srgb, accent(0, 229, 255) 80%, transparent) 0 3deg, transparent 3deg 10deg) border-box
- `.card-rim[data-rim="breathe"]`
  - background: conic-gradient(from var(--ang), accent(0, 229, 255), color-mix(in srgb, accent(0, 229, 255) 50%, accent-2(255, 46, 151)), accent-2(255, 46, 151), color-mix(in srgb, accent(0, 229, 255) 50%, accent-2(255, 46, 151)), accent(0, 229, 255)) border-box
- `.card-rim[data-rim="comet2"]`
  - background: conic-gradient(from var(--ang), transparent 0 58%, color-mix(in srgb, accent-2(255, 46, 151) 40%, transparent) 78%, color-mix(in srgb, accent-2(255, 46, 151) 60%, #fff) 93%, transparent) border-box
- `.card-rim[data-rim="pointer"]`
  - background: radial-gradient(170px circle at var(--mx) var(--my), color-mix(in srgb, accent(0, 229, 255) 92%, #fff), color-mix(in srgb, accent-2(255, 46, 151) 45%, transparent) 45%, transparent 72%) border-box
- `.card-rim[data-rim="pulse"]`
  - background: conic-gradient(from var(--ang), transparent 0 55%, accent-2(255, 46, 151) 80%, #fff 95%, transparent) border-box
  - filter: drop-shadow(0 0 5px accent-2(255, 46, 151))
- `.nav-dot`
  - background: accent(0, 229, 255)
  - box-shadow: 0 0 8px accent(0, 229, 255)
- `.nav-arrow`
  - color: accent-2(255, 46, 151)

### tooltip.css

- `.tip-balloon`
  - border: 1px solid color-mix(in srgb, accent(0, 229, 255) 35%, border(42, 42, 64))
  - background: color-mix(in srgb, surface(17, 17, 28) 94%, transparent)
  - color: text(233, 233, 245)
  - box-shadow: 0 8px 22px -10px rgb(0 0 0 / 0.5), 0 0 14px -6px neon-glow(0, 229, 255 @60%)
- `.tip-balloon::after`
  - background: linear-gradient(to right, accent(0, 229, 255), accent-2(255, 46, 151))
  - box-shadow: 0 0 8px neon-glow(0, 229, 255 @60%)
- `.tip-arrow`
  - background: color-mix(in srgb, surface(17, 17, 28) 100%, bg(10, 10, 18))
- `.tip-balloon[data-side="top"] .tip-arrow`
  - border-right: 1px solid accent-2(255, 46, 151)
  - border-bottom: 1px solid accent-2(255, 46, 151)
- `.tip-balloon[data-side="bottom"] .tip-arrow`
  - border-left: 1px solid accent(0, 229, 255)
  - border-top: 1px solid accent(0, 229, 255)

### visual-language.css

- `.label`
  - color: muted(148, 148, 176)
- `.entry:hover .entry-title, .entry:focus-within .entry-title`
  - color: accent(0, 229, 255)
- `.panel`
  - background: surface(17, 17, 28)
  - border: 1px solid border(42, 42, 64)
- `.panel:hover, .panel:focus-within`
  - border-color: color-mix(in srgb, accent(0, 229, 255) 50%, border(42, 42, 64))
- `.btn-solid`
  - background: accent(0, 229, 255)
  - color: on-accent(4, 4, 10)
  - border: 1px solid accent(0, 229, 255)
- `.btn-line`
  - border: 1px solid border(42, 42, 64)
  - color: text(233, 233, 245)
- `.btn-line:hover`
  - border-color: accent(0, 229, 255)
  - color: accent(0, 229, 255)
- `.link-line`
  - background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat
- `.now-dot-core`
  - background: accent-2(255, 46, 151)
  - box-shadow: 0 0 6px accent-2(255, 46, 151)
- `.now-dot-ring`
  - border: 1.5px solid accent-2(255, 46, 151)
- `.now-dot-still .now-dot-core`
  - background: accent(0, 229, 255)
  - box-shadow: 0 0 6px accent(0, 229, 255)
- `.skill-item:hover`
  - color: accent(0, 229, 255)

## 4. Element by element (component classes)

Tailwind colour classes found in each component. Icons and symbols use `currentColor`, so they take the text colour of the class on them or their parent.

- **src/components/command-palette/CommandPalette.tsx**: `bg-bg/55` → bg(10, 10, 18) @55%; `bg-surface` → surface(17, 17, 28); `bg-surface-2` → surface-2(26, 26, 42); `bg-transparent`; `border-border` → border(42, 42, 64); `hover:bg-surface-2` → surface-2(26, 26, 42); `text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176); `text-muted/70` → muted(148, 148, 176) @70%; `text-text` → text(233, 233, 245)
- **src/components/contact/ContactModal.tsx**: `bg-accent` → accent(0, 229, 255); `bg-accent/10` → accent(0, 229, 255) @10%; `bg-surface-2` → surface-2(26, 26, 42); `border-accent` → accent(0, 229, 255); `border-accent/60` → accent(0, 229, 255) @60%; `border-border` → border(42, 42, 64); `border-danger` → danger(255, 77, 109); `border-muted/60` → muted(148, 148, 176) @60%; `hover:border-accent` → accent(0, 229, 255); `hover:text-accent` → accent(0, 229, 255); `hover:text-danger` → danger(255, 77, 109); `text-accent` → accent(0, 229, 255); `text-danger` → danger(255, 77, 109); `text-muted` → muted(148, 148, 176); `text-muted/60` → muted(148, 148, 176) @60%; `text-muted/80` → muted(148, 148, 176) @80%; `text-on-accent` → on-accent(4, 4, 10); `text-text` → text(233, 233, 245)
- **src/components/layout/Navbar.tsx**: `bg-bg` → bg(10, 10, 18); `bg-bg/70` → bg(10, 10, 18) @70%; `border-border` → border(42, 42, 64); `hover:border-accent` → accent(0, 229, 255); `hover:text-text` → text(233, 233, 245); `text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176); `text-text` → text(233, 233, 245)
- **src/components/layout/Sidebar.tsx**: `after:bg-accent` → accent(0, 229, 255); `after:bg-accent-2` → accent-2(255, 46, 151); `bg-accent-2/8` → accent-2(255, 46, 151) @8%; `bg-accent/8` → accent(0, 229, 255) @8%; `hover:bg-accent-2/14` → accent-2(255, 46, 151) @14%; `hover:bg-accent/14` → accent(0, 229, 255) @14%; `hover:text-accent` → accent(0, 229, 255); `hover:text-accent-2` → accent-2(255, 46, 151); `text-accent` → accent(0, 229, 255); `text-accent-2` → accent-2(255, 46, 151); `text-muted` → muted(148, 148, 176)
- **src/components/ui/BackToTop.tsx**: `bg-surface` → surface(17, 17, 28); `border-border` → border(42, 42, 64); `focus-visible:border-text` → text(233, 233, 245); `focus-visible:text-text` → text(233, 233, 245); `hover:border-text` → text(233, 233, 245); `hover:text-text` → text(233, 233, 245); `text-muted` → muted(148, 148, 176)
- **src/components/ui/CodeBlock.tsx**: `text-accent` → accent(0, 229, 255); `text-accent-2` → accent-2(255, 46, 151); `text-muted/50` → muted(148, 148, 176) @50%; `text-muted/70` → muted(148, 148, 176) @70%; `text-syn-number` → syn-number(255, 46, 151); `text-syn-type` → syn-type(0, 229, 255); `text-text` → text(233, 233, 245)
- **src/components/ui/ContextMenu.tsx**: `bg-accent` → accent(0, 229, 255); `bg-bg` → bg(10, 10, 18); `border-border` → border(42, 42, 64); `focus-visible:text-accent` → accent(0, 229, 255); `hover:text-accent` → accent(0, 229, 255); `text-accent-2` → accent-2(255, 46, 151); `text-muted` → muted(148, 148, 176); `text-on-accent` → on-accent(4, 4, 10); `text-text` → text(233, 233, 245)
- **src/components/ui/Notice.tsx**: `bg-accent` → accent(0, 229, 255); `bg-danger` → danger(255, 77, 109); `bg-surface` → surface(17, 17, 28); `bg-surface-2` → surface-2(26, 26, 42); `border-border` → border(42, 42, 64); `border-danger/50` → danger(255, 77, 109) @50%; `hover:bg-surface-2` → surface-2(26, 26, 42); `hover:text-text` → text(233, 233, 245); `shadow-black/20`; `text-accent` → accent(0, 229, 255); `text-danger` → danger(255, 77, 109); `text-muted` → muted(148, 148, 176); `text-text` → text(233, 233, 245)
- **src/components/ui/Panel.tsx**: `bg-surface` → surface(17, 17, 28); `border-border` → border(42, 42, 64); `hover:bg-surface-2` → surface-2(26, 26, 42); `hover:text-text` → text(233, 233, 245); `text-muted` → muted(148, 148, 176)
- **src/components/ui/SettingsMenu.tsx**: `bg-bg` → bg(10, 10, 18); `bg-surface` → surface(17, 17, 28); `bg-surface-2` → surface-2(26, 26, 42); `border-border` → border(42, 42, 64); `divide-border` → border(42, 42, 64); `hover:text-accent` → accent(0, 229, 255); `hover:text-text` → text(233, 233, 245); `shadow-black/20`; `text-muted` → muted(148, 148, 176); `text-text` → text(233, 233, 245)
- **src/components/ui/Tag.tsx**: `bg-surface-2` → surface-2(26, 26, 42); `border-border` → border(42, 42, 64); `text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176)
- **src/components/ui/emphasis.tsx**: `text-accent` → accent(0, 229, 255); `text-text` → text(233, 233, 245)
- **src/features/about/About.tsx**: `border-border` → border(42, 42, 64); `text-accent-2` → accent-2(255, 46, 151); `text-muted` → muted(148, 148, 176)
- **src/features/blog/Blog.tsx**: `text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176)
- **src/features/blog/BlogPost.tsx**: `bg-surface-2/60` → surface-2(26, 26, 42) @60%; `border-border` → border(42, 42, 64); `hover:text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176); `text-text` → text(233, 233, 245)
- **src/features/contact/Contact.tsx**: `bg-accent-2` → accent-2(255, 46, 151); `text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176)
- **src/features/experience/Experience.tsx**: `bg-accent` → accent(0, 229, 255); `bg-accent-2/10` → accent-2(255, 46, 151) @10%; `bg-bg` → bg(10, 10, 18); `bg-border` → border(42, 42, 64); `bg-surface-2` → surface-2(26, 26, 42); `bg-white`; `border-accent-2/40` → accent-2(255, 46, 151) @40%; `border-border` → border(42, 42, 64); `from-accent` → accent(0, 229, 255); `from-surface-2/60` → surface-2(26, 26, 42) @60%; `group-hover:text-accent` → accent(0, 229, 255); `hover:bg-accent` → accent(0, 229, 255); `hover:from-surface-2` → surface-2(26, 26, 42); `text-accent` → accent(0, 229, 255); `text-accent-2` → accent-2(255, 46, 151); `text-muted` → muted(148, 148, 176); `to-transparent`; `via-surface-2/20` → surface-2(26, 26, 42) @20%
- **src/features/home/Home.tsx**: `border-border` → border(42, 42, 64); `text-accent` → accent(0, 229, 255); `text-accent-2` → accent-2(255, 46, 151); `text-muted` → muted(148, 148, 176)
- **src/features/links/Links.tsx**: `border-border` → border(42, 42, 64); `group-hover:text-accent` → accent(0, 229, 255); `hover:text-accent` → accent(0, 229, 255); `text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176)
- **src/features/projects/MoreProjects.tsx**: `border-border` → border(42, 42, 64); `group-hover:text-accent` → accent(0, 229, 255); `hover:text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176); `text-text` → text(233, 233, 245)
- **src/features/projects/ProjectCard.tsx**: `text-accent-2` → accent-2(255, 46, 151); `text-muted` → muted(148, 148, 176)
- **src/features/projects/ProjectDetail.tsx**: `bg-surface` → surface(17, 17, 28); `bg-surface-2` → surface-2(26, 26, 42); `bg-surface-2/60` → surface-2(26, 26, 42) @60%; `border-accent` → accent(0, 229, 255); `border-border` → border(42, 42, 64); `hover:border-accent` → accent(0, 229, 255); `hover:text-accent` → accent(0, 229, 255); `hover:text-text` → text(233, 233, 245); `shadow-black/20`; `text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176); `text-text` → text(233, 233, 245)
- **src/features/projects/ProjectStatusBar.tsx**: `bg-accent` → accent(0, 229, 255); `bg-surface-2/70` → surface-2(26, 26, 42) @70%; `border-border` → border(42, 42, 64); `group-hover:border-accent/40` → accent(0, 229, 255) @40%; `hover:text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176)
- **src/features/projects/Projects.tsx**: `border-accent` → accent(0, 229, 255); `border-border` → border(42, 42, 64); `hover:text-text` → text(233, 233, 245); `text-accent` → accent(0, 229, 255); `text-muted` → muted(148, 148, 176)
- **src/features/resume/PdfPages.tsx**: `bg-surface-2` → surface-2(26, 26, 42); `bg-white`; `shadow-black/30`; `text-muted` → muted(148, 148, 176)
- **src/features/resume/ResumeViewer.tsx**: `bg-bg` → bg(10, 10, 18)
- **src/features/skills/Skills.tsx**: `bg-accent` → accent(0, 229, 255); `bg-accent-2` → accent-2(255, 46, 151); `bg-accent-2/10` → accent-2(255, 46, 151) @10%; `bg-accent-2/15` → accent-2(255, 46, 151) @15%; `bg-accent/15` → accent(0, 229, 255) @15%; `bg-border` → border(42, 42, 64); `bg-surface-2` → surface-2(26, 26, 42); `border-border` → border(42, 42, 64); `hover:text-accent-2` → accent-2(255, 46, 151); `hover:text-text` → text(233, 233, 245); `text-accent` → accent(0, 229, 255); `text-accent-2` → accent-2(255, 46, 151); `text-accent-2/70` → accent-2(255, 46, 151) @70%; `text-muted` → muted(148, 148, 176); `text-muted/70` → muted(148, 148, 176) @70%; `text-text` → text(233, 233, 245)
