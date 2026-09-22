/* HP04_NOTO_20260922 — production-only list enhancements.
   Runs before the original deferred site-v3.js; it does not intercept fetch,
   navigation, analytics, language switching, or full-CV export. */
(() => {
  'use strict';
  const shell = document.getElementById('achievementShell');
  if (!shell) return;
  const en = document.documentElement.lang === 'en';
  const $ = s => shell.querySelector(s);
  shell.classList.add('cv-mode');
  const tools = document.createElement('details');
  tools.className = 'hp-list-tools';
  const summary = document.createElement('summary');
  summary.textContent = en ? 'Copy / export / publication metrics' : 'コピー・出力・論文指標';
  tools.appendChild(summary);
  const body = document.createElement('div');
  body.className = 'hp-list-tools-body';
  tools.appendChild(body);
  ['.toolbar-actions','.cv-only-field','.cv-help','.publication-metrics-status',
   '.publication-metrics-owner-tools'].forEach(selector => {
    const el = $(selector);
    if (el) body.appendChild(el);
  });
  const toolbar = $('.ach-toolbar');
  if (toolbar) toolbar.appendChild(tools);
  tools.addEventListener('toggle', () => {
    if (!tools.open && shell.classList.contains('selection-mode')) {
      document.getElementById('toggleSelection')?.click();
    }
  });
  const query = document.getElementById('searchInput');
  if (query) {
    query.setAttribute('aria-label', en ? 'Search within the selected category' : '選択中のカテゴリ内を検索');
    query.placeholder = en ? 'Search within this category' : '選択中のカテゴリ内を検索';
  }
  document.getElementById('roleSelect')?.setAttribute('aria-label', en ? 'Role' : '役割');
  document.getElementById('periodSelect')?.setAttribute('aria-label', en ? 'Period' : '期間');
  document.getElementById('copyFormat')?.setAttribute('aria-label', en ? 'Copy format' : 'コピー形式');
  window.HP04 = {
    release: 'HP04_NOTO_20260922',
    afterRender(total, shown, type) {
      const count = document.getElementById('resultCount');
      if (count && total === shown) {
        count.textContent = en ? `${total} records in this category` : `このカテゴリ：${total}件を表示`;
      }
      shell.querySelectorAll('#categoryStrip button').forEach(b => {
        b.setAttribute('aria-pressed', String(b.classList.contains('active')));
      });
      shell.querySelectorAll('.cv-list').forEach(el => el.setAttribute('role','list'));
      this.state = {total, shown, type};
    }
  };
})();
