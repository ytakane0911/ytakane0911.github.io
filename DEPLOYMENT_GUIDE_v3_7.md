# Deploying the audited v3.7 site to GitHub Pages

Repository: `ytakane0911/ytakane0911.github.io`

## Recommended method: fresh clone + backup branch + one replacement commit

Do not upload the ZIP file itself. Extract it first and commit the extracted contents.

### 1. Make a fresh clone

```bash
cd ~/Documents
git clone https://github.com/ytakane0911/ytakane0911.github.io.git ytakane0911.github.io-v37
cd ytakane0911.github.io-v37
git switch main
git pull --ff-only origin main
```

A fresh clone is recommended because the uploaded local backup contains uncommitted `.DS_Store` and Unicode-filename normalization changes.

### 2. Create a remote backup branch and tag

```bash
git branch backup-pre-v3.7-20260801
git push origin backup-pre-v3.7-20260801
git tag pre-v3.7-20260801
git push origin pre-v3.7-20260801
```

### 3. Extract the audited ZIP elsewhere

For example, double-click the ZIP in Downloads. The extracted folder must contain `index.html` directly at its top level.

### 4. Replace the working tree while preserving `.git`

Replace `/PATH/TO/EXTRACTED_V37/` with the actual extracted folder path.

```bash
rsync -av --delete --exclude='.git/' "/PATH/TO/EXTRACTED_V37/" ./
```

Do not delete the `.git` directory.

### 5. Review and commit

```bash
git status
git diff --stat
git add -A
git commit -m "Deploy redesigned personal website v3.7"
git push origin main
```

### 6. Set GitHub Pages to GitHub Actions

In the repository:

- Settings → Pages
- Build and deployment → Source: **GitHub Actions**

The included `Deploy website to GitHub Pages` workflow publishes the static site after normal pushes. It also runs after the publication-metrics workflow, so updated OpenAlex data becomes visible without an extra manual commit.

### 7. Verify the site

Check:

- `https://ytakane0911.github.io/`
- `https://ytakane0911.github.io/index_en.html`
- Desktop and mobile layouts
- Language switching
- Research-achievement filters and CV-copy view
- Full CV export

### 8. Enable OpenAlex updates

In GitHub:

- Settings → Secrets and variables → Actions
- Create repository secret: `OPENALEX_API_KEY`
- Actions → **Update publication metrics** → **Run workflow**

Do not commit the API key into any repository file.

## Rollback

To restore the old version quickly:

```bash
git switch main
git reset --hard pre-v3.7-20260801
git push --force-with-lease origin main
```

A safer non-force alternative is to revert the v3.7 deployment commit from the GitHub commit page.
