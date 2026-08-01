# Yuya.Takane.Log v3.7.3 performance audit

## Scope

This patch changes performance-related delivery and rendering only. It does not change the published content, achievement records, DOI data, publication metrics JSON, site structure, or visual design intent.

## Confirmed causes in v3.7.2

### 1. Oversized raster images

The site referenced original camera files and large PNG figures directly from the page.

| Page | Before: original unique images | After: typical responsive choices | After: conservative large choices |
|---|---:|---:|---:|
| Japanese | 47.72 MB | 0.83 MB | 2.04 MB |
| English | 27.46 MB | 0.36 MB | 0.94 MB |

The more important first-view comparison is:

| Page | Before: eager transfer | After range (DPR dependent) | Before: decoded pixel memory | After range |
|---|---:|---:|---:|---:|
| Japanese | 9.57 MB | 0.09–0.25 MB | 154.9 MB | 2.2–7.5 MB |
| English | 14.59 MB | 0.12–0.42 MB | 174.8 MB | 2.6–8.5 MB |

The browser now chooses between 700/1400 px card and figure variants and between 900/1600 px hero variants using `srcset` and `sizes`; it downloads only the selected candidate, not both.

Examples from the previous page:

- `DSC00158.JPG`: 6192 × 4128, 12.75 MB
- `DSC05649.JPG`: 6000 × 3376, 7.56 MB
- `heatwave.png`: 3726 × 2475, 10.64 MB
- `hamamatsu.png`: 3304 × 2479, 9.66 MB

Even after transfer, a browser commonly expands an image into a much larger in-memory pixel buffer for painting. This was the main memory-pressure risk.

### 2. Heavy resources loaded before they were needed

- `jszip.min.js` was loaded on every visit even though it is used only for Word CV export.
- Publication metrics were fetched with `cache: no-store`, then the achievement area was rendered again.
- Both the browse view and the hidden CV view were built on every render.
- Embedded Google Slides and YouTube frames existed in the document before their stories were opened.

### 3. Expensive painting and long navigation animation

- The fixed top bar used `backdrop-filter: blur(...)`.
- `.main` used two-axis `overflow: hidden` over a very long page.
- `scroll-behavior: smooth` animated long jumps through the page, making menu clicks appear slow.

## Why the white page appeared after returning to the tab

The exact browser decision cannot be proven without a Chrome trace from the affected Mac. However, the symptom is consistent with a hidden tab being discarded under memory pressure and reloaded when activated. The very large decoded-image footprint made that substantially more likely. The patch reduces the first-view decoded image footprint by about 95% and unloads third-party story frames while the tab is hidden.

## Changes in v3.7.3

1. Added responsive WebP image pairs sized for actual card, mobile, desktop, and full-article use.
2. Added explicit `width`, `height`, `loading`, `decoding`, and `fetchpriority` attributes.
3. Preloaded only the first-view hero image.
4. Deferred story-body images and external frames until the story is opened.
5. Unloaded story iframes when the story is closed or the tab is hidden.
6. Loaded JSZip only when Word CV export is requested.
7. Loaded publication metrics during idle time or when the achievement section approaches the viewport.
8. Allowed publication metrics JSON to use normal browser caching.
9. Rendered only the active achievement view.
10. Removed fixed-header backdrop blur and full-page vertical clipping.
11. Added `content-visibility: auto` to offscreen sections.
12. Changed long internal page jumps from smooth animation to immediate navigation.

## Integrity checks

- Japanese news: 17 before / 17 after
- Japanese research themes: 4 / 4
- Japanese projects: 7 / 7
- Japanese selected works: 5 / 5
- Japanese research stories: 9 / 9
- Japanese achievements: 170 / 170
- English achievements: 109 / 109
- Achievement source data and formal citations: unchanged
- Duplicate HTML IDs: none
- Missing local references in a complete-site overlay test: none
- JavaScript syntax: valid
- `publication_metrics.json`: not included in the patch and therefore not overwritten
