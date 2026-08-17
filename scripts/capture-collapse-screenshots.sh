#!/bin/bash

# Captures the quoted-thread collapse control for docs/receiving/web-safe-html.md.
#
# Boots a throwaway EmailEngine from a local checkout on its isolated e2e Redis db, stages a real
# conversation into a fresh Ethereal mailbox (an original message plus a reply that quotes it),
# opens the reply in the admin message browser and screenshots the folded and unfolded states of
# the <details class="ee-collapsed-thread"> block that EmailEngine's web-safe HTML emits.
#
# The instance is thrown away at the end, so this never touches dev (db 9), test (db 13) or
# default (db 8) data, and never leaves an account behind on a real install.
#
#   ./scripts/capture-collapse-screenshots.sh
#   EE_HEADED=1 ./scripts/capture-collapse-screenshots.sh          # watch it drive the UI
#   EE_KEEP_RUNNING=1 ./scripts/capture-collapse-screenshots.sh    # leave the instance up
#   EE_PORT=7098 ./scripts/capture-collapse-screenshots.sh         # if 7099 is taken
#
# Needs: an EmailEngine checkout with node_modules installed (EE_REPO, default ../emailengine), a
# local Redis, outbound internet (Ethereal + the trial endpoint), and the Playwright Chromium
# build (`npm run test:e2e:install` in the EmailEngine checkout, once).

set -euo pipefail

DOCS_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# The EmailEngine checkout supplying the server, its Ethereal/bootstrap test helpers and the
# Playwright browser. Everything this script needs lives there; the docs repo only receives the
# finished PNGs.
EE_REPO="${EE_REPO:-$(cd "${DOCS_DIR}/../emailengine" 2>/dev/null && pwd || true)}"

if [ -z "$EE_REPO" ] || [ ! -f "${EE_REPO}/server.js" ]; then
    echo "Could not find an EmailEngine checkout. Set EE_REPO to one, e.g." >&2
    echo "  EE_REPO=~/Projects/emailengine $0" >&2
    exit 1
fi

# Defaults to the e2e port from the checkout's config/e2e.toml. EENGINE_PORT is exported below so
# EE_PORT really moves the instance, not just the health check.
PORT="${EE_PORT:-7099}"
EE_URL="${EE_URL:-http://127.0.0.1:${PORT}}"
OUT_DIR="${EE_OUT_DIR:-${DOCS_DIR}/static/img/screenshots}"
BOOT_TIMEOUT="${EE_BOOT_TIMEOUT:-120}"
SERVER_LOG="${EE_SERVER_LOG:-$(mktemp -t ee-collapse-server)}"

export NODE_ENV=e2e
export EENGINE_PORT="$PORT"
export EE_URL
export EE_REPO
export EE_OUT_DIR="$OUT_DIR"

SERVER_PID=""

cleanup() {
    local status=$?
    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        if [ "${EE_KEEP_RUNNING:-}" = "1" ]; then
            echo ""
            echo "Instance left running at ${EE_URL} (pid ${SERVER_PID}); log: ${SERVER_LOG}"
            echo "Stop it with: kill ${SERVER_PID}"
            return
        fi
        echo "Stopping EmailEngine (pid ${SERVER_PID})..."
        # server.js renames its process title, so pattern-matching on "node server.js" misses it.
        # Signal the process group instead, so the forked workers go down with the parent.
        kill -TERM -"${SERVER_PID}" 2>/dev/null || kill -TERM "${SERVER_PID}" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
    if [ "$status" -ne 0 ] && [ -f "$SERVER_LOG" ]; then
        echo ""
        echo "--- last 40 lines of the server log (${SERVER_LOG}) ---"
        tail -40 "$SERVER_LOG" || true
    fi
}
trap cleanup EXIT

if lsof -i ":${PORT}" >/dev/null 2>&1; then
    echo "Port ${PORT} is already in use - stop that process, or pick another port with" >&2
    echo "  EE_PORT=7098 $0" >&2
    echo "(see 'lsof -i :${PORT}' for what is holding it)." >&2
    exit 1
fi

cd "$EE_REPO"

echo "Using EmailEngine checkout: ${EE_REPO}"
echo "Flushing the e2e Redis db..."
node test/helpers/flush-redis.js

echo "Booting EmailEngine on ${EE_URL} (log: ${SERVER_LOG})..."
# Own process group so cleanup can take the workers down with the parent.
set -m
node server.js >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!
set +m

for _ in $(seq 1 "$BOOT_TIMEOUT"); do
    if curl -fsS "${EE_URL}/health" >/dev/null 2>&1; then
        break
    fi
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "EmailEngine exited during startup." >&2
        exit 1
    fi
    sleep 1
done

if ! curl -fsS "${EE_URL}/health" >/dev/null 2>&1; then
    echo "EmailEngine did not become healthy within ${BOOT_TIMEOUT}s." >&2
    exit 1
fi
echo "EmailEngine is up."

node "${DOCS_DIR}/scripts/capture-collapse-screenshots.js"
