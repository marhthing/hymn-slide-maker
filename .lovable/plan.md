## GHS Hymn Slide Generator

Build a single-page hymn slide generator that searches by hymn number, previews slides in-browser, and exports to PPTX and PDF — adapted to this project's TanStack Start + React + Tailwind stack (instead of a standalone HTML file).

### Files

1. **`public/GHS-1-260.json`** — copy the uploaded hymn database here so it's fetchable at `/GHS-1-260.json`.
2. **`src/lib/hymn-slides.ts`** — pure helpers:
   - `buildSlides(hymn)` → returns ordered slide objects `{ title, lines }` following the verse → chorus → verse → chorus pattern (or verse-only if no chorus). Prefixes first line with `"1. "`, `"2. "`, …, or `"Chorus: "`.
   - `downloadPptx(hymn)` — uses PptxGenJS via dynamic `import("pptxgenjs")`.
   - `downloadPdf(hymn)` — uses jsPDF via dynamic `import("jspdf")`.
3. **`src/components/SlidePreview.tsx`** — 16:9 card replicating the theme (blue base `#156082` with a 20° green→blue gradient overlay, decorative white wave in top-right via SVG/clip-path, title 28px bold navy, body centered with line-height 2.5).
4. **`src/routes/index.tsx`** — replace placeholder. Renders the full UI: header, number input (1–252) + Generate button, slide count, responsive grid of `SlidePreview` cards (2 cols desktop / 1 col mobile), and the two download buttons. Includes proper SEO `head()` (title, description, H1).
5. Install npm deps: `bun add pptxgenjs jspdf` (bundled, no CDN — TanStack Start needs proper module resolution).

### Visual design

- Color tokens added to `src/styles.css` in `oklch`: `--ghs-blue` (#156082), `--ghs-green` (#4EA72E), `--ghs-navy` (#0E2841), used through Tailwind arbitrary values or new semantic tokens (`bg-ghs-blue` etc.).
- Page header: dark navy bar with hymn-icon + title.
- Buttons: shadcn `Button` styled with the GHS blue.
- Preview card background:
  ```
  background: linear-gradient(20deg, rgba(78,167,46,0.2) 16%, rgba(21,96,130,0.6) 85%), #156082;
  ```
  plus an absolutely-positioned SVG wave at top-right (~30% white opacity).
- Fonts: prefer `Aptos Display`/`Aptos` with fallbacks `Calibri, Arial, sans-serif`.

### Slide build logic

```text
verses = [v1, v2, v3]
if chorus:
  order = [v1, chorus, v2, chorus, v3, chorus]
else:
  order = [v1, v2, v3]
```

Each slide:
- `title = hymn.title` (uppercase as in source)
- `lines = (prefix + first line) + remaining lines`
  - verse prefix: `"{n}. "`
  - chorus prefix: `"Chorus: "`

### PPTX export (pptxgenjs)

- `pptx.layout = "LAYOUT_WIDE"` (10×7.5 in)
- Per slide:
  - `slide.background = { color: "156082" }`
  - Gradient overlay rectangle (full slide) with stops at 16% green/80% transparency and 85% blue/60% transparency, angle 20°.
  - Title text box: y=0.6, fontSize 36, bold, color `0E2841`, fontFace `Aptos Display`, center, lineSpacingMultiple 0.9.
  - Body: paragraphs from `lines.split("\n")`, fontSize 32, color `0E2841`, fontFace `Aptos`, center, lineSpacingMultiple 2.5.
- Filename: `GHS_{n}_{title_with_underscores}.pptx`.

### PDF export (jsPDF)

- `new jsPDF({ orientation: "landscape", unit: "mm", format: [297, 167] })` (16:9).
- Per page:
  - Fill `#156082` full-rect, then a second `#4EA72E` rect with `GState({ opacity: 0.2 })` for gradient feel.
  - Title: bold 18pt navy, centered near top.
  - Body lines: 13pt navy, centered, line-height ~2× font size, vertically roughly centered.
- Filename: `GHS_{n}_{title}.pdf`.

### Responsiveness

- Tailwind grid: `grid-cols-1 md:grid-cols-2 gap-4`.
- Cards always 16:9 via `aspect-video`; text scales with `clamp()` so it remains legible on small screens.
- Header/input row stacks on mobile (`flex-col sm:flex-row`).
- Download buttons full-width on mobile, inline on desktop.

### Error / validation

- Reject non-integers and out-of-range numbers (1–252) with inline error text.
- Show `"Hymn #X not found."` when JSON has no match.
- Show `"Could not load hymn data…"` if fetch fails.
- Loading spinner on Generate, PPTX, and PDF actions.

### Out of scope

- No backend / server functions — all client-side.
- Decorative wave shapes are CSS/SVG only in the preview and omitted from PPTX/PDF (they were optional in the spec).
