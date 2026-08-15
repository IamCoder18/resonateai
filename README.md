# Resonate AI

> Send raw recordings or video, get a cleaner MP3 back — usually within 24–48 hours.

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
- **Email**: Nodemailer (your SMTP server — no dev catcher is wired in; bring your own)
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

To deploy a code change after the first launch: `docker compose up --build -d web` rebuilds and restarts just the web container (Postgres and Garage data persist in named volumes).

Then open:

| Service          | URL                                |
|------------------|------------------------------------|
| Resonate AI web  | http://localhost:3000              |
| Garage S3 API    | http://localhost:3900              |
| Postgres         | `localhost:5432` (`resonate` / `resonate` / `resonate`) |

Sign up with any email + password (≥ 8 chars), then upload.

## Supported formats

**Audio (≤ 500 MB each):** MP3, WAV, FLAC, M4A, AAC, OGG, OPUS, AIFF, ALAC, WMA, AMR, AC3, CAF, AU, and more (anything `audio/*`).

**Video (audio is extracted and converted to MP3):** MP4, MOV, MKV, WEBM, AVI, WMV, FLV, 3GP, TS, MTS, M2TS, and more (anything `video/*`).

**Limits:** up to 25 files per batch, ≤ 500 MB per file.

## SMTP

Configure outbound mail via env vars. Any provider that exposes SMTP works:

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
├── docker-compose.yml        # web + garage + garage-init + postgres
├── .env.example
├── capacitor.config.json     # App id, splash, status bar, server scheme
├── android/                  # Capacitor-generated Android project
├── app-release-1.0.0.apk     # Latest signed release APK (for sideloading)
├── garage/
│   ├── garage.toml           # Garage S3 configuration
│   └── init.mjs              # One-shot: create bucket + access key on first boot
├── scripts/                  # mobile-prebuild / mobile-postbuild scripts
└── web/                      # Next.js app (Dockerfile + entrypoint included)
    ├── src/
    │   ├── app/              # App Router pages + API routes
    │   │   ├── api/          # auth, upload, files, admin, health
    │   │   ├── app/          # Mobile UI routes (sign-in, console, queue, account, share…)
    │   │   ├── dashboard/    # Authenticated dashboard
    │   │   ├── sign-in/      # Sign-in page
    │   │   └── sign-up/      # Sign-up page
    │   ├── components/       # Client components (dashboard, upload, mobile, brand…)
    │   ├── db/               # Drizzle schema + client
    │   └── lib/              # auth, api-base, capacitor-runtime, blob, convert, email
    ├── Dockerfile
    └── MOBILE.md             # Full mobile build pipeline + share-extension + test plan
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

## Mobile app (Android, Capacitor)

A native-feel Android shell lives in [`android/`](./android) and ships the
`/app/*` routes of this Next.js app inside a Capacitor WebView. The same
Better Auth + `/api/*` endpoints back the mobile app — there is no mobile
backend.

### Day-to-day development

The mobile UI lives in the same Next.js app as the web app. You can
iterate on it in a regular browser — no Android tooling required:

```bash
# Develop the mobile UI in the browser at http://localhost:3000/app/*
npm run dev
# Visit http://localhost:3000/app/sign-in, /app/console, /app/queue, etc.
```

Capacitor-aware helpers (`isNativePlatform()`, `Haptics`, `Keyboard`, etc.)
gracefully no-op on the web, so anything you build works in both
contexts. API calls should go through `apiUrl()` from `@/lib/api-base` — it
resolves to the deployed backend on both web and native.

### Testing on a real device

Skip the signing/keystore/release-APK stuff for now — the dev loop is
just NPM + Gradle + adb.

For a change that's **mobile UI only** (anything under `web/src/app/app/*`
or `web/src/components/` — nothing in `web/src/app/api/` or anything the
server reads), you do **not** need to rebuild the web Docker container.
The mobile app loads its UI from bundled assets and only talks to the
live API at runtime. So:

```bash
# 0. Plug in your Android device with USB debugging on, then:
adb devices                        # confirm it shows up

# 1. Make your change under web/src/app/app/* or web/src/components/

# 2. Rebuild the mobile bundle (static export of /app/* into web/out)
npm run mobile:build

# 3. Copy the new bundle into the Android project
npx cap copy android

# 4. Build the debug APK
cd android && ./gradlew assembleDebug && cd ..

# 5. Install it on the device (the -r flag reinstalls over the existing
#    app, preserving your signed-in session)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 6. Launch it
adb shell am start -n com.aaravlabs.resonate/.MainActivity
```

That's it. Repeat steps 1–6 for each change. The Gradle build is
incremental — only changed files recompile.

**If you also changed something the server reads** (API routes under
`web/src/app/api/`, `web/src/lib/auth.ts`, CORS middleware, etc.), also
rebuild and restart the web container so the API the app talks to has
your change:

```bash
docker compose up --build -d web
```

To watch the WebView's `console.log` / network / DOM while you click
around, attach Chrome DevTools:

```bash
adb shell cat /proc/net/unix | grep webview_devtools_remote
# Note the <pid> suffix, then:
adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>
# Open http://localhost:9222 in a browser, or chrome://inspect/#devices

# Useful one-liners while developing:
adb -s <device> logcat -d | grep -iE "chromium|capacitor"   # app logs
adb -s <device> exec-out screencap -p > screen.png          # screenshot
```

When you're ready to ship a release APK to a tester, the signed
`mobile:package` script is documented in [`web/MOBILE.md`](./web/MOBILE.md)
— ignore it until you need it.

### How it fits together

- `web/src/app/app/*` — every mobile UI route (`sign-in`, `sign-up`,
  `console`, `queue`, `account`, `share`, `intro`). Wrap content in
  `<MobileScaffold>` from `web/src/app/app/layout.tsx`.
- `web/src/lib/api-base.ts` — `apiUrl()` resolves the backend origin in
  both browser and native contexts.
- `web/src/lib/capacitor-runtime.ts` — `isNativePlatform()` /
  `getCapacitorServerUrl()` / `getRuntimePlatform()`.
- `scripts/mobile-prebuild.js` — stubs the marketing-site root and moves
  `api/` + `dashboard/` out of the build so the static export contains
  only `app/*`. `scripts/mobile-postbuild.js` restores them.
- `next.config.js` — switch on `BUILD_TARGET=mobile` to enable static
  export (`output: "export"`) and the mobile build's image config.
- `capacitor.config.json` — bundle id, splash, status bar, scheme
  (`https://localhost`), plugins (`SplashScreen`, `StatusBar`, `Haptics`).
- `android/` — generated Capacitor project. Web assets land in
  `app/src/main/assets/public/` via `cap copy`.

### Cross-origin auth (Capacitor WebView → deployed API)

The WebView origin is `https://localhost` (set by Capacitor's
`androidScheme`), while the API lives at `resonate.aaravlabs.com`. To
make Better Auth work cross-site:

- `web/src/middleware.ts` adds `Access-Control-Allow-Origin` /
  `Access-Control-Allow-Credentials` for `https://localhost`,
  `http://localhost`, and `capacitor://localhost` on every `/api/*`
  request, and short-circuits `OPTIONS` preflights.
- `web/src/lib/auth.ts` sets `advanced.defaultCookieAttributes` to
  `sameSite: "none"` + `secure: true` so the session cookie travels on
  cross-site fetches from the WebView.

These changes are harmless on the web (same-origin), but required for
the mobile app to sign in and stay signed in.

### Sideload install for testers

See [`web/MOBILE.md`](./web/MOBILE.md) for sideload instructions, the
share-extension manifest, and the on-device test plan. Push
notifications, Play Store listing, and the iOS build are explicitly
deferred — see the v1 plan in [`.kilo/plans/`](./.kilo/plans/).
