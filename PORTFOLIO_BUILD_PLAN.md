# Portfolio Build Plan — Adrian Tabari

**Target:** a fast, minimal static portfolio site deployed to GitHub Pages
**Repo:** `https://github.com/pharmbro23/portfolio.git`
**Live URL (project site):** `https://pharmbro23.github.io/portfolio/`
**Build tool:** Claude Code, **Opus 4.8 only** (lead + all subagents), **max 4 subagents**

This document is the complete brief. Hand it to Claude Code as the initial prompt (or save it in the repo as `PORTFOLIO_BUILD_PLAN.md` and point Claude Code at it).

---

## 1. Orchestration (Claude Code + Opus 4.8 + subagents)

**Model lock.** Set the main session to Opus 4.8 (`/model claude-opus-4-8`). Every subagent must also run Opus 4.8 — in each subagent file's YAML frontmatter set `model: claude-opus-4-8`. Do **not** use `model: inherit` casually and never fall back to Sonnet/Haiku; the requirement is Opus 4.8 end to end.

**Subagents.** Create up to four project-scoped subagents as Markdown files in `.claude/agents/` (each with `name`, `description`, `tools`, `model: claude-opus-4-8`). The lead session is the orchestrator: it owns the shared contract and final integration, and delegates the modular pieces. Subagent definitions and the official format: `https://code.claude.com/docs/en/sub-agents`.

**Anti-collision rule (important).** Subagents will work in parallel, so **each subagent owns a disjoint set of files** (listed in §9). No two agents edit the same file. The lead defines the shared contract (CSS variable names, component init API, asset paths) in Phase 1 *before* parallel work starts, so the component agents code against a fixed interface.

**Phases:**
1. **Foundation + contract** (lead / Agent 1) — scaffold, design tokens, shell, router, dock. Publishes the contract.
2. **Components in parallel** (Agent 2 + Agent 3) — PDF viewer; video + image-lightbox.
3. **Integration + deploy + QA** (Agent 4, then lead sign-off) — assemble both views, wire assets, perf pass, GitHub Pages.

---

## 2. Tech stack (decided)

- **Vanilla HTML + CSS + JavaScript. No framework, no build step.** The site is tiny (one landing + two views); React/Vite would add weight and a build pipeline for no benefit. No build step also means the simplest possible GitHub Pages deploy (push files, enable Pages).
- **PDF embedding:** native `<iframe>`/`<embed>` first (browser renderer, chrome hidden via PDF Open Parameters `#toolbar=0&navpanes=0&view=FitH`), wrapped in a styled container. Native scroll-through works. **Escalation path:** if a given PDF looks cramped or shows unwanted chrome in testing, swap that viewer's internals to **PDF.js** (lazy-loaded worker, render visible pages via `IntersectionObserver`). Build the viewer as a component with a clean interface so the implementation can swap without touching callers (see §5.1).
- **YouTube:** a lightweight **facade** (click a poster thumbnail → then load the iframe). Use the `lite-youtube-embed` pattern (~3 KB) or hand-roll it. Never load YouTube's heavy iframe on first paint.
- **Self-hosted video:** native `<video>` (see §5.3 + §6 for the size decision).
- **Image lightbox:** a tiny hand-rolled vanilla lightbox (~40 lines). No library needed.
- **No analytics, no trackers, no jQuery.** Keep total JS in the low single-digit KB (excluding any lazy PDF.js).

---

## 3. Design system

Minimal, warm, paper-like. **Explicitly avoid purple/black/blue and any "AI-default" look.** Cream/white/grey with a faint brown.

### Palette (CSS variables — single source of truth)
```css
:root{
  --bg:        #F7F4EE; /* page — faint warm cream */
  --surface:   #FCFBF8; /* cards/quadrants — near white */
  --ink:       #2B2825; /* primary text — warm near-black */
  --muted:     #8C857A; /* secondary text — warm grey */
  --line:      #E6E1D6; /* hairlines / borders */
  --brown:     #A8957F; /* faint brown — accents ONLY, used sparingly */
  --brown-soft:#EEE7DC; /* brown tint for hover fills */
}
```
Use `--brown` only for hover states, an underline, the active dock item, faint quadrant numerals — never as a fill across large areas.

### Typography — Avenir (with correct fallback)
Avenir is a **licensed font, not free / not on Google Fonts.** Strategy:
```css
font-family: 'Avenir Next', 'Avenir', 'Nunito Sans', system-ui, -apple-system, sans-serif;
```
- Apple devices (Mac/iOS — the likely reviewer environment) render **real Avenir Next** natively.
- Everyone else gets **Nunito Sans** (closest free geometric-humanist match), loaded from Google Fonts with `display=swap`, subset to the weights used (400/500/600/700).
- **Optional:** if Adrian provides a licensed Avenir web-font file, self-host it via `@font-face` in `/fonts/` and put it first in the stack. Do **not** commit a licensed font to a public repo without a license that allows it.

### Scale & detail
- Type scale via `clamp()`; generous line-height (1.5–1.65 body).
- Border-radius: small and consistent (e.g. 10–12 px on cards). Hairline borders `1px var(--line)`.
- Spacing on an 8px rhythm. Quadrant grid gets comfortable margins (see §4).
- **Restraint:** spend creativity in *one* place — the dock interaction + the smooth view cross-fade. Keep everything else quiet.

### Creative signature (allowed, disciplined)
- Apple-dock micro-interaction: subtle lift/scale on hover + a label that fades up.
- Smooth cross-fade (or short slide) when switching landing ↔ project view.
- Faint reference numerals (1–4) in a corner of each quadrant in `--muted` at low opacity — doubles as a quiet design motif and matches the numbering scheme. Easy to remove if unwanted.
- Optional: a barely-there paper grain on `--bg` (CSS, no image) — keep it almost invisible.

---

## 4. Information architecture & layout

**Single page, hash router.** One `index.html`; JS shows/hides three "views" and listens to `hashchange`. Deep-linkable and reload-free.
- `#/` → landing
- `#/clotless` → CAN-RGX (CLOT-LESS)
- `#/anesthesia` → Anesthesia in Microgravity

**Landing**
- Centered title near top: **"Portfolio — Adrian Tabari"** (clean, large, Avenir).
- Below it, a centered **Apple-dock-style toolbar** with two items.
  - At rest: two understated pill/labels showing short names (`CAN-RGX` and `Anesthesia`).
  - On hover: the item lifts/scales slightly and a floating label with the **full project name** fades in above it ("CAN-RGX Project (CLOT-LESS)" / "Anesthesia in Microgravity").
  - On click: navigate to that project's view with a cross-fade.
  - *(Interpretation of "hover brings up the text" — confirm with Adrian; see §11.)*

**Project view (both projects)**
- A **2-column × 2-row quadrant grid** with page margins (max-width container, generous gutters between quadrants).
- Reference numbering:
  ```
  1 2
  3 4
  ```
- Each quadrant: `--surface` card, hairline border, small radius, faint corner numeral, and a short caption line under its media where noted.
- A quiet "← Portfolio" / home affordance (top-left) returns to landing.
- Responsive: on narrow screens the quadrants stack to a single column (1, 2, 3, 4 top-to-bottom).

### Quadrant content spec

**View A — CAN-RGX Project (CLOT-LESS)**

| # | Content | Type | Notes |
|---|---------|------|-------|
| 1 | `assets/pdf/canrgx-images.pdf` | Embedded PDF | Project-state images. Caption underneath. Hover + scroll through pages. |
| 2 | `assets/pdf/iac-2026-a1-3-9-x113307-brief.pdf` | Embedded PDF | Accepted IAC abstract. Caption underneath. Same viewer. |
| 3 | YouTube video (software in progress) | YouTube facade | **Link pending from Adrian** — use a placeholder until provided. |
| 4 | **Empty / TBD** | — | Not specified. Decide with Adrian: leave blank, repeat a wide item, or add a short "About the project" text card (see §11). |

**View B — Anesthesia in Microgravity**

| # | Content | Type | Notes |
|---|---------|------|-------|
| 1 | `assets/video/microgravity-flight-1.mp4` | Self-hosted video *or* YouTube/Vimeo embed | ESA/Novespace parabolic flight. **Routing depends on file size — see §6.** |
| 2 | `assets/img/setup-1.png` + `assets/img/setup-2.png` | Image pair + lightbox | Experimental setup. Two images in one quadrant (2-up), click to enlarge. |
| 3 | `assets/pdf/anesthesia-iac-presentation.pdf` | Embedded PDF | IAC presentation. |
| 4 | `assets/pdf/poster-presentation.pdf` | Embedded PDF | Canadian Space Conference poster. |

---

## 5. Components (reusable)

### 5.1 Embedded PDF viewer
- API: a container element with `data-pdf="assets/pdf/xxx.pdf"` and optional `data-caption="…"`.
- Default render: `<iframe>` pointing at the PDF with `#toolbar=0&navpanes=0&view=FitH`, sized to fill the quadrant, rounded + bordered, with the caption below.
- **Lazy:** the `src` is set only when the view becomes active (and ideally when the quadrant enters the viewport). Until then, the box shows a faint loading/placeholder state.
- Scroll-through: mouse-over scroll moves through pages natively.
- **Escalation:** expose the same API but allow an internal PDF.js implementation. If used, lazy-import `pdfjs-dist`, render pages to `<canvas>` in a scroll container, only rendering pages near the viewport. Decide per-PDF after visually checking the native result.

### 5.2 YouTube facade
- Renders a poster image (or a neutral `--surface` panel with a play glyph) until clicked.
- On click, injects the YouTube `<iframe>` (`youtube-nocookie.com/embed/ID`). Accepts a video ID/URL via `data-yt`.
- Responsive 16:9. Lazy by definition.

### 5.3 Self-hosted video (`<video>`)
- `<video controls preload="metadata" playsinline poster="…">` with the MP4 source.
- Lazy: set `src`/`<source>` on view activation.
- Requires a compressed, web-optimized MP4 (H.264, `faststart`/moov-atom at front, 720p–1080p). See §6.

### 5.4 Image pair + lightbox
- Quadrant shows the two images as a 2-up (side-by-side, or stacked if portrait), `object-fit: cover`, hairline border.
- Click → vanilla lightbox overlay (`--bg` at high opacity, blur), shows the full image, `Esc`/backdrop/✕ to close, basic focus management. Keyboard accessible.
- Images served as **WebP** (with PNG fallback only if needed).

---

## 6. Asset plan

### Folder structure (all paths RELATIVE — project repo is served from `/portfolio/`)
```
/index.html
/.nojekyll
/css/        tokens.css, base.css, components.css
/js/         app.js (router+dock), pdf-viewer.js, media.js
/fonts/      (only if a licensed Avenir file is provided)
/assets/
  /pdf/      canrgx-images.pdf, iac-2026-a1-3-9-x113307-brief.pdf,
             anesthesia-iac-presentation.pdf, poster-presentation.pdf
  /img/      setup-1.png/.webp, setup-2.png/.webp, (poster/video posters)
  /video/    microgravity-flight-1.mp4  (only if self-hosted)
```
> Use **relative** paths everywhere (`assets/...`, `css/...`) — never root-absolute (`/assets/...`), which would 404 under the `/portfolio/` subpath.

### Filename normalization (rename map — do this first)
Commas, spaces, and double dots break URLs. Rename on copy into `/assets`:

| Original | Renamed |
|----------|---------|
| `CANRGX-Images.pdf` | `canrgx-images.pdf` |
| `IAC-26,A1,3,9,x113307.brief.pdf` | `iac-2026-a1-3-9-x113307-brief.pdf` |
| `Anesthesia-IAC-Presentation.pdf` | `anesthesia-iac-presentation.pdf` |
| `Poster_presentation.pdf` | `poster-presentation.pdf` |
| `microgravity_flight_1.mp4` | `microgravity-flight-1.mp4` |
| `Screenshot 2026-06-13 131153.png` | `setup-1.png` |
| `Screenshot 2026-06-13 150302.png` | `setup-2.png` |

### Video size decision (View B, quadrant 1)
- GitHub blocks files **> 100 MB** (warns > 50 MB); GitHub Pages also has soft bandwidth limits. A large raw flight video will be rejected or load slowly.
- **If `microgravity-flight-1.mp4` > ~40–50 MB:** upload it to YouTube or Vimeo (unlisted) and embed via the facade (5.2) instead of committing it. Lighter, faster, no repo bloat.
- **If ≤ ~40 MB after compression:** self-host. Transcode to H.264 720p with `-movflags +faststart`; add a poster frame.
- Either way, **compress before committing.**

### Pending inputs (placeholders until provided)
- **YouTube link** for View A, quadrant 3.
- **View A, quadrant 4** content decision.
- The actual asset files placed in `/assets/...` under the normalized names.

---

## 7. Performance

- **Near-instant landing:** landing loads only HTML + tiny CSS + tiny JS + the fallback font. No PDFs, no video players on first paint.
- **Defer everything heavy:** PDF iframes, the self-hosted video, and the YouTube iframe load only when their view is active, gated further by `IntersectionObserver` per quadrant.
- **Fonts:** system Avenir first (no download for Apple users); fallback Nunito Sans subset, `display=swap`, `preconnect` to Google Fonts.
- **Images:** WebP, correctly sized, `loading="lazy"`, `decoding="async"`.
- **CSS/JS:** keep minimal and unminified-but-small; no render-blocking third-party scripts. PDF.js (if used) is lazy-imported only for the PDFs that need it.
- **Targets:** Lighthouse Performance ≥ 95 on the landing; Largest Contentful Paint < 1.5 s on a normal connection; total first-load transfer (landing) well under ~150 KB excluding lazy assets.

---

## 8. GitHub Pages deployment

1. Initialize/clone `pharmbro23/portfolio`, place all files at **repo root** (no build step).
2. Add an empty **`.nojekyll`** file at root (prevents Jekyll processing and lets all static files/folders serve as-is).
3. Confirm **all asset/script/style references are relative** (works under `/portfolio/`).
4. Commit and push to `main`.
5. GitHub → repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/ (root)`**. Save.
6. Wait for the build, then verify at `https://pharmbro23.github.io/portfolio/`.
7. **Verify in an incognito window:** each PDF renders inline and scrolls; the YouTube facade loads on click; the video plays; images open in the lightbox; no 404s in the console (catches path/filename mistakes).
8. Add a short `README.md` (what the site is, how to update assets, how it deploys).

---

## 9. Subagent task breakdown (4 agents, with contracts)

> The lead defines the **shared contract** in Phase 1: the CSS variable names (§3), the component init APIs (§5), the `/assets` structure and normalized filenames (§6), and the hash-router view IDs (§4). All agents code against these.

**Agent 1 — Foundation & shell** (`design-foundation`)
- **Owns:** `index.html` (structure + view containers), `css/tokens.css`, `css/base.css`, `js/app.js` (hash router + dock interaction + view cross-fade), font setup, responsive base.
- **Goal:** the design system, the landing (title + dock with hover reveal), the three empty view shells, and navigation — pixel-clean and on-palette, no media yet.
- **Output / done:** landing looks finished; dock hover + click + routing work; quadrant grid lays out correctly (with empty placeholders); contract published for others.

**Agent 2 — PDF viewer component** (`pdf-embed`)
- **Owns:** `js/pdf-viewer.js`, PDF-specific styles in `css/components.css` (its own clearly-scoped section).
- **Goal:** the reusable embedded PDF viewer (5.1) — native-first, lazy, scroll-through, caption support; optional PDF.js escalation behind the same API.
- **Output / done:** mounting `data-pdf` containers renders scrollable, chrome-free PDFs; visually verified against the native result; escalation documented.

**Agent 3 — Media components** (`media-embed`)
- **Owns:** `js/media.js` (YouTube facade + `<video>` handling + lightbox), media styles in its own scoped section of `css/components.css`.
- **Goal:** YouTube facade (5.2), self-hosted video component (5.3), image-pair lightbox (5.4); all lazy; all on-palette.
- **Output / done:** facade loads player on click; video plays; image pair opens in an accessible lightbox.

**Agent 4 — Assembly, performance & deploy** (`integrate-and-ship`)
- **Owns:** the two project-view markup blocks inside `index.html` *(handed off region — Agent 1 leaves clearly-marked mount points so this doesn't collide)*, `IntersectionObserver` lazy-load orchestration, asset normalization/optimization (rename map, WebP, video compression decision), `.nojekyll`, `README.md`, and the GitHub Pages config + verification.
- **Goal:** wire real (or placeholder) assets into the quadrants using Agents 2 & 3's components, hit the performance targets, and deploy.
- **Output / done:** both views fully populated; Lighthouse target met; site live and verified in incognito.

> To avoid the `index.html` overlap between Agent 1 and Agent 4: Agent 1 inserts empty, clearly-commented `<!-- MOUNT: view-a-quadrants -->` regions; Agent 4 fills only those regions. The lead resolves any conflict at integration.

---

## 10. Build sequence

1. **Phase 1 (lead + Agent 1):** scaffold repo, write tokens/base CSS, build landing + dock + router + view shells. Publish contract. Define the four subagent files in `.claude/agents/` (all `model: claude-opus-4-8`).
2. **Phase 2 (Agent 2 ∥ Agent 3):** build PDF viewer and media components in parallel against the contract (disjoint files).
3. **Phase 3 (Agent 4 → lead):** normalize/optimize assets, populate both views, wire lazy-loading, run Lighthouse, fix paths, deploy to GitHub Pages, verify in incognito. Lead does final QA against §12.

---

## 11. Open items — confirm / provide before (or during) the build

1. **YouTube link** for View A · quadrant 3 (software-in-progress video).
2. **View A · quadrant 4** — currently unspecified. Leave empty, or add (e.g.) a short "About / abstract" text card or another image?
3. **Asset files** — drop the seven files into `/assets/...` under the normalized names in §6.
4. **Dock hover behavior** — confirm the interpretation in §4 (short label at rest → full project name on hover).
5. **`microgravity-flight-1.mp4` size** — over ~40–50 MB? If so it goes to YouTube/Vimeo per §6.
6. **Avenir** — do you have a licensed web-font file to self-host, or use the system-Avenir + Nunito Sans fallback?

---

## 12. Acceptance checklist

- [ ] Palette matches §3 (cream/white/grey + faint brown only); zero purple/black/blue.
- [ ] Avenir on Apple devices; clean fallback elsewhere.
- [ ] Title reads "Portfolio — Adrian Tabari"; dock reveals full names on hover and routes on click.
- [ ] Both views show a margined 2×2 quadrant grid with faint 1–4 numerals; stacks cleanly on mobile.
- [ ] PDFs embed inline, hide chrome, and scroll through on hover; captions present where specified.
- [ ] YouTube loads only on click; self-hosted video plays; image pair opens in lightbox.
- [ ] All paths relative; site works at `pharmbro23.github.io/portfolio/`; no console 404s in incognito.
- [ ] `.nojekyll` present; Pages deploys from `main` / root.
- [ ] Lighthouse Performance ≥ 95 on landing; landing first-load < ~150 KB excluding lazy assets.
- [ ] Built entirely with Opus 4.8 (lead + subagents); ≤ 4 subagents.
