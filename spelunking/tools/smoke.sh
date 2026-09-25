#!/usr/bin/env bash
# Loads every page in headless Chromium and fails on any uncaught error, failed load or console
# error (R15). It catches the bugs Node can't see: a module that doesn't parse, an import path
# that only breaks in the browser, a rejected promise at startup. ~1 s per page, nothing to install
# beyond Chromium. It doesn't prove iOS 14 works (tools/compat.test.js and a real phone do that).
# Usage: tools/smoke.sh [page.html …]   (default: every *.html in this folder)
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
cd "$HERE"
BROWSER=$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)
[ -n "$BROWSER" ] || { echo "smoke: no chromium on PATH (R15); install it, or push --no-verify and say so"; exit 1; }

PAGES=("$@")
[ ${#PAGES[@]} -gt 0 ] || PAGES=(*.html)
PORT=$(python3 -c 'import socket; s = socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])')
PROFILE=$(mktemp -d)
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null; rm -rf "$PROFILE"' EXIT
for _ in $(seq 50); do (echo >/dev/tcp/127.0.0.1/"$PORT") 2>/dev/null && break; sleep 0.1; done

failed=0
for page in "${PAGES[@]}"; do
  # a fresh profile each run: no storage, like a first visit or a private window
  log=$("$BROWSER" --headless=new --user-data-dir="$PROFILE" --enable-logging=stderr --v=0 --virtual-time-budget=3000 \
    --dump-dom "http://127.0.0.1:$PORT/$page" 2>&1 >/dev/null || true)
  bad=$(grep -E 'INFO:CONSOLE' <<<"$log" | grep -Ei 'uncaught|error|failed to load' || true)
  if [ -n "$bad" ]; then
    echo "smoke · $page"
    sed -E 's/^.*INFO:CONSOLE[^]]*\] /  /' <<<"$bad"
    failed=1
  fi
done
[ $failed = 0 ] && echo "smoke · ${#PAGES[@]} pages load clean"
exit $failed
