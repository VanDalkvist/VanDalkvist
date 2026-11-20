# Profile layout preview

Proposed update to both profile READMEs:

- Text on the left (60%), one-shot **vector halftone portrait** on the right (40%), preserving the accepted face.
- Light/dark portraits and matching light/dark intro text.
- The active dark/light SVG portraits handle `prefers-reduced-motion` internally and render their final state without animation. Old GIF/PNG exports remain archived, not embedded in README.
- Same four linked header tiles. Their height grows from 57 to 70 SVG units with centered vertical padding: at 375–390px the old tiles shrank below GitHub's inline line box, leaving a visible gap. The profile uses 14px/21px text; the file viewer uses 16px/24px. The intermediate 64px tiles still left a 0.4375px gap in the phone file viewer. Typography, content and horizontal alignment are unchanged.
- The active SVG portraits use exact Vanya UI `--ground` colors and `preserveAspectRatio="none"` to avoid fractional transparent-edge letterboxing.

The portrait drawing, accepted beard, source SVG, gallery and links are not redesigned.

## Preview

`index.html` and `en.html` contain the actual README markup rendered by **GitHub's Markdown API**, with the CSS URLs inspected on the live GitHub profile. Only the preview toolbar and outer 896px frame are local. The `context=profile` mode uses the inspected profile font/padding; `context=file` uses the file viewer's font/padding. The profile's 846px desktop / 308px phone content widths match the inspected card. The theme control configures picture media before inserting the markup, avoiding canceled speculative image loads.

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

Core checks cover selected portrait/intro assets, text-left order, the absence of the under-text divider, color-only light intro adaptation, 4-slice calendar width matching the four navigation panels, aligned row edges and zero gaps in both languages/themes and both GitHub contexts at 1100, 390 and 375px (24 cases). The initial mobile gap reproduced as **1.0625px**; it is now zero. The initial dark GIF edge regression was **#4e4c4c** instead of **#1a1817**; the portrait verifier checks both top and bottom corners. For the updated version, GitHub branch screenshots have been inspected on desktop and at 390px. Reduced-motion SVG fallback remains encoded in source, but full cross-browser automation has not been rerun here. Actual live GitHub verification covers the profile and both README file views after publication approval.

**Regeneration notice:** committed `index.html` / `en.html` are preview snapshots and can lag behind current README edits. Run `node build.mjs` with authenticated `gh` before relying on them to validate the staged animation. The actual GitHub branch README is the primary current reference. The 16 project images stagger their SVG CSS animation delays; independent image loads prevent guaranteed shared-clock synchronization.
