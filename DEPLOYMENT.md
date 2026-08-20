# Deploying Homerack to Proxmox

The pipeline: push to `main` → GitHub Actions builds the Docker image and pushes it to
`ghcr.io/mladen2211/homerack-solution` → Watchtower (running alongside the app) notices
the new `:latest` tag and redeploys automatically. This mirrors the pipeline already
used for the other apps on this cluster (`wdng-online`, `macroset`, `beszel`).

## Infrastructure

This is a 2-node Proxmox VE cluster (`node1` 192.168.100.2, `node2` 192.168.100.3).
Every app gets its own dedicated **unprivileged LXC** (`features: nesting=1,keyctl=1`,
required for Docker-in-LXC), running Docker + Compose. `homerack` lives at:

- LXC hostname `homerack`, static IP `192.168.100.14/24`, on `node1`.
- Ubuntu, 2 cores / 1.5GB RAM / 8GB disk — this app is a single lightweight container
  (SQLite is embedded, no separate DB service), so it's sized like `beszel` rather than
  the heavier multi-container apps.

## Ingress: Cloudflare Tunnel (not nginx-proxy)

There's no reverse proxy on this cluster — ingress is a Cloudflare Tunnel. Two patterns
are in use elsewhere: a dedicated tunnel per app (`wdng`, `macroset`) or a **shared**
tunnel (the `cloudflared-personal` LXC, vmid 103 on node1) that routes to multiple
single-container apps via static `extra_hosts` entries in its
`/root/cloudflared/docker-compose.yml`. `homerack` uses the shared tunnel, matching
`beszel`/`mareco`/`portfolio`:

1. `cloudflared-personal`'s compose file gets one more `extra_hosts` line:
   `"homerack:192.168.100.14"`, then the container is restarted to pick it up.
2. A **Public Hostname** rule is added in the Cloudflare Zero Trust dashboard (Networks
   → Tunnels → the tunnel → Public Hostname): `homerack.mraguz.com` → `HTTP` →
   `homerack:3000`. This part isn't scriptable over SSH — it's a dashboard-only step.

`docker-compose.yml` just publishes port 3000 on the LXC (`ports: - "3000:3000"`), the
same as `beszel`'s `8090:8090` — no reverse-proxy labels needed.

## One-time setup

1. **GHCR auth.** The sibling LXCs already have a working `docker login ghcr.io`
   credential at `/root/.docker/config.json` — the same one works here since all images
   are under the same `ghcr.io/mladen2211/*` namespace. Copy it to the new LXC, or run
   `docker login ghcr.io` fresh with a PAT that has `read:packages` scope.

2. **Environment file.** Copy `.env.example` to `.env` next to `docker-compose.yml` on
   the LXC and fill in `NUXT_SURVEY_IP_SALT` (any random string) and
   `NUXT_OG_IMAGE_SECRET` (generate with `npx nuxt-og-image generate-secret` — keeps
   social-preview image URLs stable across redeploys instead of invalidating on every
   restart). `docker compose` refuses to start if either is left blank.

## First deploy

```bash
docker compose pull
docker compose up -d
docker compose logs -f homerack             # confirm it comes up clean
```

Verify:
- `curl -I http://192.168.100.14:3000/` returns 200 from inside the LAN.
- Once the Cloudflare Public Hostname rule is live: `curl -I https://homerack.mraguz.com/`
  returns 200, and the survey form on the live page actually submits successfully.
- The OG image renders: `curl -sI "$(curl -s https://homerack.mraguz.com/ | grep -o 'property="og:image" content="[^"]*"' | head -1 | sed 's/.*content="//;s/"$//')"`
  should return `200` with `content-type: image/png`. This is the one path most likely to
  break silently — it depends on the takumi native renderer's platform-specific install
  succeeding inside the container (see the Dockerfile's build-stage comments).

## Ongoing deploys

Nothing manual — push to `main`, GitHub Actions builds and pushes `:latest`, the
`homerack-watchtower` container (polling every 5 minutes, matching the sibling apps)
picks it up and restarts `homerack`. Survey data lives in the bind-mounted `./data`
directory on the LXC, so it survives every container restart/recreate.

## Extracting survey responses

There's no in-site admin page by design — pull the data over SSH:

```bash
# CSV, straight to your machine
docker exec homerack node scripts/export-survey-csv.mjs > responses.csv

# or grab the raw SQLite file if you'd rather query it yourself
docker cp homerack:/app/data/homerack.db ./homerack.db
```

## Backups

The only stateful thing is the `./data` directory on the LXC (one SQLite file) — back
it up as part of whatever already backs up the other app LXCs on this cluster (Proxmox's
own vzdump snapshots cover this automatically, since it's just a file inside the LXC's
rootfs).
