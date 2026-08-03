# Yuya.Takane.Log — HTML編集ガイド

このパッチは、現在の表示・デザイン・JavaScript機能を変えず、`index.html` と `index_en.html` のソースを編集しやすく整形したものです。

## 1. 基本方針

通常の内容更新で主に編集するファイルは次の2つです。

```text
index.html       日本語ページ
index_en.html    英語ページ
```

デザイン変更がない限り、次のファイルは触る必要がありません。

```text
assets/css/site-v3.css
assets/js/site-v3.js
```

HTML内には、次のような大きなコメントがあります。

```html
<!--=========================================================
  NEWS / 最新情報
  Copy one complete <div class="news-row"> block to add an item.
=========================================================-->
```

検索機能で `NEWS / 最新情報`、`CURRENT PROJECTS`、`ACHIEVEMENTS` などを探すと、編集箇所へすぐ移動できます。

---

## 2. 推奨エディタ

Visual Studio Code、CotEditor、BBEditなど、UTF-8を扱えるエディタを推奨します。

同梱した `.editorconfig` により、対応エディタでは次が自動設定されます。

- UTF-8
- 2スペースのインデント
- LF改行
- ファイル末尾の改行

---

## 3. 最新情報を追加する

`NEWS / 最新情報`を検索し、既存の`.news-row`を1件まるごとコピーします。

```html
<div class="news-row">
  <time>2026.08.01</time>
  <p>
    ここに最新情報を書きます。
    <a
      class="text-link"
      href="https://example.com/"
      rel="noopener noreferrer"
      target="_blank"
    >
      Link
    </a>
  </p>
  <span class="label">論文</span>
</div>
```

初期状態で表示する最新項目には、`news-extra`を付けません。

古い情報として「過去のお知らせをさらに表示」の中に入れる場合は、次のようにします。

```html
<div class="news-row news-extra">
```

---

## 4. 経歴・受賞・所属学会を追加する

`CAREER / 経歴`を検索します。

### 学歴・職歴・受賞歴

既存の`.timeline-row`をまるごとコピーします。

```html
<div class="timeline-row">
  <time>2026.10-</time>
  <div class="timeline-content">
    <p>所属・役職など</p>
  </div>
</div>
```

### 所属学会

所属学会は、該当する`.timeline-content`内の`<p>`をコピーします。

```html
<p>
  <a
    class="text-link"
    href="https://example.org/"
    rel="noopener noreferrer"
    target="_blank"
  >
    学会名
  </a>
</p>
```

---

## 5. 研究テーマを追加・変更する

`RESEARCH THEMES / 研究テーマ`を検索します。

1つのテーマは、1つの`.theme-card`です。

```html
<article class="theme-card">
  <div class="theme-media">
    <img
      alt="画像の説明"
      decoding="async"
      height="700"
      loading="lazy"
      src="assets/images/optimized/example-700.webp"
      width="1400"
    >
  </div>
  <div class="theme-index">05 / NEW THEME</div>
  <h3>新しい研究テーマ</h3>
  <div class="theme-text">
    説明文を記載します。
  </div>
</article>
```

画像を追加する場合は、`assets/images/optimized/`へ入れ、`src`を変更します。

---

## 6. 研究プロジェクトを追加する

`CURRENT PROJECTS / 研究プロジェクト`を検索します。

1つのプロジェクトは1つの`.project-row`です。

```html
<article class="project-row">
  <div class="project-program">
    制度名
    2026–2030
  </div>
  <div class="project-main">
    <h3>課題名</h3>
    <p>課題の説明を記載します。</p>
  </div>
  <div class="project-meta">
    <span class="pill">研究代表者</span>
    <span class="meta-text">2026.04–2030.03</span>
  </div>
</article>
```

---

## 7. 代表的成果を追加する

`SELECTED WORK / 代表的成果`を検索します。

1つの成果は1つの`.featured`です。

```html
<article class="featured">
  <div class="featured-media">
    <img
      alt="成果画像の説明"
      decoding="async"
      height="700"
      loading="lazy"
      src="assets/images/optimized/example-700.webp"
      width="1400"
    >
  </div>
  <div class="year">MODEL / 2026</div>
  <h3>論文タイトル</h3>
  <p>成果の短い説明です。</p>
  <div class="citation">
    著者, 2026: 論文タイトル. <i>Journal</i>, <strong>1</strong>, 1–10.
    doi:<a
      class="text-link"
      href="https://doi.org/10.xxxx/example"
      rel="noopener noreferrer"
      target="_blank"
    >10.xxxx/example</a>
  </div>
</article>
```

---

## 8. 研究業績を追加する

`ACHIEVEMENT RECORDS`を検索します。

同じ業績を閲覧カードとCV一覧へ二重入力する必要はありません。1つの`achievement-source`レコードから両方が自動生成されます。

### 8.1 査読付き論文

新しい論文は、`CATEGORY: PEER-REVIEWED PAPERS`直下の先頭に追加します。

```html
<article
  class="achievement-source"
  data-id="paper-2026-unique-short-name"
  data-meta="Journal Name, 1, 1–10"
  data-role="筆頭著者"
  data-summary="閲覧カード用の短い説明。空欄でも可。"
  data-themes="モデル・オープンサイエンス|都市・エネルギー"
  data-title="Paper title"
  data-type="paper"
  data-url="https://doi.org/10.xxxx/example"
  data-year="2026"
  data-year-label="2026"
>
  <div class="achievement-cv">
    Takane, Y., 2026: Paper title. <i>Journal Name</i>,
    <strong>1</strong>, 1–10.
    doi:<a
      class="text-link"
      href="https://doi.org/10.xxxx/example"
      rel="noopener noreferrer"
      target="_blank"
    >10.xxxx/example</a>
  </div>
  <div class="achievement-reference">
    Takane, Y. (2026). Paper title. <em>Journal Name</em>, 1, 1–10.
    <a
      href="https://doi.org/10.xxxx/example"
      rel="noopener noreferrer"
      target="_blank"
    >https://doi.org/10.xxxx/example</a>.
  </div>
</article>
```

重要項目：

| 属性 | 意味 |
|---|---|
| `data-id` | 全業績で重複しないID |
| `data-type` | 論文は`paper` |
| `data-year` | 並び替え用の西暦数字 |
| `data-year-label` | 表示する年・期間 |
| `data-role` | 筆頭著者、共著者など |
| `data-title` | 閲覧カードのタイトル |
| `data-meta` | 雑誌名、巻、ページ等 |
| `data-summary` | 閲覧カード用の短い説明 |
| `data-url` | DOIまたは公式ページ |
| `data-themes` | `|`で区切った研究テーマ |

OpenAlex指標はDOIに基づいて別JSONから付加されるため、引用数をHTMLへ手入力する必要はありません。

### 8.2 外部資金

`CATEGORY: GRANTS & PROJECTS`の先頭に追加します。

```html
<article
  class="achievement-source"
  data-id="grant-2026-example"
  data-meta="資金配分機関 制度名 研究代表者"
  data-role="研究代表者"
  data-summary="課題の短い説明。"
  data-themes="都市・エネルギー|適応・緩和"
  data-title="研究課題名"
  data-type="grant"
  data-url="https://example.com/project"
  data-year="2026"
  data-year-label="2026年4月–2030年3月"
>
  <div class="achievement-cv">
    資金配分機関　制度名　研究代表者　「研究課題名」
    （2026年4月–2030年3月）
  </div>
  <div class="achievement-reference">
    資金配分機関　制度名　研究代表者　「研究課題名」
    （2026年4月–2030年3月）
  </div>
</article>
```

### 8.3 業績種別

```text
paper     査読付き論文
grant     競争的資金
award     表彰
book      書籍
review    査読なし・解説
press     プレスリリース
outreach  アウトリーチ
intl      国際学会発表
domestic  国内学会発表
service   査読・学術貢献
```

---

## 9. 研究トピックスを追加する

`RESEARCH STORIES / 研究トピックス`を検索します。

```html
<details class="story story-detail" id="topic-10-example">
  <summary>
    <span class="story-thumb-wrap">
      <img
        alt="記事画像の説明"
        class="story-thumb"
        decoding="async"
        height="700"
        loading="lazy"
        src="assets/images/optimized/example-700.webp"
        width="1400"
      >
    </span>
    <span class="story-date">2026.08</span>
    <span class="story-title">記事タイトル</span>
    <span class="story-excerpt">一覧に表示する短い説明。</span>
    <span class="story-toggle">
      <span class="when-closed">記事を読む ↓</span>
      <span class="when-open">閉じる ↑</span>
    </span>
  </summary>
  <div class="story-body topic-body">
    <p>記事本文です。</p>
    <button class="story-close" type="button">記事を閉じる ↑</button>
  </div>
</details>
```

`id`は重複しない英数字・ハイフン形式を推奨します。

---

## 10. 編集後の整形・検査

リポジトリのルートで実行します。

```bash
python3 tools/format_html_sources.py
```

構造検査：

```bash
python3 tools/validate_site_sources.py
```

最後が次なら正常です。

```text
RESULT: OK — source structure is valid.
```

ローカル表示確認：

```bash
python3 -m http.server 8000
```

ブラウザ：

```text
http://localhost:8000/
http://localhost:8000/index_en.html
```

終了は`Control + C`です。

---

## 11. GitHubへの反映

現在使用中のローカルリポジトリを例とします。

```bash
DEPLOY="/Users/yuya.takane/Urban climate Dropbox/Yuya Takane/2025.0401-環境研/事務/個人HP/github/ytakane0911.github.io-v3.7.1-deploy"
```

```bash
git -C "$DEPLOY" status --short
```

```bash
git -C "$DEPLOY" add index.html index_en.html tools .editorconfig EDITING_GUIDE.md
```

```bash
git -C "$DEPLOY" commit -m "Update website content"
```

```bash
git -C "$DEPLOY" pull --rebase origin main
```

```bash
git -C "$DEPLOY" push origin main
```

OpenAlexの自動更新がリモートへ先に入った場合にも、`pull --rebase`をpush直前に実行することで整合を取りやすくなります。
