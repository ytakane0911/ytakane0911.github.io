# Yuya.Takane.Log v3.7.4 — performance and typography audit

## What was found on the published site

The live `main` branch was still serving the pre-performance version, even after the earlier patch was thought to have been applied. In particular, the published HTML and JavaScript still had all of the following:

- original large JPEG/PNG files in the profile and hero areas;
- eager loading of `assets/js/jszip.min.js` on every visit;
- no cache-busting version on `site-v3.css` or `site-v3.js`;
- simultaneous rendering of the browsing view and CV view;
- `publication_metrics.json` fetched with `cache: 'no-store'` and followed by another full render.

This explains why the user did not observe any performance change: the important v3.7.3 files were not the files served by GitHub Pages.

## v3.7.4 changes

### Verified deployment marker

- `<html data-site-build="3.7.4">`
- `<meta name="site-build" content="3.7.4">`
- `site-version.json`
- browser console diagnostic: `window.YUYA_SITE_DIAGNOSTICS`

These make it possible to verify the deployed build without relying on visual impressions.

### Initial rendering

- optimized WebP images and responsive `srcset` are used;
- JSZip is loaded only when Word CV export is requested;
- Google Analytics is loaded after page load during an idle period;
- the achievements UI is rendered after the initial paint, when the section approaches the viewport, on user intent, or during idle time;
- only the active achievements mode is rendered;
- publication metrics are fetched with the normal browser cache and only near the achievements section.

### Tab return / page restoration

- the previous `content-visibility:auto` optimization was removed because it may produce delayed painting when a long page is restored at a deep scroll position;
- open research-story frames are no longer torn down merely because the tab becomes hidden;
- the page records `document.wasDiscarded`, BFCache restoration and navigation type in `window.YUYA_SITE_DIAGNOSTICS`.

### Typography

No network font download is introduced. This avoids replacing a performance problem with a font-loading problem.

- Japanese: Hiragino Sans → Hiragino Kaku Gothic ProN → Yu Gothic UI → Yu Gothic → Meiryo → system UI.
- English: Inter when already installed → system UI / San Francisco / Segoe UI / Helvetica Neue / Arial.
- kerning and Japanese proportional-alternate settings are enabled for headings.

## Data not overwritten by this patch

The patch does **not** contain:

- `assets/data/publication_metrics.json`;
- `.github/workflows/`;
- OpenAlex secrets or API keys.

Therefore current citation metrics and GitHub Actions configuration remain intact.
