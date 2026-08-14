# Resonate AI

> Studio-quality audio cleaning, on demand. Upload raw recordings or video, and get a polished MP3 back within 24–48 hours.

Resonate AI is a self-hostable SaaS application built around a simple workflow:

1. **Sign up** with email + password (powered by [Better Auth](https://www.better-auth.com/))
2. **Upload** up to 25 audio or video files at once (≤ 500 MB each)
3. **We email you** a signed download link to the cleaned MP3 within 24–48 hours

Behind the scenes, every upload is persisted to Postgres, stored in [Garage](https://garagehq.deuxfleurs.org/) (an S3-compatible object store) running in Docker, converted to MP3 with FFmpeg, and a notification email is sent to the operator via SMTP.

See [USER_GUIDE.md](./USER_GUIDE.md) for the end-user walkthrough.

## Architecture

```
┌─────────┐    ┌─────────────────┐    ┌────────────┐
│  user   │───▶│  Next.js (web)  │───▶│   Garage   │
└─────────┘    │   :3000         │    │  S3 :3900  │
                └────┬──────┬─────┘    └────────────┘
                     │      │
                     ▼      ▼
               ┌────────┐ ┌────────┐
               │ Postgres│ │  SMTP  │
               │  :5432 │ │ :1025  │
               └────────┘ └────────┘
```

A bundled `garage-init` one-shot container creates the bucket and issues an access key on first boot, then exits. The web app reads the credentials from a shared Docker volume at startup.

## Stack

- **Frontend & API**: [Next.js 15](https://nextjs.org) (App Router, React 19, TypeScript)
- **Auth**: [Better Auth](https://www.better-auth.com/) — email & password
- **Database**: PostgreSQL 17 (via [Drizzle ORM](https://orm.drizzle.team/))
- **Storage**: [Garage](https://garagehq.deuxfleurs.org/) — S3-compatible object store (Docker image `dxflrs/garage`)
- **Audio conversion**: FFmpeg (any audio/video in → MP3 out)
- **Email**: Nodemailer (SMTP — Mailpit in dev, your SMTP server in prod)
- **Styling**: Tailwind CSS with a custom modern dark theme
- **Container**: Docker Compose

## Quick start (Docker)

```bash
# 1. Copy environment template and fill in real values
cp .env.example .env
# Edit .env — at minimum:
#   - BETTER_AUTH_SECRET (generate: openssl rand -base64 48)
#   - SMTP_* credentials for outbound mail
#   - NOTIFY_EMAIL (operator inbox) and ADMIN_EMAIL (gates /api/admin/*)
#   - POSTGRES_PASSWORD

# 2. Build & launch everything
docker compose up --build
```

Then open:

| Service          | URL                                |
|------------------|------------------------------------|
| Resonate AI web  | http://localhost:3000              |
| Mailpit inbox    | http://localhost:8025              |
| Garage S3 API    | http://localhost:3900              |
| Postgres         | `localhost:5432` (`resonate` / `resonate` / `resonate`) |

Sign up with any email + password (≥ 8 chars), then upload.

## Supported formats

**Audio (≤ 500 MB each):** MP3, WAV, FLAC, M4A, AAC, OGG, OPUS, AIFF, ALAC, WMA, AMR, AC3, CAF, AU, and more (anything `audio/*`).

**Video (audio is extracted and converted to MP3):** MP4, MOV, MKV, WEBM, AVI, WMV, FLV, 3GP, TS, MTS, M2TS, and more (anything `video/*`).

**Limits:** up to 25 files per batch, ≤ 500 MB per file.

## Production SMTP

By default the stack ships with [Mailpit](https://mailpit.axllent.org/) for catching notification emails in development. For production, replace the `mailpit` service in `docker-compose.yml` with your real SMTP — any provider that exposes SMTP works:

```yaml
environment:
  SMTP_HOST: smtp.resend.com
  SMTP_PORT: 587
  SMTP_USER: resend
  SMTP_PASS: ${RESEND_API_KEY}
  SMTP_SECURE: "false"
  SMTP_FROM: "Resonate AI <no-reply@yourdomain.com>"
  NOTIFY_EMAIL: team@yourdomain.com
  ADMIN_EMAIL: admin@yourdomain.com
```

- `NOTIFY_EMAIL` — operator address that receives upload notifications.
- `ADMIN_EMAIL` — single admin address that can mint signed download links for any user's file. The app refuses to start if this is missing.

## API surface

| Method | Path                                  | Description                                |
|--------|---------------------------------------|--------------------------------------------|
| POST   | `/api/auth/sign-up/email`             | Better Auth email/password sign-up         |
| POST   | `/api/auth/sign-in/email`             | Better Auth email/password sign-in         |
| POST   | `/api/upload`                         | Upload up to 25 audio/video files (multipart) |
| GET    | `/api/files`                          | List the signed-in user's uploads          |
| GET    | `/api/files/:id/url`                  | Mint a signed download URL for an upload   |
| GET    | `/api/admin/...`                      | Admin-only endpoints (gated by `ADMIN_EMAIL`) |
| GET    | `/api/health`                         | Web app healthcheck                        |

## Project layout

```
resonateai/
├── docker-compose.yml        # web + garage + garage-init + postgres + mailpit
├── .env.example
├── garage/
│   ├── garage.toml           # Garage S3 configuration
│   └── init.mjs              # One-shot: create bucket + access key on first boot
└── web/                      # Next.js app (Dockerfile + entrypoint included)
    ├── src/
    │   ├── app/              # App Router pages + API routes
    │   │   ├── api/          # auth, upload, files, admin, health
    │   │   ├── dashboard/    # Authenticated dashboard
    │   │   ├── sign-in/      # Sign-in page
    │   │   └── sign-up/      # Sign-up page
    │   ├── components/       # Client components (dashboard, upload, admin, brand…)
    │   ├── db/               # Drizzle schema + client
    │   └── lib/              # auth, blob, convert (FFmpeg), email, signed-urls
    ├── Dockerfile
    └── entrypoint.sh
```

## Development without Docker

Each piece can run on the host, but you'll need to bring your own Postgres, Garage (or any S3-compatible store), and SMTP. The easiest path is still `docker compose up`.

```bash
# Web (terminal 1)
cd web && npm install
npm run dev

# Apply the schema against your Postgres
DATABASE_URL=postgres://... npm run db:push
```

The web container's `entrypoint.sh` waits for Postgres, runs `drizzle-kit push`, then starts Next.js — so the same flow works in dev with `db:push` ahead of `dev`.

## License

MIT
