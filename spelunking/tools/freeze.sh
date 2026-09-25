#!/usr/bin/env bash
# Freezes a playable bundle build into the timeline: bN.html + src/ (no tests) + rules/ as of a commit,
# copied to timeline/<entry>/builds/<build>/ and tagged. A frozen build is never edited again.
# Usage: npm run freeze -- p3-dig-feel b1.2 [rev]   (rev defaults to HEAD, which must be clean)
set -euo pipefail

ENTRY=${1:?entry folder, e.g. p3-dig-feel}
BUILD=${2:?build id, e.g. b1.2}
REV=${3:-HEAD}
HERE=$(cd "$(dirname "$0")/.." && pwd)
DEST="$HERE/timeline/$ENTRY/builds/$BUILD"
PAGE="${BUILD%%.*}.html" # b1.2 → b1.html

[ -d "$HERE/timeline/$ENTRY" ] || { echo "no timeline/$ENTRY"; exit 1; }
[ -e "$DEST" ] && { echo "$DEST exists: frozen builds are never overwritten"; exit 1; }
if [ "$REV" = HEAD ] && [ -n "$(git -C "$HERE" status --porcelain -- "$PAGE" src rules)" ]; then
  echo "uncommitted changes in $PAGE, src/ or rules/: commit first, so the tag matches the build"; exit 1
fi

mkdir -p "$DEST"
git -C "$HERE" archive "$REV" "$PAGE" src rules | tar -x -C "$DEST" --exclude '*.test.js'
mv "$DEST/$PAGE" "$DEST/index.html"
# the live page calls itself 'bN-dev'; the frozen copy is stamped with its build id
MAIN="$DEST/src/bundles/${BUILD%%.*}/main.js"
[ -f "$MAIN" ] && sed -i "s/const BUILD = '[^']*'/const BUILD = '$BUILD'/" "$MAIN"
cp "$HERE/favicon.png" "$DEST/" # the page links favicon.png next to itself
node "$HERE/tools/frozen.js" "$DEST" # MANIFEST.sha256: tools/frozen.test.js fails if the build ever changes

if ! git -C "$HERE" rev-parse -q --verify "refs/tags/$BUILD" >/dev/null; then
  git -C "$HERE" tag "$BUILD" "$REV"
fi
echo "froze $BUILD ($(git -C "$HERE" rev-parse --short "$REV")) → timeline/$ENTRY/builds/$BUILD/"
echo "add to timeline/$ENTRY/entry.md frontmatter:  build $BUILD: $(date +%F) · <what changed>"
