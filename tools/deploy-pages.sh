#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
REPO=${GITHUB_REPOSITORY:-ecooxai/gpt6-astra-pro-colabdev-web-bwcat}
BUILD=${BUILD_DIR:-$ROOT/build}
PUBLISH="$ROOT/.publish"
test -f "$BUILD/index.html"
test -f "$BUILD/assets/app.js"
test -s "$BUILD/downloads/GPT6-Astra-Pro_ColabDev_Web_BWCat_Source.zip"
mkdir -p "$PUBLISH" .logs
if [[ ! -d "$PUBLISH/.git" ]]; then
 git init -q -b gh-pages "$PUBLISH"
 git -C "$PUBLISH" remote add origin "https://github.com/$REPO.git"
 git -C "$PUBLISH" config user.name 'GPT-6 Astra Pro'
 git -C "$PUBLISH" config user.email 'gpt6-astra-pro@local.invalid'
fi
# Publish only this project's compiled public tree; private logs and credentials are excluded.
python3 - "$BUILD" "$PUBLISH" <<'PY'
from pathlib import Path
import shutil,sys
src=Path(sys.argv[1]).resolve();dst=Path(sys.argv[2]).resolve()
assert dst.name=='.publish' and (src/'index.html').is_file()
for p in dst.iterdir():
 if p.name=='.git':continue
 if p.is_dir() and not p.is_symlink():shutil.rmtree(p)
 else:p.unlink()
for p in src.iterdir():
 if p.is_dir():shutil.copytree(p,dst/p.name)
 else:shutil.copy2(p,dst/p.name)
(dst/'.nojekyll').touch()
PY
git -C "$PUBLISH" add -A
if ! git -C "$PUBLISH" diff --cached --quiet; then git -C "$PUBLISH" commit -qm 'Deploy original cat studio, model, source archive and review evidence'; fi
git -C "$PUBLISH" -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin gh-pages
if ! gh api "repos/$REPO/pages" > .logs/pages-status.json 2> .logs/pages-status-error.log; then
 printf '{"source":{"branch":"gh-pages","path":"/"}}\n' > .logs/pages-request.json
 gh api --method POST "repos/$REPO/pages" --input .logs/pages-request.json > .logs/pages-status.json
fi
python3 - <<'PY'
import json
from pathlib import Path
p=json.loads(Path('.logs/pages-status.json').read_text())
print('PAGES_URL='+p['html_url'])
print('PAGES_STATUS='+str(p.get('status')))
PY
