# Contribution heatmap · VANYA / ARC (v2)

Calendar is inserted **directly under the portrait** and **before the four section navigation tiles** on **both** [RU](../README.md) and [EN](../README.en.md) profile pages.

## Previews

| Language | Dark | Light |
|---|---|---|
| RU | [Dark SVG](https://vanya-contributions.vanyagpt777.workers.dev/?theme=dark&lang=ru&v=6) | [Light SVG](https://vanya-contributions.vanyagpt777.workers.dev/?theme=light&lang=ru&v=6) |
| EN | [Dark SVG](https://vanya-contributions.vanyagpt777.workers.dev/?theme=dark&lang=en&v=6) | [Light SVG](https://vanya-contributions.vanyagpt777.workers.dev/?theme=light&lang=en&v=6) |

Cloudflare Worker: `vanya-contributions`; source: [worker.js](./worker.js).

## Visual authority and scale

- Canonical color source: [Vanya UI CSS tokens](https://github.com/VanDalkvist/vanya-ui/blob/main/src/tokens.css). The Worker uses the exact OKLCH source values for `--ground`, `--ink`, `--ink-faint`, `--accent`, `--surface` / `--surface-inset` and converts to hex for standalone SVG.
- 21 colors per theme: 0 is neutral/no activity, **1–20 go from light terracotta to deep terracotta**. More contributions ⇒ **darker filled cell**, in either theme. The ramp has the exact theme accent as a color stop.
- Calendar geometry: `viewBox="0 0 880 235"`, same width as four `220`-wide profile panels. Day cells are **12 × 12** with a **15-unit pitch (3-unit gutters)**. The plotted calendar spans x=55…847 at 53 weeks, aligning its occupied width with neighboring panels while preserving room for weekday labels and the full 880-wide SVG ground. Outer SVG has a full-bleed background rect and *no SVG margins or padding around the panel*, while internal labels have intentional content padding.
- The profile uses consecutive inline `<picture>` elements, `<img align="top">`, one `<br/>` at each row boundary and no empty Markdown paragraphs. Each group of four section/project tiles remains `25%` wide per tile; calendar is `100%` wide. No extra spacer, line, blank row, or padding was inserted between panels.
- **Background harmonization caveat:** Existing profile tile SVGs predate the canonical Vanya UI ground colors and embed `#1E1C1A` (dark) / `#F6F5F0` (light), while Vanya UI's canonical ground is a different OKLCH value. Thus DOM spacing is zero, but slight color-field discontinuity may remain at the calendar's edge until those legacy assets are migrated to design tokens. This PR does *not* bulk-rewrite unrelated profile illustrations.
- Reuse a single date/count/intensity model for all four localized theme variants.

## Daily data and normalization

- Official GitHub GraphQL `user.contributionsCollection.contributionCalendar.weeks[].contributionDays[]` is preferred **when a `GITHUB_TOKEN` Cloudflare secret is configured**.
- Without a token, the Worker reads daily counts from GitHub's public contributions HTML (not its four-level color buckets). Fallback: `github-contributions-api.jogruber.de`. Neither is allowed access to a private token.
- 0 maps to level 0. A positive count maps to `clamp(ceil(20 * log1p(count) / log1p(p99_positive_count)), 1, 20)`. Peak outliers do not flatten the rest of the year.
- Counts correspond to GitHub *contributions*, not only commits. The public source once differed from the owner's visible total, so official private-inclusive parity is not claimed until authenticated GraphQL is configured.

## Operations

- GitHub Actions: no new action, no scheduled CI.
- Successful SVG responses are cached at the Cloudflare edge for 4h; browser may cache for 1h, GitHub image proxy may cache further. Cache revision `v=6`, partitioned by theme and language.
- Cloudflare updates are deployed **manually** via API. Updating source on GitHub alone does not deploy.
- Cloudflare: **Workers & Pages → vanya-contributions → Settings → Variables and Secrets → Add encrypted Secret** named `GITHUB_TOKEN` if exact owner-visible contribution counts are required. Never add the token to this repo, client code, or the image URL.
- This feature stays on the draft PR until the owner approves the actual GitHub-rendered dark/light profile and any desired background harmonization.

## Manual visual checklist

- [ ] RU / EN: title and legend correctly localized.
- [ ] 21 colors in each theme; no contributions looks neutral; high contributions are darkest.
- [ ] Portrait / calendar / section navigation / four-tile grids are directly adjacent without added gap in markup.
- [ ] Verify the same alignment in GitHub-rendered light and dark modes (including narrow screens).
- [ ] Confirm no unexpected color edge due to the preexisting SVG ground mismatch.

- EN calendar translates left-hand weekdays (Mon / Wed / Fri), months, title, legend and fallback. RU uses пн / ср / пт.
