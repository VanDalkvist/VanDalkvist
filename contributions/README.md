# Contribution heatmap · VANYA / ARC (v1)

This graph is part of the [GitHub profile README](../README.md), after the project tiles.

## Live preview

- [Dark SVG](https://vanya-contributions.vanyagpt777.workers.dev/?theme=dark&v=3)
- [Light SVG](https://vanya-contributions.vanyagpt777.workers.dev/?theme=light&v=3)
- Worker name in Cloudflare: `vanya-contributions`
- Source of the deployed Worker: [worker.js](./worker.js)

## Design

- Native SVG, `880 × 235` viewBox aligned with the existing 4 × 220 profile SVG grid.
- Existing profile backgrounds (`#1E1C1A`, `#F6F5F0`), Manrope and terracotta accent system.
- 21 discrete colors **per theme**: index `0` for no contributions; `1…20` for increasing activity.
- The contribution count is **not** GitHub's four color levels. Each date retains its exact count.
- Intensity is `ceil(20 * log1p(count) / log1p(p99PositiveDailyCount))`, clamped to `1…20`. Days at or above the active-day 99th percentile use step 20; zero uses step 0.
- Rolling-year calendar uses up to 366 inclusive dates (matching the range of GitHub's rolling-year presentation) and native SVG `title` elements per day.
- Both themes share dates and intensity values. Only the visual palette changes.

## Data sources

1. **Preferred:** official GitHub GraphQL `contributionsCollection.contributionCalendar.weeks[].contributionDays[]` when the Worker has a `GITHUB_TOKEN` secret. This is a GitHub Free capability, and can include owner-visible activity.
2. **No-token fallback:** GitHub's public `/users/VanDalkvist/contributions` HTML. Exact counts are read from daily tooltips, never inferred from the 0–4 color levels.
3. **If GitHub HTML is unavailable:** `github-contributions-api.jogruber.de/v4/VanDalkvist?y=last`. This is a third-party public service; it has no access to any GitHub token.
4. On total upstream failure the SVG explicitly says the data are temporarily unavailable. It never fills a heatmap with invented daily counts.

**Current caveat:** When initially checked on 2026-11-20, the public feed showed **5,163** contributions for the rolling window, while the owner's screenshot showed **5,201**. This discrepancy is not interpreted as a change in productivity; it may reflect owner-visible/private contributions or reporting-window differences. Configure the optional official GraphQL source to investigate and align the values.

## Optional GitHub GraphQL token

In the Cloudflare dashboard, open **Workers & Pages → vanya-contributions → Settings → Variables and Secrets**, then add an encrypted **Secret** named `GITHUB_TOKEN` containing a GitHub token permitted to read the profile's contribution calendar. Never put it in `README.md`, JavaScript source, repository secrets committed as text, or URL parameters.

The Worker will prefer GitHub's official GraphQL calendar on the next uncached response. It falls back to public sources if the API fails. Rotate the SVG URL's `v` parameter and the Worker cache-key revision when validating changes, since GitHub also proxies and caches images.

## Operations

- Cloudflare caches successful SVG responses for four hours; the browser may cache for one hour. GitHub's image proxy can introduce additional latency.
- **No GitHub Actions were created.** In particular, this project adds no scheduled CI runs; this respects the separate requirement to keep only backup GitHub Actions automated.
- The Worker was first deployed via Cloudflare API; editing `worker.js` on GitHub does **not** automatically deploy it. Deploy the updated module manually to the `vanya-contributions` Worker.
- Leave this feature on a separate branch/PR until the visual presentation and owner-visible data are approved. Don't merge automatically.
- This is a *contribution* calendar, not a pure commit history; GitHub counts qualified pull requests, issues, commits, and other eligible activity.

## Manual verification

1. Open both SVG URLs. Both must render the same dates and totals and use clearly different theme backgrounds.
2. Verify that each day rect has a `title` with a real integer count.
3. Confirm 21 hex values in each palette (`0…20`).
4. Verify a rendered GitHub README preview: `prefers-color-scheme` must pick the corresponding SVG.
5. If exact total differs from GitHub when signed in, set the GraphQL secret and compare ranges before asserting equivalence.
