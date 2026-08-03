#!/usr/bin/env python3
"""Compare two HTML files while ignoring comments and source-only metadata."""
from __future__ import annotations
import argparse, json, re
from collections import Counter
from pathlib import Path
try:
    from lxml import etree, html
except ImportError as exc:
    raise SystemExit(
        "lxml is required. Install it with: python3 -m pip install --user lxml"
    ) from exc


def normalized_space(text: str) -> str:
    return ' '.join(text.split())


def signature(path: Path) -> dict:
    parser=html.HTMLParser(remove_comments=True)
    doc=html.document_fromstring(path.read_text(encoding='utf-8'),parser=parser)
    for meta in doc.xpath('//meta[@name="source-format"]'):
        parent=meta.getparent()
        if parent is not None: parent.remove(meta)
    scripts=[]
    for script in doc.xpath('//script'):
        if script.get('src'):
            scripts.append({'src':script.get('src')})
            continue
        text=normalized_space(script.text or '')
        m=re.search(r'window\.SITE_I18N\s*=\s*(\{.*\})\s*;',text)
        if m:
            scripts.append({'i18n':json.loads(m.group(1))})
        elif 'SITE_BUILD' in text:
            scripts.append({'globals':re.findall(r'window\.(SITE_BUILD|SITE_GA_ID)\s*=\s*"([^"]+)"',text)})
        else:
            scripts.append({'inline':text})
    tags=list(doc.iter())
    records=doc.xpath('//template[@id="achievementData"]/article[contains(concat(" ",normalize-space(@class)," ")," achievement-source ")]')
    # Script text is compared semantically above, so exclude it from visible/textual comparison.
    text_doc=html.document_fromstring(path.read_text(encoding='utf-8'),parser=html.HTMLParser(remove_comments=True))
    for node in text_doc.xpath('//script|//style|//meta[@name="source-format"]'):
        parent=node.getparent()
        if parent is not None: parent.remove(node)
    return {
        'tag_counts':dict(Counter(x.tag for x in tags if isinstance(x.tag,str))),
        'ids':sorted(doc.xpath('//*[@id]/@id')),
        'hrefs':sorted(doc.xpath('//*[@href]/@href')),
        'srcs':sorted(doc.xpath('//*[@src]/@src')),
        'normalized_text':normalized_space(' '.join(text_doc.itertext())),
        'achievement_attributes':[sorted((k,str(v)) for k,v in x.attrib.items()) for x in records],
        'scripts':scripts,
    }


def main() -> int:
    ap=argparse.ArgumentParser()
    ap.add_argument('before',type=Path)
    ap.add_argument('after',type=Path)
    args=ap.parse_args()
    a=signature(args.before); b=signature(args.after)
    checks={key:a[key]==b[key] for key in a}
    print(json.dumps({'before':str(args.before),'after':str(args.after),'checks':checks,'all_equal':all(checks.values())},ensure_ascii=False,indent=2))
    return 0 if all(checks.values()) else 1
if __name__=='__main__': raise SystemExit(main())
