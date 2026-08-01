# 論文指標の取得・表示設定（v3.7）

## 表示位置

論文指標は「研究業績」→「正式表記・コピー用」において、各論文の正式書誌と DOI の直後に表示されます。

例：

```text
Takane et al. (2024) ... doi:10.5194/gmd-17-8639-2024
【OpenAlex 引用数 13｜FWCI 2.31｜引用百分位 93.4｜OpenAlex Top 10%】
```

実際のHTML上では同じ段落内に続けて表示されます。

## 方法A：GitHub Actionsで自動更新（推奨）

1. OpenAlexでAPI keyを取得します。
2. GitHubリポジトリを開きます。
3. `Settings` → `Secrets and variables` → `Actions` → `New repository secret` を開きます。
4. 次の名前で登録します。

```text
Name: OPENALEX_API_KEY
Value: 取得したAPI key
```

5. `Actions` → `Update publication metrics` → `Run workflow` を実行します。
6. `assets/data/publication_metrics.json` が更新され、自動commitされます。

以後は毎月1日に自動更新されます。

**API keyをHTML、JavaScript、JSON、CSV、README等へ直接書かないでください。**

## 方法B：ブラウザ管理画面から取得

次を開きます。

```text
admin/openalex-metrics-updater.html
```

1. API keyを入力します。
2. 「OpenAlexから取得」を押します。
3. 同じブラウザでは、HPへ戻って再読み込みすると即座に指標が表示されます。
4. 全閲覧者へ公開する場合は「公開用JSONを保存」を押します。
5. 保存された `publication_metrics.json` を、リポジトリの次のファイルと置き換えます。

```text
assets/data/publication_metrics.json
```

管理画面はAPI keyをHTMLやlocalStorageへ保存しません。ブラウザ内のキャッシュには取得済みの論文指標だけを保存します。

## OpenAlexから自動取得する項目

- OpenAlex引用数（`cited_by_count`）
- FWCI
- citation-normalized percentile
- OpenAlex Top 10%
- OpenAlex Top 1%
- OpenAlexレコードID、取得日、更新日

## JIF・Web of Science・InCites

OpenAlexはJournal Impact Factor（JIF）を提供しません。JIFは論文固有の指標ではなく、掲載誌の雑誌指標です。

利用権限のあるJCR / Web of Science / InCitesの値は、次へ入力できます。

```text
assets/data/publication_metrics_manual.csv
```

形式：

```csv
doi,jif,jif_year,wos_citations,wos_top_10_percent,manual_updated_at,notes
```

入力後、ローカルで次を実行するか、通常のOpenAlex更新ワークフローを実行します。

```bash
python tools/update_publication_metrics.py --site-root . --no-openalex
```

## コピーとCV

画面上では論文指標を常時表示します。論文リスト、参考文献、フルCVへコピー・出力する際に含めるかどうかは、次のチェックで選択します。

```text
論文指標をコピーに含める
```

チェックなし：正式書誌だけをコピー  
チェックあり：正式書誌の末尾に指標も追加
