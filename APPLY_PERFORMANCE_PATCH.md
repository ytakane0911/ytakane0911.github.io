# Applying the v3.7.3 performance patch

## 1. Set the paths

The examples below assume that the extracted patch folder is on the Desktop.

```bash
DEPLOY="/Users/yuya.takane/Urban climate Dropbox/Yuya Takane/2025.0401-環境研/事務/個人HP/github/ytakane0911.github.io-v3.7.1-deploy"

PATCH="$HOME/Desktop/Yuya_Takane_HP_v3_7_3_PERFORMANCE_PATCH"
```

Confirm the patch:

```bash
test -f "$PATCH/index.html" \
  && echo "OK: performance patch found" \
  || echo "ERROR: patch folder not found"
```

## 2. Bring the local repository up to date

The OpenAlex workflow may have created a newer remote commit.

```bash
git -C "$DEPLOY" switch main

git -C "$DEPLOY" status --short
```

If `git status --short` prints unexpected local changes, stop before continuing.

```bash
git -C "$DEPLOY" pull --rebase origin main
```

## 3. Overlay the patch

Do not add `--delete`.

```bash
rsync -av \
  "$PATCH/" \
  "$DEPLOY/"
```

Expected changes include:

```text
index.html
index_en.html
assets/css/site-v3.css
assets/js/site-v3.js
assets/images/optimized/
PERFORMANCE_AUDIT_v3_7_3.md
APPLY_PERFORMANCE_PATCH.md
QA_PERFORMANCE_v3_7_3.json
SHA256SUMS.txt
```

The patch does not contain `assets/data/publication_metrics.json`, so current OpenAlex values remain intact.

## 4. Test locally

```bash
cd "$DEPLOY"
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/
http://localhost:8000/index_en.html
```

Check:

- Japanese and English first views
- left-side section links
- language switching
- achievements browse/formal modes
- publication metrics
- research stories and their images/videos
- full CV Word export

Stop the server with `Control + C`.

## 5. Review and commit

```bash
git -C "$DEPLOY" status --short
```

```bash
git -C "$DEPLOY" add \
  index.html \
  index_en.html \
  assets/css/site-v3.css \
  assets/js/site-v3.js \
  assets/images/optimized \
  PERFORMANCE_AUDIT_v3_7_3.md \
  APPLY_PERFORMANCE_PATCH.md \
  QA_PERFORMANCE_v3_7_3.json \
  SHA256SUMS.txt
```

```bash
git -C "$DEPLOY" commit \
  -m "Improve page performance and tab restoration"
```

Because an automated metrics workflow may have updated `main` while you were testing, integrate remote changes one more time:

```bash
git -C "$DEPLOY" pull --rebase origin main
```

Then push:

```bash
git -C "$DEPLOY" push origin main
```

Do not use `git push --force`.

## 6. Confirm deployment

```bash
gh run list \
  --repo ytakane0911/ytakane0911.github.io \
  --workflow "Deploy website to GitHub Pages" \
  --limit 3
```

After the latest run shows `completed  success`, open:

```bash
open "https://ytakane0911.github.io/"
open "https://ytakane0911.github.io/index_en.html"
```

Use `Command + Shift + R` once to bypass an old CSS/JavaScript cache. The patch also adds `?v=3.7.3` to the main CSS and JavaScript references.

## 7. If the push is rejected with `fetch first`

```bash
git -C "$DEPLOY" fetch origin
git -C "$DEPLOY" rebase origin/main
git -C "$DEPLOY" push origin main
```

If a conflict appears, do not force-push. Run:

```bash
git -C "$DEPLOY" status
```

and inspect the conflicted file before continuing.
