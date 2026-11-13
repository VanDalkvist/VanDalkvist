# Portrait loop — preview round 1

Local preview only. Neither profile README nor the original portrait is changed.

## Outputs

- `avatar-portrait-dark-loop.gif`: original portrait animation, followed by its exact reverse.
- `avatar-portrait-light.svg`: same source strokes, paths, framing and original one-shot CSS motion, on warm paper.
- `avatar-portrait-light-loop.gif`: corresponding light loop.
- `dark-full.png`, `light-full.png`: full portraits for still inspection.
- `verification/`: decoded GIF keyframes and metadata report.

Both GIFs: **658 × 600, 25 fps, 291 frames, 11.64 seconds, infinite loop**.
The original reveal takes 5.28 seconds: 37 bands, delays 0–4.70 seconds, 0.58-second ease-out per band. Hold full for 0.80 seconds, replay frames backwards, hold the original baseline for 0.24 seconds. The baseline tonal shapes and orbit remain visible, as in the source. No jump to a blank frame.

## Light rendering

Primary style reference: [Vanya-Arc/UI](https://ui.vanya-arc.dev/), [executable tokens](https://github.com/VanDalkvist/vanya-ui/blob/main/src/tokens.css):

- paper: `oklch(0.964 0.008 85)` → sRGB `#f5f3ed`
- ink: `oklch(0.265 0.012 60)` → `#2a241f`
- accent: `oklch(0.530 0.135 42)` → `#aa4c23`

The original uses its dark background as facial shadows. Replacing that background with paper alone makes a negative. `build-light.mjs` derives a soft grayscale support mask from the original unanimated marks: blur alpha, retain the dominant connected portrait, normalize density. Inside that support, ink shadows and paper highlights preserve positive facial shading. Outside, original peripheral marks remain ink on paper. The two complementary masks use the exact source paths; no face is redrawn, no crop changes. The SVG embeds the derived PNG mask; the portrait marks remain vector. `palette.json` records every color substitution.

## Reproduce

Requires installed Node, Playwright, Google Chrome, FFmpeg and ImageMagick. No dependency or browser downloads. By default, uses the existing sibling `vanya-arc` Playwright installation and the standard macOS Chrome executable. Else set `PLAYWRIGHT_PACKAGE` to an installed project's `package.json` and `CHROME` to its browser executable.

From this directory:

```sh
node export.mjs
node verify.mjs
python3 -m http.server 48731 --bind 127.0.0.1 --directory ../..
```

Open http://127.0.0.1:48731/previews/portrait-loop/ . Switch between animation and full portrait; restart both loops together; expand decoded frames to inspect reveal, reverse and seam.

`export.mjs` pauses real Chromium CSS animations and seeks their original timeline at 40 ms intervals, preserving CSS easing and translation. FFmpeg quantizes to one global palette per GIF, without temporal error-diffusion noise, then writes the infinite-loop extension. Export may take a few minutes for 266 browser captures.

`verify.mjs` asserts the original source SHA-256, identical source geometry/motion in both light layers, GIF dimensions/duration/frame count/infinite-loop bytes, all 132 decoded reverse-frame pairs, full hold and identical seam. It writes actual decoded inspection frames. GIFs cannot honor reduced-motion preferences; the preview starts with stills for that preference, and the SVG retains the original reduced-motion rule.

Primary tool references: [Playwright animations API](https://playwright.dev/docs/api/class-page#page-evaluate), [Web Animations currentTime](https://developer.mozilla.org/en-US/docs/Web/API/Animation/currentTime), [FFmpeg palettegen/paletteuse](https://ffmpeg.org/ffmpeg-filters.html#palettegen), [ImageMagick blur/alpha](https://imagemagick.org/script/command-line-options.php#blur). Installed FFmpeg filter help was checked before export.
