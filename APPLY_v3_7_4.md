# Apply v3.7.4 to the current GitHub working copy

## 1. Set paths

```bash
DEPLOY="/Users/yuya.takane/Urban climate Dropbox/Yuya Takane/2025.0401-環境研/事務/個人HP/github/ytakane0911.github.io-v3.7.1-deploy"
PATCH="$HOME/Desktop/Yuya_Takane_HP_v3_7_4_VERIFIED_PERFORMANCE_FONT_PATCH"
```

Adjust `PATCH` only if the expanded folder is elsewhere.

## 2. Confirm the patch

```bash
test -f "$PATCH/site-version.json" \
  && echo "OK: v3.7.4 patch found" \
  || echo "ERROR: patch folder not found"
```

## 3. Update the local main branch first

```bash
git -C "$DEPLOY" switch main
git -C "$DEPLOY" status --short
```

The second command should show no unexpected local changes.

```bash
git -C "$DEPLOY" pull --rebase origin main
```

## 4. Apply the patch

```bash
rsync -av \
  "$PATCH/" \
  "$DEPLOY/"
```

Do **not** add `--delete`; this is a patch and must not delete metrics or workflow files.

## 5. Verify locally before commit

```bash
grep -o 'data-site-build="3.7.4"' "$DEPLOY/index.html"
grep -o 'site-v3.css?v=3.7.4' "$DEPLOY/index.html"
grep -o 'site-v3.js?v=3.7.4' "$DEPLOY/index.html"
grep -o 'assets/images/optimized/hero-tokyo-900.webp' "$DEPLOY/index.html"
```

Each command should print a matching value.

The next two commands should print nothing:

```bash
grep -n 'src="assets/js/jszip.min.js"' "$DEPLOY/index.html"
grep -n 'googletagmanager.com/gtag/js' "$DEPLOY/index.html"
```

Optional JavaScript check:

```bash
node --check "$DEPLOY/assets/js/site-v3.js"
```

## 6. Test with a local web server

```bash
cd "$DEPLOY"
python3 -m http.server 8000
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/index_en.html`

After checking, stop the server with `Control + C`.

## 7. Commit

```bash
git -C "$DEPLOY" status --short
```

Then:

```bash
git -C "$DEPLOY" add \
  index.html \
  index_en.html \
  assets/css/site-v3.css \
  assets/js/site-v3.js \
  assets/images/optimized \
  site-version.json \
  APPLY_v3_7_4.md \
  PERFORMANCE_FONT_AUDIT_v3_7_4.md \
  QA_v3_7_4.json \
  VERIFY_v3_7_4.sh \
  SHA256SUMS.txt
```

```bash
git -C "$DEPLOY" commit \
  -m "Apply verified performance and typography patch v3.7.4"
```

## 8. Incorporate any OpenAlex auto-commit and push

```bash
git -C "$DEPLOY" pull --rebase origin main
git -C "$DEPLOY" push origin main
```

Do not use force push.

## 9. Verify GitHub Pages really serves v3.7.4

After the Pages workflow succeeds:

```bash
curl -sL "https://ytakane0911.github.io/?verify=3.7.4" \
  | grep -o 'data-site-build="3.7.4"'
```

```bash
curl -sL "https://ytakane0911.github.io/?verify=3.7.4" \
  | grep -o 'assets/images/optimized/hero-tokyo-900.webp'
```

Both must return a match. If they do not, the patch is not deployed, regardless of how the page appears.

In the browser console, run:

```javascript
document.documentElement.dataset.siteBuild
```

Expected result:

```text
3.7.4
```

After switching away from the tab and returning, run:

```javascript
window.YUYA_SITE_DIAGNOSTICS
```

`wasDiscarded: true` means Chrome discarded and reloaded the tab because of browser memory management.
