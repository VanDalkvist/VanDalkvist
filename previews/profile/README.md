# Profile layout preview

Proposed update to both profile READMEs:

- Text on the left (60%), approved looping portrait on the right (40%).
- Light/dark portraits and matching light/dark intro text.
- Static PNG portraits when reduced motion is requested; the standalone light SVG remains available separately.
- Same four linked header tiles. Their height grows from 57 to 64 SVG units with centered vertical padding: at 375–390px the old tiles shrank below GitHub's 21px inline line box, leaving a visible gap. Typography, content and horizontal alignment are unchanged.
- Exported GIF backgrounds match their themes. The original SVG's fractional letterbox previously baked a light top/bottom line into the dark GIF.

The portrait drawing, accepted beard, source SVG, gallery and links are not redesigned.

## Preview

`index.html` and `en.html` contain the actual README markup rendered by **GitHub's Markdown API**, with the CSS URLs inspected on the live GitHub profile. Only the preview toolbar and outer 896px frame are local; its 846px desktop / 308px phone content widths match the inspected profile card. The theme control configures picture media before inserting the markup, avoiding canceled speculative image loads.

With the repository served at http://127.0.0.1:48731/:

- [Russian](http://127.0.0.1:48731/previews/profile/)
- [English](http://127.0.0.1:48731/previews/profile/en.html)

Use RU/EN and the theme button. This is a pre-publication preview, not a claim that the live GitHub profile is already updated.

## Reproduce and verify

```sh
node header.mjs
node build.mjs
node verify.mjs
node ../portrait-loop/verify.mjs
```

Requires the existing installed Playwright/Chrome, FFmpeg/ImageMagick for portrait verification and authenticated `gh` for the Markdown API. No installs or publishing happen in these commands. `verify.mjs` expects the local repository server on port 48731.

Core checks cover selected portrait/intro assets, text-left order, byte-identical copied portrait assets, color-only light intro adaptation, aligned row edges and zero header/hero gaps in both languages/themes at 1100, 390 and 375px. The initial mobile gap reproduced as **1.0625px**; it is now zero. The initial dark GIF edge regression was **#4e4c4c** instead of **#1a1817**; the portrait verifier checks both top and bottom corners. Real screenshots, theme/language controls and reduced-motion PNG selection were checked separately. Actual live GitHub verification follows publication approval.
