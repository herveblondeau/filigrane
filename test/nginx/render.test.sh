#!/usr/bin/env bash
# Render test for frontend/nginx.conf.template.
#
# Pins the core new behaviour of stone 5 at the config-generation seam: the
# nginx image renders the template at container start with envsubst, restricted
# to the env vars we define (WORKFLOW_API_URL, WORKFLOW_API_KEY). This test
# reproduces that exact substitution and asserts:
#   - the upstream is rewritten to WORKFLOW_API_URL
#   - X-Api-Key is injected on every /api location
#   - nginx's own runtime $variables are left untouched
#   - no unresolved ${WORKFLOW_*} placeholders remain
#
# Runs anywhere envsubst exists; needs neither nginx nor Docker.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
template="$here/../../frontend/nginx.conf.template"

export WORKFLOW_API_URL="http://host.docker.internal:8080"
export WORKFLOW_API_KEY="test-key-123"

# Mirror the nginx image: substitute ONLY these two vars, nothing else.
rendered="$(envsubst '${WORKFLOW_API_URL} ${WORKFLOW_API_KEY}' < "$template")"

fail=0
check() { # <description> <expected-count> <pattern>
    local desc="$1" want="$2" pat="$3" got
    got="$(printf '%s\n' "$rendered" | grep -cF "$pat" || true)"
    if [ "$got" -eq "$want" ]; then
        echo "ok   - $desc ($got)"
    else
        echo "FAIL - $desc: expected $want, got $got  [$pat]"
        fail=1
    fi
}
refute() { # <description> <pattern>
    local desc="$1" pat="$2"
    if printf '%s\n' "$rendered" | grep -qF "$pat"; then
        echo "FAIL - $desc: found forbidden [$pat]"
        fail=1
    else
        echo "ok   - $desc"
    fi
}

# Upstream rewritten on all three /api locations
check "upstream points at WORKFLOW_API_URL"      3 "proxy_pass         http://host.docker.internal:8080;"
# X-Api-Key injected on all three /api locations
check "X-Api-Key injected"                       3 'proxy_set_header   X-Api-Key         "test-key-123";'
# nginx's own runtime variables preserved (must NOT be substituted)
check "\$host preserved"                          3 "Host              \$host;"
check "\$proxy_add_x_forwarded_for preserved"     3 "\$proxy_add_x_forwarded_for;"
check "\$binary_remote_addr preserved"            3 "limit_req_zone \$binary_remote_addr"
# No unresolved placeholders leak into the served config
refute "no unresolved \${WORKFLOW_*} placeholders" '${WORKFLOW_'

if [ "$fail" -ne 0 ]; then
    echo "RENDER TEST FAILED"
    exit 1
fi
echo "RENDER TEST PASSED"
