# Apply the v3.7.2 DOI patch

This patch contains only:

- `index.html`
- `index_en.html`
- `DOI_AUDIT_v3_7_2.md`

It does not overwrite `assets/data/publication_metrics.json`.

Assuming your deployed working repository is:

```bash
DEPLOY="$HOME/HP-GitHub-v3.7.1/ytakane0911.github.io-v3.7.1-deploy"
```

and the patch is expanded to:

```bash
PATCH="$HOME/Downloads/Yuya_Takane_HP_v3_7_2_DOI_PATCH"
```

apply it with:

```bash
rsync -av "$PATCH/" "$DEPLOY/"
git -C "$DEPLOY" status --short
git -C "$DEPLOY" add index.html index_en.html DOI_AUDIT_v3_7_2.md
git -C "$DEPLOY" commit -m "Correct and complete publication DOIs"
git -C "$DEPLOY" push origin main
```

Then update OpenAlex metrics:

```bash
gh workflow run "Update publication metrics" \
  --repo ytakane0911/ytakane0911.github.io
```
