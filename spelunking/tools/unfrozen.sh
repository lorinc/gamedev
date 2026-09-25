#!/usr/bin/env bash
# Every playable version is on the timeline (D037): prints the next b1 build id if b1.html, src/
# or rules/ changed since the newest frozen b1 build (tests and the Rule Lab bundle don't count),
# and exits 1. Exits 0, silent, when the newest build already matches.
# Usage: tools/unfrozen.sh [rev]   (rev defaults to HEAD)
set -euo pipefail
cd "$(dirname "$0")/.."
REV=${1:-HEAD}
LAST=$(git tag --list 'b1.*' | sort -V | tail -1)
if git diff --quiet "$LAST" "$REV" -- b1.html src rules ':(exclude)*.test.js' ':(exclude)src/bundles/v4'; then exit 0; fi
echo "b1.$(( ${LAST#b1.} + 1 ))"
exit 1
