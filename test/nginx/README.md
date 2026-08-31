# nginx proxy tests

Tests for the production nginx that serves the SPA and proxies `/api/*` to
Workflow's Main.Api, injecting `X-Api-Key` server-side.

- `render.test.sh` — renders `frontend/nginx.conf.template` with `envsubst` and
  asserts the upstream rewrite, `X-Api-Key` injection, preserved nginx `$vars`,
  and no leftover placeholders. Needs only `envsubst`. Runs anywhere.
- `proxy.test.sh` — boots real nginx + a stub upstream and asserts the key is
  injected on live requests and rate limiting returns `429`. Needs Docker;
  skips cleanly when no daemon is present.

```bash
bash test/nginx/render.test.sh
bash test/nginx/proxy.test.sh
```

## Manual end-to-end demo

```bash
# 1. Main.Api on 127.0.0.1:8080 (separate stack; see Workflow deploy/)
cd ../Workflow/deploy && docker compose up      # or: dotnet run --project Main.Api

# 2. filigrane frontend + nginx, pointed at it
WORKFLOW_API_KEY=<same key as Main.Api/.env> \
WORKFLOW_API_URL=http://host.docker.internal:8080 \
docker compose up
```

Open <http://localhost>, upload a PDF, watermark it. DevTools → Network shows
no `X-Api-Key` on the browser's own request; nginx injects it upstream.
