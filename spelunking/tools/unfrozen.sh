#!/usr/bin/env bash
# Every playable version is on the timeline (D037): prints the next build id of the newest bundle
# (the highest bN.html) if its page, src/ or rules/ changed since its newest frozen build, and exits 1.
# A bundle with no frozen build yet prints bN.1. Tests, the Rule Lab and older bundles don't count:
# an older bundle (b1 once b2 exists) is done, and stays playable as its frozen builds.
# Exits 0, silent, when the newest build already matches.
# Usage: tools/unfrozen.sh [rev]   (rev defaults to HEAD)
set -euo pipefail
cd "$(dirname "$0")/.."
REV=${1:-HEAD}
N=$(ls b*.html | sed -nE 's/^b([0-9]+)\.html$/\1/p' | sort -n | tail -1)
B="b$N"
LAST=$(git tag --list "$B.*" | sort -V | tail -1)
if [ -z "$LAST" ]; then
  echo "$B.1"
  exit 1
fi
EXCLUDE=(':(exclude)*.test.js' ':(exclude)src/bundles/v4')
for d in src/bundles/b*/; do
  d=${d%/}
  [ "$d" = "src/bundles/$B" ] || EXCLUDE+=(":(exclude)$d")
done
if git diff --quiet "$LAST" "$REV" -- "$B.html" src rules "${EXCLUDE[@]}"; then exit 0; fi
echo "$B.$((${LAST#"$B".} + 1))"
exit 1
