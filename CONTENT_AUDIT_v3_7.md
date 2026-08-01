# v3.7 content audit against the currently published/original site

Audit date: 2026-08-01

## Scope

Compared the uploaded current repository (`ytakane0911.github.io.zip`) with the v3.7 deployment files.

## Section-level counts

### Japanese page

| Section | Original | v3.7 audited |
|---|---:|---:|
| News | 17 | 17 |
| Research themes | 4 | 4 |
| Current projects | 7 | 7 |
| Selected work | 5 | 5 |
| Research stories | 9 | 9 |

### English page

| Section | Original | v3.7 audited |
|---|---:|---:|
| News | 3 | 3 |
| Research themes | 4 | 4 |
| Current projects | 3 | 3 |
| Selected work | 5 | 5 |

The English v3.7 page additionally contains three Research Story entry cards that explicitly lead to Japanese article text. This is an addition, not a loss from the original English page.

## Achievement counts

### Japanese page

| Type | Original | v3.7 audited |
|---|---:|---:|
| Peer-reviewed papers | 52 | 52 |
| Grants | 24 | 24 |
| Awards | 8 | 8 |
| Books | 4 | 4 |
| Reports / non-peer-reviewed articles | 19 | 19 |
| Press releases | 6 | 6 |
| Outreach | 4 | 4 |
| International presentations | 25 | 25 |
| Reviewing / academic service | 28 | 28 |
| Total substantive records | 170 | 170 |

The original “Domestic presentations” tab contained eleven identical placeholder strings (`その他_リスト`) rather than actual presentation records. They are intentionally not published as eleven achievements in v3.7.

### English page

| Type | Original | v3.7 audited |
|---|---:|---:|
| Peer-reviewed papers | 37 | 37 |
| Grants | 14 | 14 |
| Awards | 5 | 5 |
| International presentations | 25 | 25 |
| Reviewing / academic service | 28 | 28 |
| Total | 109 | 109 |

## Links and assets

- All original image asset files are included unchanged.
- All valid external content links from the original Japanese page are retained after this audit.
- Eight explanatory/media links that had been reduced to plain text in the first v3.7 package were restored as clickable related links.
- Five press-coverage summaries with a missing final Japanese parenthesis were corrected.
- The obsolete NIES profile URL was replaced with the current official URL.
- The old template-credit link was intentionally removed.
- One malformed legacy link whose value was only `https:` remains omitted rather than guessed.

## Editorial difference

Formal citations and achievement records are preserved. Some long, informal parenthetical comments attached to selected papers on the old site are represented by shorter browsing summaries in the redesigned interface; they are not used as part of the formal CV/reference citation. This is an editorial presentation change rather than a change to the bibliographic record.

## Technical checks

- `index.html` is at the repository root.
- Japanese and English pages have no missing local file references.
- No duplicate HTML IDs were found.
- `assets/js/site-v3.js` passed JavaScript syntax checking.
- `tools/update_publication_metrics.py` passed Python compilation.
- The OpenAlex API key is not embedded in the HTML, JavaScript, JSON, workflow, or ZIP package.
- `.nojekyll` is included so the repository is treated as a plain static site.
- A dedicated Pages deployment workflow is included; it deploys on normal pushes and after the OpenAlex metrics workflow completes.
- Legacy source pages and old public backup HTML files are excluded from the audited deployment package. The old version should be retained in Git history / the backup branch instead.
