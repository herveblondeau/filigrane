#!/usr/bin/env bash
# Behavioural test for the production nginx proxy (stone 5).
#
# Boots the real nginx (official image + our rendered template) in front of a
# tiny stub upstream that echoes the headers it receives, and asserts:
#   1. a browser request that sends NO X-Api-Key still reaches the upstream
#      WITH X-Api-Key injected server-side
#   2. the upstream is the one named by WORKFLOW_API_URL
#   3. rate limiting on /api/watermark returns 429 under a burst
#
# Requires Docker + curl + python3. Skips cleanly if Docker is unavailable.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
template="$here/../../frontend/nginx.conf.template"

if ! docker info >/dev/null 2>&1; then
    echo "SKIP - Docker unavailable; run this on a host with a Docker daemon"
    exit 0
fi

echo_port=8199
nginx_port=8180
key="test-key-abc"
cid=""
echo_pid=""

cleanup() {
    [ -n "$cid" ] && docker rm -f "$cid" >/dev/null 2>&1 || true
    [ -n "$echo_pid" ] && kill "$echo_pid" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# --- Stub upstream: echoes request headers as JSON ---
python3 - "$echo_port" <<'PY' &
import sys, json
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def _reply(self):
        body = json.dumps({k.lower(): v for k, v in self.headers.items()}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    do_GET = do_POST = lambda self: self._reply()
    def log_message(self, *a): pass
HTTPServer(("0.0.0.0", int(sys.argv[1])), H).serve_forever()
PY
echo_pid=$!
sleep 1

# --- nginx in front of the stub, rendering our template ---
cid="$(docker run -d --rm \
    -p "$nginx_port:80" \
    -v "$template:/etc/nginx/templates/nginx.conf.template:ro" \
    -e NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx \
    -e "WORKFLOW_API_URL=http://host.docker.internal:$echo_port" \
    -e "WORKFLOW_API_KEY=$key" \
    --add-host "host.docker.internal:host-gateway" \
    nginx:1.27-alpine)"

# Wait for nginx to accept connections
for _ in $(seq 1 30); do
    curl -fsS "http://localhost:$nginx_port/api/health" >/dev/null 2>&1 && break
    sleep 0.5
done

fail=0

# 1 + 2: browser sends no key; upstream must receive the injected one
resp="$(curl -fsS "http://localhost:$nginx_port/api/health")"
if printf '%s' "$resp" | grep -q "\"x-api-key\": \"$key\""; then
    echo "ok   - X-Api-Key injected server-side (browser sent none)"
else
    echo "FAIL - X-Api-Key not injected. Upstream saw: $resp"
    fail=1
fi

# 3: rate limiting trips a 429 under burst on the most-restricted route
saw_429=0
for _ in $(seq 1 12); do
    code="$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://localhost:$nginx_port/api/watermark")"
    [ "$code" = "429" ] && saw_429=1 && break
done
if [ "$saw_429" -eq 1 ]; then
    echo "ok   - rate limiting returns 429 under burst"
else
    echo "FAIL - never saw 429 on /api/watermark burst"
    fail=1
fi

if [ "$fail" -ne 0 ]; then
    echo "PROXY TEST FAILED"
    exit 1
fi
echo "PROXY TEST PASSED"
