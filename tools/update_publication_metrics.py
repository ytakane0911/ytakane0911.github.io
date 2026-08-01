#!/usr/bin/env python3
"""Update publication metrics for the static GitHub Pages site.

Automatic OpenAlex fields:
- cited-by count
- FWCI
- citation-normalized percentile
- top-10% / top-1% flags

Licensed/manual fields, merged from assets/data/publication_metrics_manual.csv:
- Journal Impact Factor (JIF)
- Web of Science citation count
- Web of Science / InCites top-10% flag

Security: supply the OpenAlex API key through the OPENALEX_API_KEY environment
variable or a GitHub Actions secret. Never put the key in HTML, JavaScript, or a
committed JSON file.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Iterable

DOI_RE = re.compile(r"10\.\d{4,9}/[^\s<>\"']+", re.IGNORECASE)
SELECT_FIELDS = ",".join(
    [
        "id",
        "doi",
        "display_name",
        "publication_year",
        "cited_by_count",
        "fwci",
        "citation_normalized_percentile",
        "updated_date",
        "primary_location",
    ]
)


def normalize_doi(value: str) -> str:
    match = DOI_RE.search(value or "")
    if not match:
        return ""
    return match.group(0).rstrip(".,;)]}").lower()


def discover_papers(index_path: Path) -> dict[str, dict[str, str]]:
    text = index_path.read_text(encoding="utf-8")
    articles = re.findall(
        r'<article\b[^>]*data-type=["\']paper["\'][^>]*>.*?</article>',
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    papers: dict[str, dict[str, str]] = {}
    for article in articles:
        doi = normalize_doi(article)
        if not doi:
            continue
        title_match = re.search(r'data-title=["\']([^"\']*)["\']', article, flags=re.I)
        papers[doi] = {"title": title_match.group(1) if title_match else ""}
    return dict(sorted(papers.items()))


def blank_record(doi: str, title: str = "") -> dict[str, Any]:
    return {
        "doi": doi,
        "title": title,
        "openalex_id": None,
        "openalex_citations": None,
        "openalex_fwci": None,
        "openalex_percentile": None,
        "openalex_top_10_percent": None,
        "openalex_top_1_percent": None,
        "openalex_updated_at": None,
        "openalex_retrieved_at": None,
        "source_display_name": None,
        "issn_l": None,
        "jif": None,
        "jif_year": None,
        "wos_citations": None,
        "wos_top_10_percent": None,
        "manual_updated_at": None,
        "notes": "",
    }


def chunks(values: list[str], size: int) -> Iterable[list[str]]:
    for start in range(0, len(values), size):
        yield values[start : start + size]


def get_json(url: str, timeout: int = 45, retries: int = 4) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "YuyaTakaneWebsiteMetrics/1.1 (https://ytakane0911.github.io/)",
        },
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code not in {429, 500, 502, 503, 504} or attempt == retries - 1:
                raise
        except urllib.error.URLError:
            if attempt == retries - 1:
                raise
        time.sleep(2**attempt)
    raise RuntimeError("OpenAlex request failed after retries")


def request_openalex_batch(dois: list[str], api_key: str) -> dict[str, dict[str, Any]]:
    # OpenAlex supports OR filters with up to 100 DOI values in one request.
    values = "|".join(f"https://doi.org/{doi}" for doi in dois)
    params = {
        "filter": f"doi:{values}",
        "per_page": "100",
        "select": SELECT_FIELDS,
        "api_key": api_key,
    }
    url = "https://api.openalex.org/works?" + urllib.parse.urlencode(params, safe=":|/,")
    payload = get_json(url)
    results: dict[str, dict[str, Any]] = {}
    for work in payload.get("results") or []:
        doi = normalize_doi(work.get("doi") or "")
        if doi:
            results[doi] = work
    return results


def parse_bool(value: str) -> bool | None:
    value = (value or "").strip().lower()
    if value in {"1", "true", "yes", "y"}:
        return True
    if value in {"0", "false", "no", "n"}:
        return False
    return None


def parse_number(value: str, integer: bool = False) -> int | float | None:
    value = (value or "").strip()
    if not value:
        return None
    try:
        return int(float(value)) if integer else float(value)
    except ValueError:
        return None


def apply_manual_csv(records: dict[str, dict[str, Any]], csv_path: Path) -> None:
    if not csv_path.exists():
        return
    today = dt.datetime.now(dt.timezone.utc).date().isoformat()
    with csv_path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            doi = normalize_doi(row.get("doi", ""))
            if not doi:
                continue
            record = records.setdefault(doi, blank_record(doi))
            fields_changed = False
            mapping = {
                "jif": parse_number(row.get("jif", "")),
                "jif_year": parse_number(row.get("jif_year", ""), integer=True),
                "wos_citations": parse_number(row.get("wos_citations", ""), integer=True),
                "wos_top_10_percent": parse_bool(row.get("wos_top_10_percent", "")),
            }
            for key, value in mapping.items():
                if value is not None:
                    record[key] = value
                    fields_changed = True
            notes = (row.get("notes") or "").strip()
            if notes:
                record["notes"] = notes
                fields_changed = True
            if fields_changed:
                record["manual_updated_at"] = (row.get("manual_updated_at") or today).strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-root", default=".", help="Repository root")
    parser.add_argument("--no-openalex", action="store_true", help="Only merge manual CSV")
    parser.add_argument("--batch-size", type=int, default=40, help="DOIs per OpenAlex request (max 100)")
    args = parser.parse_args()

    root = Path(args.site_root).resolve()
    index_path = root / "index.html"
    output_path = root / "assets" / "data" / "publication_metrics.json"
    manual_path = root / "assets" / "data" / "publication_metrics_manual.csv"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    papers = discover_papers(index_path)
    if not papers:
        print("No DOI-bearing paper records found.", file=sys.stderr)
        return 1

    existing: dict[str, Any] = {}
    if output_path.exists():
        try:
            existing = json.loads(output_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            print(f"Warning: could not parse {output_path}; rebuilding", file=sys.stderr)
    existing_records = existing.get("records", {}) if isinstance(existing, dict) else {}

    records: dict[str, dict[str, Any]] = {}
    for doi, meta in papers.items():
        record = blank_record(doi, meta.get("title", ""))
        if isinstance(existing_records.get(doi), dict):
            record.update(existing_records[doi])
            record["doi"] = doi
            if not record.get("title"):
                record["title"] = meta.get("title", "")
        records[doi] = record

    checked_at = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    api_key = os.environ.get("OPENALEX_API_KEY", "").strip()
    failures: list[str] = []
    updated = 0

    if not args.no_openalex:
        if not api_key:
            print(
                "OPENALEX_API_KEY is not set. Store it as a GitHub Actions secret "
                "or use admin/openalex-metrics-updater.html.",
                file=sys.stderr,
            )
            return 2
        batch_size = max(1, min(args.batch_size, 100))
        doi_list = list(records)
        for batch_no, batch in enumerate(chunks(doi_list, batch_size), start=1):
            try:
                works = request_openalex_batch(batch, api_key)
            except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
                failures.extend(f"{doi}: {exc}" for doi in batch)
                print(f"Batch {batch_no} failed: {exc}", file=sys.stderr)
                continue
            for doi in batch:
                work = works.get(doi)
                if not work:
                    failures.append(f"{doi}: not found in OpenAlex")
                    continue
                percentile = work.get("citation_normalized_percentile") or {}
                location = work.get("primary_location") or {}
                source = location.get("source") or {}
                records[doi].update(
                    {
                        "openalex_id": work.get("id"),
                        "openalex_citations": work.get("cited_by_count"),
                        "openalex_fwci": work.get("fwci"),
                        "openalex_percentile": percentile.get("value"),
                        "openalex_top_10_percent": percentile.get("is_in_top_10_percent"),
                        "openalex_top_1_percent": percentile.get("is_in_top_1_percent"),
                        "openalex_updated_at": work.get("updated_date"),
                        "openalex_retrieved_at": checked_at,
                        "source_display_name": source.get("display_name"),
                        "issn_l": source.get("issn_l"),
                    }
                )
                updated += 1
                print(f"{doi}: {records[doi].get('openalex_citations')} citations")

    apply_manual_csv(records, manual_path)

    output = {
        "schema_version": 2,
        "generated_at": checked_at,
        "openalex_source": "https://openalex.org/",
        "records_requested": len(records),
        "records_updated": updated,
        "failures": failures,
        "manual_source_note": "JIF and Web of Science/InCites fields are imported from publication_metrics_manual.csv.",
        "records": records,
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output_path}: {updated}/{len(records)} OpenAlex records updated")
    return 0 if (args.no_openalex or updated > 0) else 1


if __name__ == "__main__":
    raise SystemExit(main())
