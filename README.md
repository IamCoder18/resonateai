# Resonate AI

> Studio-quality audio cleaning, on demand. Upload raw recordings and get them back polished within 24-48 hours.

Resonate AI is a complete SaaS application built around a simple workflow:

1. **Sign up** with email + password (powered by [Better Auth](https://www.better-auth.com/))
2. **Upload** raw audio files (MP3, WAV, FLAC, M4A, AAC, OGG — up to 100 MB)
3. **We email you** the cleaned, mastered file within 24-48 hours

Behind the scenes, every upload is persisted to Postgres, stored in the bundled **Fast Blob Storage** server (S3-compatible), and a notification email is sent to the operator's configured inbox via SMTP.

## Architecture

```
┌─────────┐    ┌─────────────────┐    ┌──────────────────┐
│  user   │───▶│  Next.js (web)  │───▶│ Fast Blob Storage │
└─────────┘    │   :3000         │    │     :8080         │
               └────┬──────┬─────┘    └──────────────────┘
                    │      │
                    ▼      ▼
              ┌────────┐ ┌────────┐
              │ Postgres│ │  SMTP  │
              │  :5432 │ │ (Mailpit│
              └────────┘ │  :1025)│
                        └────────┘
```

## Stack

- **Frontend & API**: [Next.js 15](https://nextjs.org) (App Router, React 19, TypeScript)
- **Auth**: [Better Auth](https://www.better-auth.com/) — email & password
- **Database**: PostgreSQL 16 (via [Drizzle ORM](https://orm.drizzle.team/))
- **Storage**: Custom **Fast Blob Storage** (Fastify + S3-compatible API)
- **Email**: Nodemailer (SMTP — Mailpit in dev, your SMTP server in prod)
- **Styling**: Tailwind CSS with a custom modern dark theme
- **Container**: Docker Compose

## Quick start (Docker)

```bash
# 1. Copy environment template and set a real secret
cp .env.example .env
# Edit .env — at minimum set BETTER_AUTH_SECRET to a long random string
# Generate one with:  openssl rand -base64 48

# 2. Build & launch everything
docker compose up --build
```

Then open:

| Service          | URL                                |
|------------------|------------------------------------|
| Resonate AI web  | http://localhost:3000              |
| Mailpit inbox    | http://localhost:8025              |
| Blob storage API | http://localhost:8080/health       |
| Postgres         | `localhost:5432` (`resonate` / `resonate` / `resonate`) |

Sign up with any email + password (≥ 8 chars), then upload an audio file.

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
```

`NOTIFY_EMAIL` is the operator address that receives the upload notification (filename, size, uploader, blob reference).

## API surface

| Method | Path                                  | Description                          |
|--------|---------------------------------------|--------------------------------------|
| POST   | `/api/auth/sign-up/email`             | Better Auth email/password sign-up   |
| POST   | `/api/auth/sign-in/email`             | Better Auth email/password sign-in   |
| POST   | `/api/upload`                         | Upload an audio file (multipart)     |
| GET    | `/api/files`                          | List the signed-in user's uploads    |
| GET    | `/health` (blob)                      | Blob storage health                  |
| PUT    | `/buckets/:bucket/objects/*`          | Store an object                      |
| GET    | `/buckets/:bucket/objects/*`          | Retrieve an object                   |

## Project layout

```
resonateai/
├── docker-compose.yml        # web + blob-storage + postgres + mailpit
├── .env.example
├── web/                      # Next.js app (Dockerfile included)
│   ├── src/
│   │   ├── app/              # App Router pages + API routes
│   │   ├── components/       # Client components
│   │   ├── db/               # Drizzle schema
│   │   └── lib/              # auth, blob, email, session, utils
│   └── Dockerfile
└── blob-storage/             # Fast Blob Storage server (Fastify)
    ├── src/
    │   ├── server.js
    │   └── blob-storage.js
    └── Dockerfile
```

## Development without Docker

Each piece runs independently:

```bash
# Web (terminal 1)
cd web && npm install
DATABASE_URL=postgres://resonate:resonate@localhost:5432/resonate \
BLOB_STORAGE_ENDPOINT=http://localhost:8080 \
npm run dev

# Blob storage (terminal 2)
cd blob-storage && npm install && npm run dev
```

## License

MIT