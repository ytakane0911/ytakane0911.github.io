#!/usr/bin/env python3
"""Validate the manually maintained main HTML files.

Usage:
    python3 tools/validate_site_sources.py
"""
from __future__ import annotations
import json, re, sys
from collections import Counter
from pathlib import Path
try:
    from lxml import html
except ImportError as exc:
    raise SystemExit(
        "lxml is required for source validation.\n"
        "Install it once with: python3 -m pip install --user lxml"
    ) from exc

INSTALL_LXML_HINT = True

ROOT = Path(__file__).resolve().parents[1]
FILES = [ROOT / 'index.html', ROOT / 'index_en.html']
REQUIRED_SECTIONS = ['profile','news','career','research','projects','featured','achievements','stories','contact']
REQUIRED_ACH_ATTRS = ['data-id','data-type','data-year','data-title']
ALLOWED_TYPES = {'paper','grant','award','book','review','press','outreach','intl','domestic','service'}

def validate(path: Path) -> dict:
    parser = html.HTMLParser(remove_comments=False)
    doc = html.document_fromstring(path.read_text(encoding='utf-8'), parser=parser)
    errors=[]; warnings=[]
    ids=[x for x in doc.xpath('//*[@id]/@id')]
    dup=[k for k,v in Counter(ids).items() if v>1]
    if dup: errors.append(f'duplicate ids: {dup}')
    sections=[x.get('id') for x in doc.xpath('//main/section[@id]')]
    if sections != REQUIRED_SECTIONS:
        errors.append(f'section order mismatch: {sections}')
    if doc.xpath('//nav[contains(@class,"side-nav")]//small'):
        errors.append('obsolete sidebar numbers remain')
    records=doc.xpath('//template[@id="achievementData"]/article[contains(concat(" ",normalize-space(@class)," ")," achievement-source ")]')
    data_ids=[]
    type_counts=Counter()
    for index,record in enumerate(records,1):
        missing=[a for a in REQUIRED_ACH_ATTRS if not record.get(a)]
        if missing: errors.append(f'achievement #{index} missing {missing}')
        typ=record.get('data-type','')
        if typ not in ALLOWED_TYPES: errors.append(f'achievement #{index} unknown data-type={typ!r}')
        type_counts[typ]+=1
        data_ids.append(record.get('data-id',''))
        if not record.xpath('./div[contains(concat(" ",normalize-space(@class)," ")," achievement-cv ")]'):
            errors.append(f'achievement #{index} has no achievement-cv')
        if not record.xpath('./div[contains(concat(" ",normalize-space(@class)," ")," achievement-reference ")]'):
            warnings.append(f'achievement #{index} has no achievement-reference')
    dup_data=[k for k,v in Counter(data_ids).items() if k and v>1]
    if dup_data: errors.append(f'duplicate achievement data-id: {dup_data}')
    build=doc.get('data-site-build')
    source_meta=doc.xpath('string(//meta[@name="source-format"]/@content)')
    if source_meta != 'maintainable-v1': errors.append('source-format meta is missing')
    return {
        'file': path.name,
        'language': doc.get('lang'),
        'build': build,
        'sections': sections,
        'news': len(doc.xpath('//section[@id="news"]//*[contains(concat(" ",normalize-space(@class)," ")," news-row ")]')),
        'projects': len(doc.xpath('//section[@id="projects"]//*[contains(concat(" ",normalize-space(@class)," ")," project-row ")]')),
        'stories': len(doc.xpath('//section[@id="stories"]//details[contains(concat(" ",normalize-space(@class)," ")," story-detail ")]')),
        'achievements': len(records),
        'achievement_types': dict(type_counts),
        'errors': errors,
        'warnings': warnings,
    }

def main() -> int:
    reports=[]
    for path in FILES:
        if not path.exists():
            print(f'ERROR: missing {path}', file=sys.stderr); return 1
        reports.append(validate(path))
    if reports[0]['build'] != reports[1]['build']:
        reports[0]['errors'].append('Japanese and English build markers differ')
    print(json.dumps({'reports':reports},ensure_ascii=False,indent=2))
    total=sum(len(r['errors']) for r in reports)
    if total:
        print(f'RESULT: FAIL ({total} errors)',file=sys.stderr); return 1
    print('RESULT: OK — source structure is valid.')
    return 0
if __name__=='__main__': raise SystemExit(main())
