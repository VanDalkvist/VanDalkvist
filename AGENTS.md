# GitHub profile generation contract

Scope: `README.md`, `README.en.md`, the SVGs they reference, portrait/media assets, `contributions/worker.js`, and the profile preview/generation scripts. These are operational instructions for agents changing this repository. For general project description, keep using the GitHub profile README; for the contribution service's API details, see [contributions/README.md](contributions/README.md).

## Design authority

1. **The source of truth is [`@vanya/ui/src/tokens.css`](https://github.com/VanDalkvist/vanya-ui/blob/main/src/tokens.css)**, specifically its `:root` and `.dark` blocks. Never infer colors from another SVG, a screenshot, a CSS comment, or a previous branch. If tokens change, regenerate the assets before calling them aligned.
2. SVGs cannot rely on CSS variables from the host GitHub README. Convert canonical `oklch(L C h)` values to in-gamut sRGB/hex in the generator. Do not duplicate independent theme palettes across files.
3. Representative conversions, accurate to the currently inspected design-system values:

   | Semantic role | Light | Dark |
   | --- | --- | --- |
   | `--ground` (full-bleed background) | `#F6F3ED` | `#15120F` |
   | `--ink` (primary text) | `#2A241F` | `#EBE7E2` |
   | `--ink-faint` (metadata) | `#635C57` | `#97918A` |
   | `--accent` | `#AA4C23` | `#F2814A` |
   | `--border` on `--ground` (10% alpha composite) | `#E2DED8` | `#2C2A27` |

4. Preserve meaningful transparency and drawing geometry. The border color above is an **opaque approximation of a 10% alpha composited border**, not a replacement for CSS `--border` in web UIs. Recalculate if the design system changes. For SVG stroke elements with additional `opacity`, preserve that extra opacity.
5. The current profile uses Manrope for UI typography, Fraunces only for editorial text, and JetBrains Mono for code/short metadata. Preserve the existing visual rhythms, calm layout, and reduced-motion fallbacks. Do not recolor halftone portrait layers as if they were one flat SVG background.
6. **Current presentation assets only:** nav v4, identity portrait v1 text tiles, wave v6, seamless v8 for RU+EN and light+dark. Older versioned, unreferenced SVGs are archival; do not bulk-rewrite or delete them. The original GIF/PNG portraits remain archived; the active README uses `avatar-portrait-dark-v7.svg` / `avatar-portrait-light-v2.svg`, with canonical `--ground` backgrounds and one-shot vector reveal. Do not reintroduce a mismatched raster portrait as a fallback.

## Exact layout contract

- GitHub README uses contiguous inline `<picture>` markup in one `<div align="center">`; avoid indentation, newlines, spaces or Markdown paragraphs **between adjacent panel images**. `<br/>` is a deliberate row break only. An empty line or a stray inline whitespace node can create visible seams on GitHub.
- Four navigation tiles are 25% each (`220` SVG units × 4 = `880`), and the intro row consists of a 60% text tile (`528` SVG units) and a 40% portrait (`352` logical units). The contribution calendar is **four adjacent 25%-width image slices** (`part=0..3`), each an SVG `viewBox="0 0 220 235"` showing one quarter of the same full-bleed 880×235 design. Four section wave tiles and each project row are also 25% × 4.
- The row order is **navigation → intro/portrait → calendar → four section links → project rows** in both `README.md` and `README.en.md`. Put the calendar **below the portrait but above the section navigation**, not at the very bottom.
- Use `<img align="top">` on each panel to avoid baseline gaps. Outer surfaces must join without spacing even at narrow widths; text and glyphs may have their own *internal* insets.
- There are **two separate width contracts**: the outer 880-unit SVG panel must align with the other full-width rows; the calendar's internal plot should use most available horizontal space without clipping weekday labels. Current plot: 53 or 54 possible week columns (depending on the rolling range), 14.5-unit pitch, 11.5×11.5-day cells, 3-unit gutters, left x=80; weekday labels begin at x=26 and do not touch the grid. Do not confuse internal chart padding with a page-level gap.
- Regenerating `nav-*-v4-*.svg` via `previews/profile/header.mjs` must preserve the 70-unit height and **apply the current Vanya UI colors** rather than copying old v2 colors.
- When changing markup, update `previews/profile/verify.mjs` indices/tests to include the calendar row: indices 0–3 nav, 4–5 intro+portrait, 6–9 calendar slices, 10–13 wave sections; then project rows. Verify header-to-intro, intro-to-calendar, calendar-to-sections gaps are all zero, and calendar width matches the four nav tiles.

## Contribution-calendar contract

- The date/count source is GitHub `contributionsCollection.contributionCalendar` via GraphQL if `GITHUB_TOKEN` is configured as a **Cloudflare Secret**; fallback to public daily counts only. Never reconstruct daily count from GitHub's 0–4 visual levels, invent days, embed token in URLs or commit secrets.
- Use **21 per-theme color steps**: index 0 = *neutral inactive*; 1…20 = progressively **darker**, more contributions → darker terracotta. Derive the active ramp with the canonical theme accent as an anchor and use the same numeric intensity on RU/EN and light/dark.
- Use logarithmic activity normalization against the nonzero day's p99 value (details in `contributions/README.md`). Keep any fallback state explicit.
- **Weeks start on Monday**, not Sunday. In JavaScript the UTC offset is `(date.getUTCDay() + 6) % 7`; top row is Monday (0), bottom row Sunday (6), and `weekIndex * 7 + rowIndex` must map back to the correct actual date.
- RU has `пн / ср / пт`; EN has `Mon / Wed / Fri`. With Monday-first rows the visible labels belong at indices **0, 2, 4**; localize months, heading, legend, alt texts, fallback and date captions as necessary.
- A full standalone 880-unit calendar is available without `part`; embed **all four cropped `part=0|1|2|3` endpoints** with `theme=light|dark` and `lang=ru|en` via `<picture><source media="(prefers-color-scheme: dark)">…</picture>` in both READMEs. Bump image-cache revision on changes to SVG output (currently `v=14`) and update BOTH embed URLs AND the Worker's server-side cache key.
- The Worker is separately deployed on Cloudflare as `vanya-contributions`. A GitHub commit alone does NOT deploy it: update the running Worker, verify response and both URLs, then report what was done.
- Do not add scheduled GitHub Actions: the intended policy is to keep only backup jobs automated.

## Staggered animation contract and limitations

- Preserve the accepted halftone portrait **as vector geometry** in `assets/avatar-portrait-dark-v7.svg` and `assets/avatar-portrait-light-v2.svg`. Its `.b` bands use their original roughly 5.3-second one-shot reveal. Both include a `prefers-reduced-motion` static final state. The original looping GIFs remain in `assets/` for archival comparison, but must not be referenced in the active profile.
- Stage the wave across all four adjacent fragments with the **same delay**: `.w` ink reveal starts at 5.8s and lasts 2.8s; pulse follows at 8.6s. Keep the four wave segments' animation clocks/presets identical.
- Stage the 16 project cards **in reading order**, sections Narrative → Games → Products → Agents, tile 1–4 in each: card `i` uses text start `8.90 + i × 0.90` seconds, icon start `text + 0.20s`, text duration `0.45s`, line duration `0.70s`. RU/EN/dark/light must have identical times for matching card indices; all animation elements use `fill-mode: both`.
- **Hard platform limit:** GitHub README is sanitized static Markdown. Each externally embedded SVG is its own document and starts its CSS timing at its own load/decode moment. Browser lazy loading, cache and reduced-motion preferences prevent guaranteed single-clock or event-driven choreography across these assets. These are approximate sequenced delays, not guaranteed pixel-perfect global synchronization. Do not promise otherwise; true synchronization requires an interactive hosted page with a shared timeline.
- Use `@media(prefers-reduced-motion:reduce)` to render all portrait/wave/project content at its final state without waiting. Project links must remain working external anchors; do not replace the 16 tiles with one unclickable video or raster.
- Do not leave a separator path under the intro text. Both light/dark RU/EN identity SVGs must omit the old `M27 306 H505` divider.

## Verification checklist for every change

1. Inspect `@vanya/ui/src/tokens.css`; compare actual OKLCH values and ensure the background rect in every *active* SVG matches the corresponding `--ground`, not the previous `#1E1C1A` / `#F6F5F0` palettes.
2. Confirm RU / EN both exist, including *dark* / *light* pictures. No stray Cyrillic in EN calendar labels or untranslated legend/fallback. Spot-check at least one specific Monday and Sunday to verify day-to-cell mapping.
3. Inspect rendered **GitHub Markdown**, not just raw SVG, in light/dark modes, desktop and mobile width. Measure bounding boxes if possible: adjacent panel gaps must be zero, the calendar's outer width must match the nav+sections rows. Use `previews/profile/verify.mjs` for 1100, 390 and 375px profile/file contexts, adapting its fixtures as needed.
4. Confirm that the contribution bar remains exactly 21 shades, zero is neutral, and highest active days are darkest. Check actual data-source failures rather than silently showing fabricated counts.
5. The active portrait must be a dark/light SVG using the canonical background. Confirm `preserveAspectRatio="none"` eliminates transparent letterboxing. If adding a GIF/PNG again, regenerate it with the same background and verify decoded edge pixels. Archived GIFs are not active. Do not claim perfect visual uniformity without checking that seam.
6. Keep PR work on the existing feature branch unless told to merge. Link the PR and published Worker preview and describe any checks that could not run.

## File responsibilities

- `AGENTS.md` (this file): cross-cutting, durable **generation and QA rules**.
- `contributions/README.md`: calendar implementation details, data sources and cache/deploy operations.
- `README.md` and `README.en.md`: only the user-facing visual profile; avoid adding engineering prose that disrupts zero-gap layout.
- `previews/profile/`: browser preview and layout verification, especially for detecting subpixel seams.

## Typographic hierarchy and calendar spacing

- Navigation section headings in wave tiles use Manrope `21`, weight `600`. Section headings above project grids (`seamless-*-v8-tile-1..4-*.svg`) must also use Manrope `21`, weight `600` across RU/EN and light/dark; project *names* use Manrope `16`, weight `600`. Keep the four-slice, full-width heading geometry and line at y=105.
- The calendar heading is one line: `Ритм работы · N contributions` / `Work rhythm · N contributions`. The count is a subordinate `<tspan>`, not separately right-aligned; number formatting respects the page language.
- No Less/More legend, color-chip swatches, or `VANYA / ARC · GitHub` footer credit. **Keep SVG height 235** and its full-bleed background unchanged: the intentionally empty bottom space separates the grid visually from the next section without introducing a DOM gap.
- After modifying `contributions/worker.js`, advance both embed revisions and the Worker cache key, then deploy the Cloudflare Worker manually.

## Contribution windows animation

- Every positive-contribution cell has an always-visible neutral inset rect and a colored overlay (`window-light`); no-contribution cells are never animated.
- The colored overlays switch on **during the first ~5 seconds** of the portrait's ~5.28-second reveal. Deterministic FNV-1a hash of each ISO date sets delay (0.10–4.15 seconds) and one of three effects: a clean click, a brief irregular flicker, or a soft warm-up. No random values at render time, so RU/EN and both color themes agree on the date-to-delay mapping.
- Each overlay ends at opacity 1 and keeps the correct 21-step color. `prefers-reduced-motion:reduce` bypasses animations, showing every cell in its correct final state immediately. Missing CSS animation support also leaves the final state visible.
- The four `part=0..3` slices share identical styles and delays from the one full 880-unit SVG; never generate their sequences independently. GitHub's independent image loading prevents a *guaranteed* common start with the portrait, but the timing is designed to overlap it.

## Authenticated GitHub GraphQL and timezone correctness

- `GITHUB_TOKEN` is a **Cloudflare encrypted secret**, never a GitHub repository secret or a value committed to README. Read only via `env.GITHUB_TOKEN`. The token must be owned by `VanDalkvist` with the minimal `read:user` classic-token scope. If GraphQL fails, the Worker deliberately falls back to public data.
- Official GraphQL `viewer.login` and `contributionCalendar.totalContributions` are requested for a non-sensitive owner/source sanity check. The Worker sends source/owner-match/total response headers for diagnostics, but never exposes private repository names or the token.
- The GitHub calendar uses the account-local contribution date. **Do not drop a positive final day just because its date is tomorrow in UTC.** Support the one-day local timezone offset and keep the `nowUTC + DAY` upper bound, without extending the chart into empty future days.
- On changes to authenticated data sources or timezone handling, advance the Cloudflare cache version and *both* GitHub image revisions so cached public SVGs are not mistaken for private-inclusive results.
