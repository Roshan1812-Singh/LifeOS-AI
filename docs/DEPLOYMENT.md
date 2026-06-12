# LifeOS AI — Deployment Guide

This guide covers shipping LifeOS AI to production: the backend API, the web app, PostgreSQL, Redis, and the mobile app.

## Artifacts

| Artifact | Source | Output |
|---|---|---|
| Backend image | `backend/Dockerfile` (multi-stage, non-root, healthcheck) | `ghcr.io/<owner>/lifeos-backend` |
| Frontend image | `frontend/Dockerfile` (Vite build → nginx) | `ghcr.io/<owner>/lifeos-frontend` |
| Production stack | `docker-compose.prod.yml` | postgres + redis + backend + frontend |
| Mobile apps | `mobile/` (Expo + EAS) | Android APK/AAB, iOS build |

## 1. Prerequisites

- A host with Docker Engine + Docker Compose v2 (any Linux VM works).
- A domain name and a TLS-terminating reverse proxy in front (Caddy, Traefik, or nginx) — strongly recommended.
- (Optional) An OpenAI-compatible API key for live AI features. Without it, AI endpoints return an honest `503` and everything else works.

## 2. Generate secrets

Never reuse the development defaults. Generate strong values:

```bash
openssl rand -base64 64   # JWT_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD
openssl rand -base64 24   # REDIS_PASSWORD
```

Copy the template and fill it in:

```bash
cp .env.production.example .env
# edit .env: set BACKEND_IMAGE/FRONTEND_IMAGE, passwords, JWT_SECRET, CORS_ALLOWED_ORIGINS
```

`CORS_ALLOWED_ORIGINS` must list the exact origin(s) of your web app (e.g. `https://app.yourdomain.com`).

## 3. Get the images

**Option A — pull released images from GHCR** (built by CI on every `v*.*.*` tag):

```bash
docker compose -f docker-compose.prod.yml pull
```

**Option B — build locally:**

```bash
docker compose -f docker-compose.prod.yml build
```

## 4. Launch

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps      # all services should become "healthy"
docker compose -f docker-compose.prod.yml logs -f backend
```

- Postgres and Redis are **not** published to the host (internal network only).
- The backend API is published on `BACKEND_PORT` (default `8080`) — the mobile app talks to it directly.
- The web app is published on `WEB_PORT` (default `80`) and proxies `/api` to the backend.

### Database migrations
Flyway runs automatically on backend startup and is the single source of truth for the schema (`spring.jpa.hibernate.ddl-auto=validate` in prod). No manual migration step is required.

## 5. TLS / reverse proxy

Terminate TLS at a proxy and forward to the `frontend` (port 80) and/or `backend` (port 8080). The backend honours `X-Forwarded-*` headers (`server.forward-headers-strategy=framework`). Example with Caddy:

```
app.yourdomain.com {
    reverse_proxy localhost:80
}
api.yourdomain.com {
    reverse_proxy localhost:8080
}
```

## 6. CI/CD

- **`.github/workflows/ci.yml`** runs on every push/PR: backend `mvn verify`, frontend type-check/build/test, and a Docker image build (no push) to catch Dockerfile regressions.
- **`.github/workflows/release.yml`** runs on `v*.*.*` tags: builds and pushes the backend and frontend images to GHCR (semver + `latest` + sha tags) using the repo's `GITHUB_TOKEN`.

Cut a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

On the server, roll forward:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 7. Health & monitoring

- Backend liveness/readiness: `GET /actuator/health` (returns `{"status":"UP"}`; details require auth).
- Both containers define Docker `HEALTHCHECK`s, so `docker compose ps` reflects real health and `depends_on: condition: service_healthy` gates startup order.

## 8. Backups

```bash
# Postgres logical backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql

# Restore
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Locally-stored uploads live in the `uploads_data` volume. For production at scale, set `STORAGE_PROVIDER=s3` (+ `S3_*`) so files live in object storage and the backend stays stateless.

## 9. Scaling notes

- The backend is **stateless** (JWT auth, no server sessions), so it scales horizontally behind a load balancer — provided uploads go to S3 (not the local volume).
- Postgres and Redis should be managed/replicated services in larger deployments (e.g. RDS/ElastiCache); just point the env vars at them and drop those services from the compose file.

## 10. Cloud options

- **Single VM**: the compose stack above (+ Caddy) is enough for most workloads.
- **Render / Railway / Fly.io**: deploy the two images as web services, attach managed Postgres + Redis, set the same env vars.
- **AWS ECS/Fargate**: push images to ECR (or use GHCR), run backend + frontend tasks, RDS Postgres, ElastiCache Redis, S3 for uploads, ALB for TLS.

## 11. Mobile release (EAS)

From `mobile/` (see `mobile/README.md`):

```bash
npm install -g eas-cli
eas login && eas init          # fills extra.eas.projectId
# Set EXPO_PUBLIC_API_URL in eas.json profiles to your deployed API URL first.
eas build -p android --profile preview      # installable APK
eas build -p android --profile production    # Play Store AAB
eas build -p ios --profile production        # iOS (Apple credentials required)
eas submit -p android                         # optional: upload to stores
```

## 12. Rollback

Images are immutable per tag, so rolling back is just pinning the previous tag:

```bash
# in .env
BACKEND_IMAGE=ghcr.io/<owner>/lifeos-backend:v0.9.0
FRONTEND_IMAGE=ghcr.io/<owner>/lifeos-frontend:v0.9.0

docker compose -f docker-compose.prod.yml up -d
```
