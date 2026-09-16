#!/usr/bin/env bash
set -euo pipefail
cd /app
export AUTH_DB_PATH="${AUTH_DB_PATH:-/var/data/skillmap.sqlite}"
export MARKET_DB_PATH="${MARKET_DB_PATH:-/app/deploy/backend/skillshift.db}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-${RENDER_EXTERNAL_URL:-}}"
: "${BETTER_AUTH_URL:?Set BETTER_AUTH_URL to the public HTTPS URL}"
: "${BETTER_AUTH_SECRET:?Set BETTER_AUTH_SECRET}"
: "${GEMINI_API_KEY:?Set GEMINI_API_KEY}"
mkdir -p "$(dirname "$AUTH_DB_PATH")"
node --experimental-transform-types scripts/init-auth.mts
if [ "${DEMO_ENABLED:-false}" = true ]; then
  node --experimental-transform-types scripts/seed-demo.mts
fi
/opt/venv/bin/python -m uvicorn main:app --app-dir deploy/backend --host 127.0.0.1 --port 8000 &
backend=$!
frontend=''
cleanup() {
  kill -TERM "$backend" ${frontend:+"$frontend"} 2>/dev/null || true
  wait || true
}
trap cleanup EXIT
trap 'exit 0' TERM INT
/opt/venv/bin/python - <<'PY'
import time, urllib.request
for attempt in range(60):
    try:
        with urllib.request.urlopen('http://127.0.0.1:8000/api/market/overview', timeout=2) as response:
            assert response.status == 200
        break
    except Exception:
        time.sleep(1)
else:
    raise SystemExit('Backend did not become ready')
PY
node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port "${PORT:-10000}" &
frontend=$!
# If either service exits, terminate its sibling and let the host restart both.
set +e
wait -n "$backend" "$frontend"
exit 1
