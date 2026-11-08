# Cloudflare (account `668f78c5…`, zone `necookie.dev`)

All resources are new and Bearerchum-specific. No existing DNS record, tunnel or Worker is
modified. This is the same design as Money Money: the backend is never published on the
internet.

| Resource | Purpose | Status |
|---|---|---|
| Worker `bearerchum-web` + custom domain `bearerchum.necookie.dev` | Static site (Workers assets, SPA fallback) and `/api/*` forwarding. Source: [`web/`](web) | deployed |
| Tunnel `bearerchum-api` (remotely managed, **no public hostname / ingress rules**) | Private connector run by the `bearerchum-tunnel` container inside the Coolify stack | to create |
| Workers VPC service `bearerchum-api` | HTTP to hostname `bearerchum-web`, port 8000, through that tunnel. cloudflared resolves the name with Docker DNS on `bearerchum-network` | to create |

```text
browser ──HTTPS──▶ Worker bearerchum-web (bearerchum.necookie.dev)
                     ├─ static assets (React app, /content, /reviewer.pdf, /py-worker.js)
                     └─ /api/*  env.API.fetch()  (Workers VPC)
                                   ▼
                     Tunnel bearerchum-api ◀── QUIC (outbound) ── bearerchum-tunnel container
                                                                    │ Docker DNS
                                                                    ▼
                                                     bearerchum-web:8000 ─▶ SQLite on volume bearerchum-data
```

Until the VPC binding exists, `/api/*` answers 503 and the site works in guest mode: progress
is kept in the browser and moved into the account on first sign-in.

## Connect the backend (one time)

```bash
export CLOUDFLARE_ACCOUNT_ID=668f78c5a9581c5051bd60a4985d6166
npx wrangler tunnel create bearerchum-api
# tunnel token -> Coolify env CLOUDFLARE_TUNNEL_TOKEN on the "bearerchum" app
#   (dashboard -> Zero Trust -> Tunnels -> bearerchum-api -> Install, copy the eyJ… token)
npx wrangler vpc service create bearerchum-api --type http \
  --tunnel-id <tunnel-id> --hostname bearerchum-web --http-port 8000
# put the service id into web/wrangler.jsonc (vpc_services), then:
node infra/scripts/deploy-web.mjs
```

## Redeploy the site

`node infra/scripts/deploy-web.mjs` builds the content (runs every reference solution), builds
the React app, copies in the PDF and runs `wrangler deploy`.
