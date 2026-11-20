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
6. **Current presentation assets only:** nav v4, identity portrait v1 text tiles, wave v6, seamless v8 for RU+EN and light+dark. Older versioned, unreferenced SVGs are archival; do not bulk-rewrite or delete them. Raster/GIF portraits are separate sources and must be verified for color-field edge mismatch when their surrounding SVGs change.

## Exact layout contract

- GitHub README uses contiguous inline `<picture>` markup in one `<div align="center">`; avoid indentation, newlines, spaces or Markdown paragraphs **between adjacent panel images**. `<br/>` is a deliberate row break only. An empty line or a stray inline whitespace node can create visible seams on GitHub.
- Four navigation tiles are 25% each (`220` SVG units × 4 = `880`), and the intro row consists of a 60% text tile (`528` SVG units) and a 40% portrait (`352` logical units). The contribution calendar is 100% wide, with an outer SVG `viewBox="0 0 880 235"` and full-bleed `rect width="880" height="235"`. Four section wave tiles and each project row are also 25% × 4.
- The row order is **navigation → intro/portrait → calendar → four section links → project rows** in both `README.md` and `README.en.md`. Put the calendar **below the portrait but above the section navigation**, not at the very bottom.
- Use `<img align="top">` on each panel to avoid baseline gaps. Outer surfaces must join without spacing even at narrow widths; text and glyphs may have their own *internal* insets.
- There are **two separate width contracts**: the outer 880-unit SVG panel must align with the other full-width rows; the calendar's internal plot should use most available horizontal space without clipping weekday labels. Current plot: 53 potential columns, 15-unit pitch, 12×12-day cells, 3-unit gutters, left x=55. Do not confuse internal chart padding with a page-level gap.
- Regenerating `nav-*-v4-*.svg` via `previews/profile/header.mjs` must preserve the 70-unit height and **apply the current Vanya UI colors** rather than copying old v2 colors.
- When changing markup, update `previews/profile/verify.mjs` indices/tests to include the calendar row: indices 0–3 nav, 4–5 intro+portrait, 6 calendar, 7–10 wave sections; then project rows. Verify header-to-intro, intro-to-calendar, calendar-to-sections gaps are all zero, and calendar width matches the four nav tiles.

## Contribution-calendar contract

- The date/count source is GitHub `contributionsCollection.contributionCalendar` via GraphQL if `GITHUB_TOKEN` is configured as a **Cloudflare Secret**; fallback to public daily counts only. Never reconstruct daily count from GitHub's 0–4 visual levels, invent days, embed token in URLs or commit secrets.
- Use **21 per-theme color steps**: index 0 = *neutral inactive*; 1…20 = progressively **darker**, more contributions → darker terracotta. Derive the active ramp with the canonical theme accent as an anchor and use the same numeric intensity on RU/EN and light/dark.
- Use logarithmic activity normalization against the nonzero day's p99 value (details in `contributions/README.md`). Keep any fallback state explicit.
- **Weeks start on Monday**, not Sunday. In JavaScript the UTC offset is `(date.getUTCDay() + 6) % 7`; top row is Monday (0), bottom row Sunday (6), and `weekIndex * 7 + rowIndex` must map back to the correct actual date.
- RU has `пн / ср / пт`; EN has `Mon / Wed / Fri`. With Monday-first rows the visible labels belong at indices **0, 2, 4**; localize months, heading, legend, alt texts, fallback and date captions as necessary.
- The two SVG endpoints are controlled with `theme=light|dark` and `lang=ru|en`; embed via `<picture><source media="(prefers-color-scheme: dark)">…</picture>` in both READMEs. Bump image-cache revision on changes to SVG output (currently `v=7`) and update BOTH embed URLs AND the Worker's server-side cache key.
- The Worker is separately deployed on Cloudflare as `vanya-contributions`. A GitHub commit alone does NOT deploy it: update the running Worker, verify response and both URLs, then report what was done.
- Do not add scheduled GitHub Actions: the intended policy is to keep only backup jobs automated.

## Verification checklist for every change

1. Inspect `@vanya/ui/src/tokens.css`; compare actual OKLCH values and ensure the background rect in every *active* SVG matches the corresponding `--ground`, not the previous `#1E1C1A` / `#F6F5F0` palettes.
2. Confirm RU / EN both exist, including *dark* / *light* pictures. No stray Cyrillic in EN calendar labels or untranslated legend/fallback. Spot-check at least one specific Monday and Sunday to verify day-to-cell mapping.
3. Inspect rendered **GitHub Markdown**, not just raw SVG, in light/dark modes, desktop and mobile width. Measure bounding boxes if possible: adjacent panel gaps must be zero, the calendar's outer width must match the nav+sections rows. Use `previews/profile/verify.mjs` for 1100, 390 and 375px profile/file contexts, adapting its fixtures as needed.
4. Confirm that the contribution bar remains exactly 21 shades, zero is neutral, and highest active days are darkest. Check actual data-source failures rather than silently showing fabricated counts.
5. If a changed SVG's background no longer matches a GIF/PNG portrait, either regenerate the raster source with the canonical background or disclose that remaining limitation. Do not claim perfect visual uniformity without checking that seam.
6. Keep PR work on the existing feature branch unless told to merge. Link the PR and published Worker preview and describe any checks that could not run.

## File responsibilities

- `AGENTS.md` (this file): cross-cutting, durable **generation and QA rules**.
- `contributions/README.md`: calendar implementation details, data sources and cache/deploy operations.
- `README.md` and `README.en.md`: only the user-facing visual profile; avoid adding engineering prose that disrupts zero-gap layout.
- `previews/profile/`: browser preview and layout verification, especially for detecting subpixel seams.
