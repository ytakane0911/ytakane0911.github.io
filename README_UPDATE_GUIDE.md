# 更新・公開ガイド（正式版 v3.5）

## 1. 公開方法

このフォルダの **中身** を `ytakane0911.github.io` リポジトリのルートへコピーし、commit / pushしてください。
主要ファイルは次の通りです。

- `index.html`：日本語トップページ
- `index_en.html`：英語トップページ
- `topics.html`：旧URLからトップページ内の研究トピックスへ転送する互換ページ
- `assets/css/site-v3.css`：承認済みv3のデザインとv3.1–v3.2の調整
- `assets/js/site-v3.js`：スマホメニュー、業績検索、表示件数、コピー、フルCV生成
- `assets/images/`：現行リポジトリ由来の画像

## 2. ニュース、研究テーマ、プロジェクト等の更新

`index.html` / `index_en.html` のコメントを検索してください。

- `<!-- NEWS`：ニュース
- `<!-- RESEARCH THEMES`：研究テーマ
- `<!-- CURRENT PROJECTS`：研究プロジェクト
- `<!-- SELECTED WORK`：代表的成果
- `<!-- CAREER / CV`：経歴

既存の `<div class="news-row">...</div>` や `<article class="project-row">...</article>` を複製して内容を変更できます。

## 3. 業績を1件追加する方法

`index.html` の末尾近くにある `<template id="achievementData">` 内へ、既存の同種レコードを複製して追加します。
同じ1レコードから、閲覧カードとCV・コピー用一覧の両方が自動生成されます。

```html
<article class="achievement-source"
  data-id="paper-2027-example"
  data-type="paper"
  data-year="2027"
  data-year-label="2027"
  data-role="筆頭著者"
  data-title="閲覧カードに表示する論文タイトル"
  data-meta="Journal Name · 2027"
  data-summary="閲覧者向けの短い説明。空欄でも可。"
  data-url="https://doi.org/..."
  data-themes="モデル・オープンサイエンス|都市・エネルギー">
  <div class="achievement-cv">
    Takane, Y., 2027: Full citation. <i>Journal Name</i>, <b>1</b>, 1–10.
  </div>
  <div class="achievement-reference">
    Takane, Y. (2027). Full citation. <i>Journal Name</i>, <b>1</b>, 1–10.
  </div>
</article>
```

`data-type` は次のいずれかです。

`paper`, `grant`, `award`, `book`, `review`, `press`, `outreach`, `intl`, `domestic`, `service`

英語ページにも掲載する場合は、`index_en.html` の同じテンプレートへ英語レコードを追加します。

## 4. 研究業績の表示・コピー機能

### 閲覧モード

- PC：初期表示15件
- タブレット：初期表示10件
- スマートフォン：初期表示6件

下部にはページ切替に加えて、次のボタンがあります。

- **さらに○件表示**：1ページ内の表示件数を段階的に増やします。
- **全件表示**：現在の検索・絞り込み条件に合う全件を同じページ内に展開します。
- **標準表示に戻す**：初期表示件数へ戻します。

このため、通常はページ切替で短く閲覧でき、必要な場合は従来サイトの「もっと見る」に近い感覚で下方向へ展開できます。

### CV・コピー用

- PC：初期表示24件
- タブレット：初期表示16件
- スマートフォン：初期表示8件

通常はチェック欄を表示しません。各業績の **コピー**、**このページをコピー**、**絞り込み全件をコピー**だけで利用できます。

任意の複数業績だけをまとめてコピーしたい場合は、**複数項目を選ぶ**を押します。その時だけ、次が表示されます。

- 各業績左側の「選択」チェック欄
- 「このページを全選択」
- 選択件数
- 「選択した項目をコピー」

チェック欄の役割は、連続していない任意の業績を選び、一括コピーすることです。不要な場合は選択モードを開始する必要はありません。

## 5. 研究トピックスの更新

研究トピックスはトップページ内で開閉します。`index.html` の `<!-- RESEARCH STORIES -->` セクションにある、既存の `<details class="story story-detail">...</details>` を複製して更新してください。

- `<summary>`：閉じたカードで見せる日付・タイトル・概要
- `<div class="story-body topic-body">`：開いた際に表示する記事全文
- `id="topic-..."`：ページ内リンク用。重複しない文字列にします

英語ページに入口を設ける場合は、`index_en.html` の同セクションへ追加します。`topics.html` は編集対象ではなく、旧URL互換の転送ページです。

## 6. 画像の追加

画像を `assets/images/` へ保存し、HTMLから相対パスで参照します。

```html
<img src="assets/images/new-figure.png" alt="図の内容を説明する代替テキスト">
```

## 7. 収録件数

- 日本語：ニュース17、研究テーマ4、プロジェクト7、代表論文5、業績170、研究トピックス9
- 英語：ニュース3、研究テーマ4、プロジェクト3、代表論文5、業績109

## 8. 元データ上の注意

- 日本語版の「国内学会発表」欄には、正式情報ではない `その他_リスト` が11件ありました。正式版では公開業績として表示していません。
- 2010年のSOLA論文のDOIリンクは元HTMLで `https:` / `10` のみでした。推測補完は行わず、無効なDOI断片だけを表示・リンク対象から除外しています。
- 英語版には元々「Research Topics」の全文がありません。英語トップページでは、日本語記事への入口であることを明示しています。

## 9. v3.2の変更点

- フッターのテンプレート由来表記を削除しました。
- 研究業績の初期表示件数を増やしました。
- ページ切替を残しつつ、下部から段階展開・全件展開できるようにしました。
- CVのチェック欄を通常時は非表示にし、目的を明示した複数選択モード内だけで表示するようにしました。

## 10. フルCVの自動出力（v3.5）

プロフィール欄の **「フルCVを出力」** を押すと、専用ダイアログが開きます。

次の内容を、現在のHTMLと業績データから毎回生成します。

- 氏名、所属、連絡先、研究概要、研究キーワード
- NIES、Google Scholar、researchmap、Web of Science、ORCID、ResearchGate、LinkedIn
- 研究テーマ
- 実施中プロジェクト
- 学歴、職歴、受賞歴、所属学会
- 代表的成果
- 全研究業績（論文、外部資金、書籍、解説、プレスリリース、アウトリーチ、学会発表、査読・学術貢献）

出力方法は次の3つです。

1. **Word形式（.docx）**：実際のDOCXファイルをブラウザ内で生成して保存します。
2. **印刷画面／PDF保存**：印刷用のCV画面を開き、ブラウザの印刷機能からPDF保存できます。
3. **全文コピー**：プレーンテキストと書式付きHTMLをクリップボードへコピーします。

CV用の別データファイルはありません。プロフィール、経歴、プロジェクト、業績をHP上で更新すれば、次回出力するCVにも自動的に反映されます。

`assets/js/jszip.min.js` はDOCX生成に必要です。削除しないでください。ライセンスは `assets/js/JSZIP_LICENSE.txt` に収録しています。

研究業績欄の **「CV・コピー用」** は、個別業績の正式表記をコピーするための表示です。フルCVの生成機能とは役割を分けています。

## 論文指標（引用数・FWCI・Top 10%・JIF）の更新

v3.7では、`正式表記・コピー用` の各査読付き論文について、**正式書誌とDOIの直後**に論文指標を表示します。

### 自動更新できる指標（OpenAlex）

- OpenAlex citation count
- FWCI
- work type・出版年・subfieldで正規化されたcitation percentile
- OpenAlex Top 10% / Top 1% flag

OpenAlex API keyはHTMLやJavaScriptへ書かず、GitHubリポジトリの
`Settings > Secrets and variables > Actions` に `OPENALEX_API_KEY` という名前で登録してください。

登録後、以下のGitHub Actionsを手動実行、または毎月の自動実行に任せます。

```text
.github/workflows/update-publication-metrics.yml
```

ブラウザだけで取得する場合は、次を開きます。

```text
admin/openalex-metrics-updater.html
```

API keyを入力して取得すると、同じブラウザではHPへ戻って再読み込みするだけで即時表示されます。
全閲覧者へ公開する場合は、管理画面から保存したJSONを次へ置き換えます。

```text
assets/data/publication_metrics.json
```

ローカルのコマンドライン更新は次です。

```bash
OPENALEX_API_KEY="your-key" python tools/update_publication_metrics.py --site-root .
```

### JIF・Web of Science / InCites値

Journal Impact Factorは論文固有の指標ではなく掲載誌の雑誌指標です。OpenAlexはJIFを提供しません。
また、JCR / Web of Science / InCitesの正式データは契約・ライセンスに依存するため、Webページをスクレイピングして自動取得しません。

正式値を表示する場合は、次のCSVに入力します。

```text
assets/data/publication_metrics_manual.csv
```

列は次の通りです。

```csv
doi,jif,jif_year,wos_citations,wos_top_10_percent,manual_updated_at,notes
```

入力後、次を実行するとJSONへ統合されます。

```bash
python tools/update_publication_metrics.py --site-root . --no-openalex
```

### コピー・CV出力への含め方

画面上では指標データがある論文について、書誌・DOIの直後へ常時表示します。コピーやフルCVへは初期状態では含めません。
`正式表記・コピー用` の「論文指標をコピーに含める」を選択した場合だけ、コピー・Word CV・PDF用CVの論文末尾へ追加されます。

より詳しい設定は `PUBLICATION_METRICS_SETUP.md` を参照してください。
