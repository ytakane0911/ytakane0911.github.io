# QA report v3.7

## Static checks

- `index.html`, `index_en.html`, and the OpenAlex updater: duplicate HTML IDsなし
- Local CSS / JavaScript / image references: missing filesなし
- `assets/js/site-v3.js`: Node.js syntax check passed
- `admin/openalex-metrics-updater.html`: inline JavaScript syntax check passed
- `tools/update_publication_metrics.py`: Python compile passed
- Public metrics JSON: schema version 2, 47 DOI records
- API key literal: public filesへの埋め込みなし
- GitHub Actions: `secrets.OPENALEX_API_KEY` reference confirmed

## Browser-layout test

A temporary test metric record was injected only in the QA environment. The following was confirmed:

- Formal citation is shown first.
- DOI is shown as part of the citation.
- OpenAlex citation count, FWCI, normalized percentile and Top 10% appear immediately after the DOI in the same record.
- The test record was not written to the released JSON.

## Network limitation during build

The build container could not resolve external DNS, so live OpenAlex values could not be downloaded during packaging. The released site therefore contains:

1. GitHub Actions automatic updater
2. Browser-only OpenAlex updater
3. Empty but valid 47-record metrics JSON

Running either updater with an API key will populate the metrics without changing the HTML.
