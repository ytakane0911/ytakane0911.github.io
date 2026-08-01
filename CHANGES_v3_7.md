# Changes in v3.7

- 論文指標を独立ブロックではなく、各論文の正式書誌・DOIの直後へインライン表示する仕様に変更。
- OpenAlex引用数、FWCI、引用百分位、Top 10% / Top 1%に対応。
- 公開用JSONと、このブラウザで取得したlocalStorageキャッシュを自動統合。
- OpenAlex API keyを保存せずに実行できる管理画面 `admin/openalex-metrics-updater.html` を追加。
- 管理画面から、ブラウザ内即時反映と公開用 `publication_metrics.json` の保存に対応。
- GitHub Actionsの月次自動更新を維持・改善。
- JIF / Web of Science / InCites値は、権限のあるデータを手動CSVから統合する設計を維持。
