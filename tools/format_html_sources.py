#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re
from pathlib import Path
try:
    from lxml import etree, html
except ImportError as exc:
    raise SystemExit(
        "lxml is required for the optional HTML formatting tools.\n"
        "Install it once with: python3 -m pip install --user lxml"
    ) from exc

INSTALL_LXML_HINT = True

ROOT = Path(__file__).resolve().parents[1]
SECTION_COMMENTS = {
    'profile': 'PROFILE / プロフィール\n  Edit name, affiliation, summary, keywords, profile links, and highlights.',
    'news': 'NEWS / 最新情報\n  Copy one complete <div class="news-row"> block to add an item.\n  Add class "news-extra" to older items hidden behind the expansion button.',
    'career': 'CAREER / 経歴\n  Copy one complete <div class="timeline-row"> block to add an entry.',
    'research': 'RESEARCH THEMES / 研究テーマ\n  One <article class="theme-card"> block = one research theme.',
    'projects': 'CURRENT PROJECTS / 研究プロジェクト\n  One <article class="project-row"> block = one project.',
    'featured': 'SELECTED WORK / 代表的成果\n  One <article class="featured"> block = one selected work.',
    'achievements': 'ACHIEVEMENTS / 研究業績\n  Edit records inside <template id="achievementData">.\n  One <article class="achievement-source"> creates both browse and CV views.',
    'stories': 'RESEARCH STORIES / 研究トピックス\n  One <details class="story story-detail"> block = one article.',
    'contact': 'CONTACT / 連絡先\n  Edit address, email, external links, and map here.',
}
TYPE_LABELS = {
    'paper': 'PEER-REVIEWED PAPERS / 査読付き論文',
    'grant': 'GRANTS & PROJECTS / 競争的資金',
    'award': 'AWARDS / 表彰',
    'book': 'BOOKS / 書籍',
    'review': 'REPORTS & ARTICLES / 査読なし・解説',
    'press': 'PRESS RELEASES / プレスリリース',
    'outreach': 'OUTREACH / アウトリーチ',
    'intl': 'INTERNATIONAL PRESENTATIONS / 国際学会発表',
    'domestic': 'DOMESTIC PRESENTATIONS / 国内学会発表',
    'service': 'REVIEWING & SERVICE / 査読・学術貢献',
}

def remove_generated_comments(doc):
    keys = ('PROFILE / HERO','NEWS:','RESEARCH THEMES','CURRENT PROJECTS','SELECTED WORK','ACHIEVEMENTS:','RESEARCH STORIES','CAREER / CV','MAINTAINABLE SOURCE','LATEST ITEMS','OLDER ITEMS','ACHIEVEMENT RECORDS','CATEGORY:')
    for c in doc.xpath('//comment()'):
        t=(c.text or '').strip()
        if '=========================================================' in t or any(t.startswith(k) or k in t for k in keys):
            p=c.getparent()
            if p is not None: p.remove(c)

def add_note(doc):
    head=doc.find('head')
    head.insert(0, etree.Comment('MAINTAINABLE SOURCE\n  Source formatting only; rendered design and behavior are unchanged.\n  Edit index.html / index_en.html, then run: python3 tools/format_html_sources.py\n  Copy-paste examples: EDITING_GUIDE.md'))
    if not head.xpath('./meta[@name="source-format"]'):
        meta=etree.Element('meta', name='source-format', content='maintainable-v1')
        cs=head.xpath('./meta[@charset]')
        head.insert(head.index(cs[0])+1 if cs else 1, meta)

def format_scripts(doc):
    for script in doc.xpath('//head/script[not(@src)]'):
        s=(script.text or '').strip()
        m=re.search(r'window\.SITE_I18N\s*=\s*(\{.*\})\s*;?$',s,re.S)
        if m:
            try: data=json.loads(m.group(1))
            except json.JSONDecodeError: continue
            lines=json.dumps(data,ensure_ascii=False,indent=2).splitlines()
            body='\n'.join(['      window.SITE_I18N = '+lines[0], *('      '+line for line in lines[1:])])
            script.text='\n'+body+';\n    '
        elif 'window.SITE_BUILD' in s and 'window.SITE_GA_ID' in s:
            b=re.search(r'window\.SITE_BUILD\s*=\s*"([^"]+)"',s)
            g=re.search(r'window\.SITE_GA_ID\s*=\s*"([^"]+)"',s)
            if b and g: script.text=(f'\n      window.SITE_BUILD = "{b.group(1)}";\n'
                                          f'      window.SITE_GA_ID = "{g.group(1)}";\n    ')

def add_section_comments(doc):
    for sid,text in SECTION_COMMENTS.items():
        nodes=doc.xpath(f'//main/section[@id="{sid}"]')
        if nodes:
            n=nodes[0]; p=n.getparent(); p.insert(p.index(n), etree.Comment('=========================================================\n  '+text+'\n========================================================='))

def add_news_comments(doc):
    rows=doc.xpath('//section[@id="news"]//div[contains(concat(" ",normalize-space(@class)," ")," news-row ")]')
    if not rows:return
    p=rows[0].getparent(); p.insert(p.index(rows[0]),etree.Comment('LATEST ITEMS / 初期表示する最新情報'))
    for r in rows:
        if 'news-extra' in (r.get('class') or '').split():
            p.insert(p.index(r),etree.Comment('OLDER ITEMS / ボタンで展開する過去の情報（class="news-extra"）'))
            break

def add_achievement_comments(doc):
    ts=doc.xpath('//template[@id="achievementData"]')
    if not ts:return
    t=ts[0]
    t.insert(0,etree.Comment('ACHIEVEMENT RECORDS\n  Copy one entire <article class="achievement-source"> block to add a record.\n  data-type: paper | grant | award | book | review | press | outreach | intl | domestic | service\n  Detailed templates: EDITING_GUIDE.md'))
    last=None
    for a in list(t.xpath('./article[contains(concat(" ",normalize-space(@class)," ")," achievement-source ")]')):
        typ=a.get('data-type','')
        if typ!=last:
            t.insert(t.index(a),etree.Comment('CATEGORY: '+TYPE_LABELS.get(typ,typ.upper())))
            last=typ

def wrap_long_tags(text,tag,class_fragment=None):
    line_re=re.compile(rf'^(?P<i>\s*)<{tag}(?P<a>\s+[^>]+)>\s*$',re.M)
    attr_re=re.compile(r'''([:\w-]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?''')
    def rep(m):
        line=m.group(0); attrs=m.group('a').strip()
        if len(line)<150 or (class_fragment and class_fragment not in attrs): return line
        parts=[]
        for x in attr_re.finditer(attrs):
            parts.append(x.group(1) if x.group(2) is None else f'{x.group(1)}={x.group(2)}')
        if not parts:return line
        i=m.group('i'); c=i+'  '
        return '\n'.join([f'{i}<{tag}',*[f'{c}{p}' for p in parts],f'{i}>'])
    return line_re.sub(rep,text)

def format_file(path):
    parser=html.HTMLParser(remove_blank_text=False,remove_comments=False)
    doc=html.document_fromstring(path.read_text(encoding='utf-8'),parser=parser)
    remove_generated_comments(doc); add_note(doc); format_scripts(doc); add_section_comments(doc); add_news_comments(doc); add_achievement_comments(doc)
    etree.indent(doc,space='  ')
    out=html.tostring(doc,encoding='unicode',doctype='<!DOCTYPE html>',method='html',pretty_print=True)
    out=wrap_long_tags(out,'article','achievement-source')
    out=wrap_long_tags(out,'img')
    out=wrap_long_tags(out,'iframe')
    out=re.sub(r'^<!DOCTYPE html>\s*','<!DOCTYPE html>\n',out,count=1,flags=re.I)
    path.write_text(out.rstrip()+'\n',encoding='utf-8')

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('files',nargs='*'); a=ap.parse_args()
    files=[ROOT/x for x in a.files] if a.files else [ROOT/'index.html',ROOT/'index_en.html']
    for p in files:
        format_file(p); print('Formatted:',p.relative_to(ROOT))
if __name__=='__main__':main()
