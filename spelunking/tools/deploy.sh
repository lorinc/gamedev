#!/usr/bin/env bash
# Publishes the timeline to the public repo behind GitHub Pages: https://lorinc.github.io/spelunking-play/
#   /            timeline/ as it is: index.html, entries, feedback, media, frozen builds
#   /dev/        the live, unfrozen bN.html + src/ (no tests), for phone testing
# Concept docs, guides, tests and tools stay in the private repo. Refuses to publish if an
# entry links outside timeline/ or the timeline has other problems.
# Usage: npm run deploy   (from spelunking/)
set -euo pipefail

REPO=https://github.com/lorinc/spelunking-play.git
HERE=$(cd "$(dirname "$0")/.." && pwd)
SRC_REV=$(git -C "$HERE" rev-parse --short HEAD)
if [ -n "$(git -C "$HERE" status --porcelain -- .)" ]; then SRC_REV="$SRC_REV+dirty"; fi

node "$HERE/tools/timeline.js" --strict # the committed index.html must be current too

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
git clone --quiet --depth 1 "$REPO" "$TMP/site"

# --delete drops files removed since the last publish; .git stays.
rsync -a --delete --exclude .git --exclude /dev "$HERE/timeline/" "$TMP/site/"
rsync -a --delete --exclude '*.test.js' \
  --include '/b*.html' --include '/src/***' --exclude '*' \
  "$HERE/" "$TMP/site/dev/"
node "$HERE/tools/timeline.js" --strict --dev dev/ --out "$TMP/site/index.html"
touch "$TMP/site/.nojekyll" # plain static files: skip GitHub's Jekyll build

cd "$TMP/site"
git add -A
if git diff --cached --quiet; then echo "nothing changed"; exit 0; fi
git commit --quiet -m "publish gamedev@$SRC_REV"
git push --quiet origin HEAD
echo "published gamedev@$SRC_REV → https://lorinc.github.io/spelunking-play/ (live in ~1 min)"
