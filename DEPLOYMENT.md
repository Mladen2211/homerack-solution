# Deploying Homerack to Proxmox

The pipeline: push to `main` → GitHub Actions builds the Docker image and pushes it to
`ghcr.io/mladen2211/homerack-solution` → Watchtower on the Proxmox host notices the new
`:latest` tag and redeploys automatically. This mirrors the pipeline already used for the
other apps on this host.

## One-time setup on the Proxmox host

1. **Docker host.** An LXC (privileged, or unprivileged with the `keyctl`/nesting features
   enabled) or a small VM with Docker + Docker Compose installed. If Docker is already
   running there for the other apps, reuse that host.

2. **GHCR image visibility.** The GitHub Actions workflow publishes to
   `ghcr.io/mladen2211/homerack-solution`. Either make the package public (Package
   settings → Change visibility) or `docker login ghcr.io` on the Proxmox host with a
   PAT that has `read:packages` scope, so both the manual first pull and Watchtower's
   background pulls can authenticate.

3. **Reverse proxy / DNS.** `docker-compose.yml` ships with `VIRTUAL_HOST` /
   `LETSENCRYPT_HOST` labels for an nginx-proxy + acme-companion setup, matching the
   pattern used for the other apps on this host — **confirm this matches what's actually
   running** before first deploy:
   - If it's nginx-proxy + acme-companion: join the same Docker network those containers
     use (set the `proxy` network in `docker-compose.yml` to that network's real name),
     and the labels below handle TLS + routing automatically.
   - If it's a Cloudflare Tunnel instead: drop the `VIRTUAL_HOST`/`LETSENCRYPT_HOST`
     labels, keep the container on the tunnel's internal network, and add an ingress
     rule mapping `homerack.mraguz.com` → `http://homerack:3000` in the tunnel config.
   - Either way, `homerack.mraguz.com` needs a DNS record pointing at this host (an A/AAAA
     record for a plain reverse proxy, or a CNAME to the tunnel for Cloudflare Tunnel).

4. **Environment file.** Copy `.env.example` to `.env` next to `docker-compose.yml` on the
   host and fill in `NUXT_SURVEY_IP_SALT` (any random string) and `NUXT_OG_IMAGE_SECRET`
   (generate with `npx nuxt-og-image generate-secret` — keeps social-preview image URLs
   stable across redeploys instead of invalidating on every restart).

## First deploy

```bash
docker login ghcr.io -u <github-username>   # only if the package is private
docker compose pull
docker compose up -d
docker compose logs -f homerack             # confirm it comes up clean
```

Verify:
- `curl -I https://homerack.mraguz.com/` returns 200.
- The survey form on the live page actually submits successfully.
- The OG image renders: `curl -sI "$(curl -s https://homerack.mraguz.com/ | grep -o 'property="og:image" content="[^"]*"' | head -1 | sed 's/.*content="//;s/"$//')"`
  should return `200` with `content-type: image/png`. This is the one path most likely to
  break silently — it depends on the takumi native renderer's platform-specific install
  succeeding inside the container (see the Dockerfile's build-stage comments).

## Ongoing deploys

Nothing manual — push to `main`, GitHub Actions builds and pushes `:latest`, Watchtower
picks it up within its usual poll interval and restarts the container. Survey data lives
in the `homerack_data` named volume, so it survives every restart/recreate.

## Extracting survey responses

There's no in-site admin page by design — pull the data over SSH:

```bash
# CSV, straight to your machine
docker exec homerack node scripts/export-survey-csv.mjs > responses.csv

# or grab the raw SQLite file if you'd rather query it yourself
docker cp homerack:/app/data/homerack.db ./homerack.db
```

## Backups

The only stateful thing is the `homerack_data` volume (one SQLite file). Back it up
however you already back up other container volumes on this host — e.g.
`docker run --rm -v homerack_data:/data -v $PWD:/backup alpine tar czf /backup/homerack-data-$(date +%F).tar.gz -C /data .`
