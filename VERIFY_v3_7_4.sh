#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
fail=0
check_grep(){
  local label="$1" pattern="$2" file="$3"
  if grep -q "$pattern" "$ROOT/$file"; then echo "OK: $label"; else echo "FAIL: $label"; fail=1; fi
}
check_absent(){
  local label="$1" pattern="$2" file="$3"
  if grep -q "$pattern" "$ROOT/$file"; then echo "FAIL: $label"; fail=1; else echo "OK: $label"; fi
}
check_grep "Japanese build marker" 'data-site-build="3.7.4"' index.html
check_grep "English build marker" 'data-site-build="3.7.4"' index_en.html
check_grep "Versioned CSS" 'site-v3.css?v=3.7.4' index.html
check_grep "Versioned JavaScript" 'site-v3.js?v=3.7.4' index.html
check_grep "Optimized hero" 'optimized/hero-tokyo-900.webp' index.html
check_grep "Japanese font stack" 'Hiragino Sans' assets/css/site-v3.css
check_grep "Delayed achievements" 'scheduleAchievementUi' assets/js/site-v3.js
check_grep "Delayed analytics" 'scheduleAnalytics' assets/js/site-v3.js
check_absent "No eager JSZip" 'src="assets/js/jszip.min.js"' index.html
check_absent "No eager Google Analytics script" 'googletagmanager.com/gtag/js' index.html
check_absent "No content-visibility:auto" 'content-visibility:auto' assets/css/site-v3.css
if command -v node >/dev/null 2>&1; then
  if node --check "$ROOT/assets/js/site-v3.js"; then echo "OK: JavaScript syntax"; else fail=1; fi
fi
exit "$fail"
