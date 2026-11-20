# Contribution heatmap · VANYA / ARC (v3)

Calendar is inserted **directly under the portrait** and **before the four section navigation tiles** on **both** [RU](../README.md) and [EN](../README.en.md) profile pages.

## Previews

| Language | Dark | Light |
|---|---|---|
| RU | [Dark SVG](https://vanya-contributions.vanyagpt777.workers.dev/?theme=dark&lang=ru&v=11) | [Light SVG](https://vanya-contributions.vanyagpt777.workers.dev/?theme=light&lang=ru&v=11) |
| EN | [Dark SVG](https://vanya-contributions.vanyagpt777.workers.dev/?theme=dark&lang=en&v=11) | [Light SVG](https://vanya-contributions.vanyagpt777.workers.dev/?theme=light&lang=en&v=11) |

Cloudflare Worker: `vanya-contributions`; source: [worker.js](./worker.js).

## Visual authority and scale

- Canonical color source: [Vanya UI CSS tokens](https://github.com/VanDalkvist/vanya-ui/blob/main/src/tokens.css). The Worker uses the exact OKLCH source values for `--ground`, `--ink`, `--ink-faint`, `--accent`, `--surface` / `--surface-inset` and converts to hex for standalone SVG.
- 21 colors per theme: 0 is neutral/no activity, **1–20 go from light terracotta to deep terracotta**. More contributions ⇒ **darker filled cell**, in either theme. The ramp has the exact theme accent as a color stop.
- Calendar geometry: one 880×235 SVG can be viewed directly, but the GitHub README uses **four cropped 220×235 SVG tiles** from `part=0..3`, each occupying `25%` of the row, exactly like the other profile panels. Cells use **11.5 × 11.5** units with a **14.5-unit pitch (3-unit gutters)**, starting at x=80 to keep English weekday labels clear. The full background extends to all tile edges, with no outer blank margins.
- The profile uses consecutive inline `<picture>` elements, `<img align="top">`, one `<br/>` at each row boundary and no empty Markdown paragraphs. Each group of four section/project tiles remains `25%` wide per tile; calendar is **four adjacent 25% tiles** whose cropped viewports form the full-width composition. No extra spacer, line, blank row, or padding was inserted between panels.
- **Background alignment:** All *active* profile tile SVG backgrounds have already been migrated to Vanya UI, including the replacement animated vector portrait. Older generated GIFs and unused historical SVG variants are intentionally retained as archives.
- Reuse a single date/count/intensity model for all four localized theme variants.

## Four-part embedding

To avoid GitHub's different `width="100%"` handling for a lone linked image, the profile embeds four consecutive `<picture>` images with `width="25%"`, `align="top"`, and `part=0..3`. The Worker produces each quarter by clipping **the same 880×235 render**, keeping all dates, text, and colors aligned. All four must be present in both RU and EN READMEs and in dark/light sources; do not insert whitespace, other elements, or separate line breaks between the four images.

Standalone SVGs without `part` remain available at the preview links above. The Worker cache key includes `part`.

## Calendar week order

- ISO layout: **Monday is the first row**, then Tuesday, Wednesday, Thursday, Friday, Saturday and Sunday. JavaScript UTC weekday is normalized with `(getUTCDay() + 6) % 7` before computing the first calendar week. Week columns and month captions both use Monday as their anchor.
- RU weekday labels are **пн, ср, пт** on rows 0, 2, 4. EN weekday labels are **Mon, Wed, Fri** on the same rows.
- Every theme and language uses the identical date-to-cell mapping, not separate permutations. A date retains its exact contribution count.

## Daily data and normalization

- Official GitHub GraphQL `user.contributionsCollection.contributionCalendar.weeks[].contributionDays[]` is preferred **when a `GITHUB_TOKEN` Cloudflare secret is configured**.
- Without a token, the Worker reads daily counts from GitHub's public contributions HTML (not its four-level color buckets). Fallback: `github-contributions-api.jogruber.de`. Neither is allowed access to a private token.
- 0 maps to level 0. A positive count maps to `clamp(ceil(20 * log1p(count) / log1p(p99_positive_count)), 1, 20)`. Peak outliers do not flatten the rest of the year.
- Counts correspond to GitHub *contributions*, not only commits. The public source once differed from the owner's visible total, so official private-inclusive parity is not claimed until authenticated GraphQL is configured.

## Operations

- GitHub Actions: no new action, no scheduled CI.
- Successful SVG responses are cached at the Cloudflare edge for 4h; browser may cache for 1h, GitHub image proxy may cache further. Cache revision `v=11`, partitioned by theme, language, and cropped part (`0…3` or full).
- Cloudflare updates are deployed **manually** via API. Updating source on GitHub alone does not deploy.
- Cloudflare: **Workers & Pages → vanya-contributions → Settings → Variables and Secrets → Add encrypted Secret** named `GITHUB_TOKEN` if exact owner-visible contribution counts are required. Never add the token to this repo, client code, or the image URL.
- This feature stays on the draft PR until the owner approves the actual GitHub-rendered dark/light profile and any desired background harmonization.

## Manual visual checklist

- [ ] RU / EN: title and legend correctly localized.
- [ ] 21 colors in each theme; no contributions looks neutral; high contributions are darkest.
- [ ] Portrait / calendar / section navigation / four-tile grids are directly adjacent without added gap in markup.
- [ ] Verify the same alignment in GitHub-rendered light and dark modes (including narrow screens).
- [ ] Confirm no unexpected color seam between four slices or adjacent SVG panels (all active backgrounds use Vanya UI).
- [ ] EN month/day labels have space between them; Mon/Wed/Fri text never touches day cells.

- EN calendar translates left-hand weekdays (Mon / Wed / Fri), months, title, legend and fallback. RU uses пн / ср / пт.

## Minimal calendar presentation (v10)

- Title and activity count share one left-aligned line, e.g. **Work rhythm · 5,163 contributions**, with the count in smaller muted type.
- The Less/More text, 21-cell legend strip and VANYA / ARC · GitHub credit are intentionally omitted. The 21-step color ramp **still applies to day cells**.
- The SVG remains exactly **880 × 235** (or each 220 × 235 crop), with its 235-unit height and blank lower margin preserved to make a calm transition to the next section without an HTML spacing gap.
- Project-grid section headings now match navigation headings at 21/600 Manrope; project titles are 16/600 Manrope across all 64 active grid SVGs.

## Animated windows (v11)

- Active contribution squares start as neutral windows, then light up independently over the first roughly 5 seconds, concurrent with the vector portrait reveal.
- Each positive day has a neutral backing rectangle and a colored overlay using one of three short animations (one click, occasional flicker, gradual warm-up). Dates deterministically choose a delay of 0.10–4.15 seconds and style, consistent across RU/EN, light/dark, and four cropped slices.
- The finished state is **exactly the same 21-level color map** as the static calendar; zero-contribution days never animate. Reduced-motion users see the completed heatmap immediately.
- This is a visual sequence of independent SVG clocks, not precise global timing; GitHub may load/cache image slices and the portrait at slightly different moments.
