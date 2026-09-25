#!/usr/bin/env bash
# Push, with every playable version on the timeline (D037). If the newest bundle (bN) changed since
# its newest frozen build, freezes the next one (bN.M+1) into the entry that holds its newest build
# (for bN.1, the entry whose dev: line names bN.html), adds its build line (the last commit's
# subject), regenerates the timeline, commits, then pushes main + the tag.
# Usage: npm run ship   (commit your work first)
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
cd "$HERE"
[ -z "$(git status --porcelain -- .)" ] || { echo "uncommitted changes in $(basename "$HERE")/: commit first"; exit 1; }
if NEXT=$(tools/unfrozen.sh); then
  echo "b1 unchanged since its newest build: pushing"
  git push
  exit 0
fi
B=${NEXT%.*}
LAST=$(git tag --list "$B.*" | sort -V | tail -1)
if [ -n "$LAST" ]; then
  ENTRY=$(grep -l "^build $LAST:" timeline/p*/entry.md | head -1 | xargs dirname | xargs basename)
  AFTER="^build $LAST:"
else # its first build: the entry whose dev: line names the page
  ENTRY=$(grep -lE "^dev: .*\b$B\.html" timeline/p*/entry.md | head -1 | xargs dirname | xargs basename)
  AFTER="^dev: "
fi
[ -n "$ENTRY" ] || { echo "no entry holds $B: give one a 'dev: $B.html' line"; exit 1; }
if grep -qE '^status: (concluded|killed)' "timeline/$ENTRY/entry.md"; then
  echo "$ENTRY is closed: open a new entry and give it a build line first"; exit 1
fi
SUBJECT=$(git log -1 --format=%s)
tools/freeze.sh "$ENTRY" "$NEXT"
# the new build line goes right after the newest one
sed -i "/$AFTER/a build $NEXT: $(date +%F) · $SUBJECT" "timeline/$ENTRY/entry.md"
node tools/timeline.js --strict
git add "timeline/$ENTRY" timeline/index.html
git commit -q -m "Freeze $NEXT into $ENTRY" -m "$SUBJECT"
git push
git push origin "$NEXT"
echo "shipped $NEXT → timeline/$ENTRY/builds/$NEXT/"
