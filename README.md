# Portfolio — Adrian Tabari

A fast, minimal, static portfolio site. Two projects:

- **CAN-RGX (CLOT-LESS)** — `#/clotless`
- **Anesthesia in Microgravity** — `#/anesthesia`

Vanilla HTML + CSS + JS. **No framework, no build step.** Deployed to GitHub Pages.

Live: <https://pharmbro23.github.io/portfolio/>

---

## How it works

- **One page, hash router.** `index.html` holds three "views" (landing + two projects);
  `js/app.js` shows/hides them on `hashchange` with a cross-fade. Deep-linkable, reload-free.
- **Apple-dock landing.** Two pills; hover/focus lifts the item and reveals the full project name.
- **Quadrant grids.** Each project is a responsive grid of cards (stacks to one column on mobile).
- **Everything heavy is lazy.** PDF iframes and `<video>` sources attach only when their card
  scrolls into view *and* its view is active (one shared `IntersectionObserver`). The landing
  loads no PDFs/video at all.

### Components (`window.Portfolio` contract)

| `data-component` | File | Behaviour |
|---|---|---|
| `pdf`     | `js/pdf-viewer.js` | Native `<iframe>` with chrome hidden (`#toolbar=0&navpanes=0&view=FitH`), lazy, scroll-through, "Open PDF ↗" fallback. Escalation to PDF.js documented in-file. |
| `video`   | `js/media.js` | Lazy self-hosted `<video>` (poster + play overlay, `preload` deferred). |
| `youtube` | `js/media.js` | Click-to-load facade → `youtube-nocookie.com` iframe (never loaded on first paint). |
| `gallery` | `js/media.js` | Image(s) → accessible lightbox (Esc / backdrop / ✕, arrow keys, focus trap). |

---

## File layout

```
index.html
.nojekyll              # lets GitHub Pages serve files as-is (no Jekyll)
css/   fonts.css tokens.css base.css pdf.css media.css
js/    app.js pdf-viewer.js media.js
fonts/ avenir-400.woff2 avenir-700.woff2
assets/
  pdf/   canrgx-images, iac-2026-a1-3-9-x113307-brief,
         anesthesia-iac-presentation, poster-presentation
  img/   setup-1/2 (.webp+.png), *-poster.webp, favicon.svg
  video/ microgravity-flight-1.mp4, microgravity-flight-2.mp4
```

> All paths are **relative** (`assets/…`, `css/…`) so the site works under the `/portfolio/` subpath.
> `documents/` (original media + Avenir TTF sources) and `.preview/` are git-ignored — not deployed.

---

## Updating assets

Drop normalized files into `assets/…` using lowercase, hyphenated names (no commas/spaces).
Re-optimize before committing:

```bash
# image  → webp
ffmpeg -i input.png -c:v libwebp -quality 82 assets/img/name.webp
# video  → web-friendly (moov atom at front)
ffmpeg -i input.mp4 -c copy -movflags +faststart assets/video/name.mp4
# poster frame
ffmpeg -ss 3 -i assets/video/name.mp4 -frames:v 1 -c:v libwebp assets/img/name-poster.webp
```

### Add the pending YouTube video (View A · quadrant 3)

Replace the placeholder block in `index.html` with:

```html
<div class="quad__media" data-component="youtube" data-lazy
     data-yt="YOUTUBE_ID_OR_URL"
     data-poster="assets/img/your-poster.webp"
     data-title="Software demo"></div>
```

`data-yt` accepts a raw 11-char ID or any normal YouTube URL.

---

## Fonts

Apple devices render system **Avenir Next** (no download). Everyone else gets the self-hosted
**Avenir** weights in `fonts/` (see `css/fonts.css`); `system-ui` is the deep fallback. No external
font request is made.

> Note: Avenir is a proprietary typeface. The bundled weights are included for this personal,
> non-commercial portfolio only. To remove them, delete `fonts/`, drop the `fonts.css` link, and
> add a free fallback (e.g. Nunito Sans) to the stack in `css/tokens.css`.

---

## Deploy (GitHub Pages)

1. Push to `main` (files at repo root, no build step).
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/ (root)`** → Save.
3. Wait for the build, then verify at the live URL **in an incognito window** (catches path/404 issues).

## Local preview

```bash
python -m http.server 8123
# open http://127.0.0.1:8123/
```
