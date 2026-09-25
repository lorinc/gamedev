#!/usr/bin/env bash
# Deploys the playable files (and nothing else) to the public repo behind GitHub Pages:
# https://lorinc.github.io/spelunking-play/  — design docs, tests and tools stay private.
# Usage: npm run deploy   (from spelunking/)
set -euo pipefail

REPO=https://github.com/lorinc/spelunking-play.git
HERE=$(cd "$(dirname "$0")/.." && pwd)
SRC_REV=$(git -C "$HERE" rev-parse --short HEAD)
if [ -n "$(git -C "$HERE" status --porcelain -- .)" ]; then SRC_REV="$SRC_REV+dirty"; fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
git clone --quiet --depth 1 "$REPO" "$TMP/site"

# Mirror only what the browser loads; --delete drops files removed since the last publish.
rsync -a --delete --exclude .git --exclude '*.test.js' \
  --include '/index.html' --include '/b*.html' \
  --include '/src/***' \
  --exclude '*' \
  "$HERE/" "$TMP/site/"
touch "$TMP/site/.nojekyll" # plain static files: skip GitHub's Jekyll build

cd "$TMP/site"
git add -A
if git diff --cached --quiet; then echo "nothing changed"; exit 0; fi
git commit --quiet -m "publish gamedev@$SRC_REV"
git push --quiet origin HEAD
echo "published gamedev@$SRC_REV → https://lorinc.github.io/spelunking-play/ (live in ~1 min)"
