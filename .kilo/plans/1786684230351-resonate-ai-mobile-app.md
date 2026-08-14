# Resonate AI — Capacitor Mobile App (Android first, iOS-ready)

## Goal

Ship a native-feel Android app for Resonate AI that is **not** a website wrapper. Installable via sideload AAB/APK, built with Capacitor so an iOS App Store build is a drop-in later. Push notifications are explicitly out of scope for v1.

## Decisions (already locked in)

- **Framework:** Capacitor 6+ wrapping the existing Next.js 15 web app
- **Mobile web routes:** new `web/src/app/app/*` namespace served as the Capacitor WebView root; existing `/`, `/dashboard`, `/sign-in`, `/sign-up` remain untouched
- **Auth:** Better Auth (existing). Add `capacitor://localhost` and `http://localhost` to `trustedOrigins`
- **v1 features:** native file picker, haptics, splash + status bar theming, Android share extension (audio/video `ACTION_SEND`), bottom tab nav, in-app polling for "ready" status
- **v1 NO:** push notifications, iOS build, Play Store upload
- **Distribution:** signed APK/AAB delivered directly (user hosts on resonate.aaravlabs.com or a download link); Play Store deferred
- **App ID:** `ai.aaravlabs.resonate`
- **App name:** "Resonate AI"

## Affected boundaries

- `web/` — new routes, components, Capacitor dependency, configuration
- `web/src/app/` — add `app/` subdirectory with `layout.tsx`, `page.tsx`, `[tab]/page.tsx`
- `web/src/components/` — new mobile components (BottomTabs, MobileUploadCard, etc.)
- `web/src/lib/auth.ts` — extend `trustedOrigins`
- `web/.gitignore` — add Capacitor + Android build outputs
- Android project: new `android/` directory at repo root (Capacitor default)
- New `capacitor.config.ts` at repo root
- `docker-compose.yml` — no changes (web container still serves the API; the APK is distributed separately)

## Architecture

```
┌──────────────────────────────┐
│  Android device              │
│  ┌────────────────────────┐  │
│  │ Resonate AI.apk        │  │
│  │  ┌──────────────────┐  │  │
│  │  │ Capacitor        │  │  │
│  │  │  ┌────────────┐  │  │  │
│  │  │  │ /app/*     │  │  │  │
│  │  │  │ Next.js UI │──┼──┼──┼──▶ resonate.aaravlabs.com (existing)
│  │  │  └────────────┘  │  │  │       (Better Auth + /api/* + blob)
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

The APK is a static, signed build of the Next.js `app/` subtree. Communication is plain HTTPS to the existing API. No new backend services in v1.

## Implementation tasks

### 1. Project scaffold (Capacitor + Next.js integration)

1. `npm install --save @capacitor/core @capacitor/cli @capacitor/android @capacitor/preferences @capacitor/haptics @capacitor/share @capacitor/status-bar @capacitor/splash-screen @capacitor/filesystem @capacitor/app @capacitor/network` in `web/`
2. Create `capacitor.config.ts` at repo root:
   - `appId: 'ai.aaravlabs.resonate'`
   - `appName: 'Resonate AI'`
   - `webDir: 'web/out'` (we'll switch Next.js to `output: 'export'` for the mobile bundle, or build a static export of just `app/*`)
   - `server: { androidScheme: 'https' }` so fetch / cookies behave like normal HTTPS
   - `plugins: { SplashScreen: { launchShowDuration: 800, backgroundColor: '#0a0a0f' }, StatusBar: { style: 'DARK', backgroundColor: '#0a0a0f' } }`
3. `web/next.config.js`: add `output: 'export'` only for the mobile build (or use a separate `next.config.mobile.js` invoked by `BUILD_TARGET=mobile npm run build` so the existing dashboard stays SSR). The mobile export is static — the mobile routes can be statically rendered because they fetch data client-side from the existing API.
4. Add scripts to root `package.json`:
   - `mobile:build` → `BUILD_TARGET=mobile npm --prefix web run build` producing `web/out`
   - `mobile:sync` → `npx cap sync android`
   - `mobile:open` → `npx cap open android`
   - `mobile:assemble` → gradle assembleDebug (or release) wrapper
5. `npx cap add android` — creates the native Android project (committed partially; `.gradle/`, `build/`, local.properties stay gitignored)

### 2. Backend / auth changes (minimal)

1. `web/src/lib/auth.ts`: add `'capacitor://localhost'` and `'http://localhost'` to `trustedOrigins` so the WebView origin is accepted
2. `web/src/lib/auth-client.ts`: read base URL from `Capacitor.config.server.hostname` or fall back to `process.env.BETTER_AUTH_URL` so the app talks to the real server (not `localhost`)
3. `web/src/app/app/`: every data fetch goes to relative URLs (`/api/...`) — these resolve to the deployed server via the Capacitor scheme/host config
4. No new DB tables in v1
5. The existing `POST /api/files/[id]/sign` already returns a signed download URL. The mobile app reuses it; downloads can open via `Capacitor.Plugins.Browser.open()` (in-app browser) or `<a href download>` (native download manager)

### 3. Mobile routes (`web/src/app/app/*`)

Route structure:

```
/app                    → redirect to /app/console (or /app/sign-in if unauthenticated)
/app/sign-in            → minimal email/password form (reuses SignInForm primitives, no marketing copy)
/app/sign-up            → minimal email/password/name form
/app/console            → upload card + recent upload status (default tab)
/app/queue              → full queue list with pull-to-refresh
/app/account            → user info, sign out, app version, link to website
/app/share              → deep-link landing for ACTION_SEND; presents the file in the upload UI
```

All routes share `app/app/layout.tsx` which renders:
- `<MobileScaffold>` with bottom tab bar (Console / Queue / Account)
- Safe-area padding for notches / gesture bars (CSS `env(safe-area-inset-*)`)
- Hidden when route is `/sign-in` or `/sign-up` (no tabs on auth)
- `<StatusBarOverlay>` that calls `Capacitor.Plugins.StatusBar.setStyle({style:'DARK'})` on mount

### 4. Mobile-specific components

- `mobile-scaffold.tsx` — wraps page with header (compact logo + optional sign-out), tab bar, content area
- `bottom-tabs.tsx` — three-tab nav with haptic feedback on tap (`Haptics.impact({ style: 'LIGHT' })`)
- `mobile-upload-card.tsx` — large drop zone; tap opens native action sheet (Camera / Audio Library / Files / Video Library) via mock for now (we will use web `<input>` + `accept` + `capture` and let the OS picker handle it). On Android this opens the native file picker for free
- `mobile-queue-list.tsx` — list view reusing `FileList`/`StatusBadge` style, with pull-to-refresh polling `/api/files` every 30s while there are `processing` files
- `share-intent-receiver.ts` — client component that reads `window.location.hash` for `?file=...` (deep-link) and pipes the shared file into the upload queue. Mounted only on `/app/share`
- `account-screen.tsx` — shows user email/name, app version (`Capacitor.Plugins.App.getInfo()`), link to resonate.aaravlabs.com, sign out
- `sign-in-form-mobile.tsx`, `sign-up-form-mobile.tsx` — same as web forms but with mobile-friendly inputs (large tap targets, `inputMode="email"`, `autoComplete="email"`, native form submit)

### 5. Native Android config (one-time)

1. `android/app/src/main/AndroidManifest.xml`:
   - Add intent filter on `MainActivity` for `ACTION_SEND` and `ACTION_SEND_MULTIPLE` with mime types `audio/*` and `video/*`
   - Add `<meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="resonate_default"/>` (no FCM init yet — this is prep)
   - Set `android:exported="true"` on MainActivity (required for Android 12+)
2. `android/app/src/main/res/values/colors.xml` — add `colorPrimary` matching brand accent (#FFA15A)
3. `android/app/src/main/res/values/strings.xml` — `app_name = "Resonate AI"`
4. `android/app/src/main/res/drawable/` — splash background = brand canvas color; app icon: stylized waveform mark over dark canvas (use `npx capacitor-assets generate --android` after dropping a 1024x1024 icon)
5. `android/app/build.gradle` — bump `minSdkVersion` to 24 (Android 7+), `targetSdkVersion` to 34, `versionCode` 1, `versionName` "1.0.0"
6. `android/app/proguard-rules.pro` — keep rules for `@capacitor/*` packages (defaults are fine; Capacitor ships them)
7. Generate release keystore: `keytool -genkey -v -keystore resonate-release.keystore -alias resonate -keyalg RSA -keysize 2048 -validity 10000`. Store `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` in repo secrets / `~/.gradle/gradle.properties`. **Never commit the keystore**
8. `android/app/build.gradle` — add `signingConfigs.release` block using gradle properties; `buildTypes.release.signingConfig signingConfigs.release`

### 6. Build verification & sideload distribution

1. Implement a `mobile:package` script that runs `mobile:build → mobile:sync → cd android && ./gradlew assembleRelease` and outputs `android/app/build/outputs/apk/release/app-release.apk`
2. Host the APK on resonate.aaravlabs.com (or a dedicated `/download` page) with a link + visible "Install from unknown sources allowed" instructions
3. Document the manual install path in `README.md` mobile section (sideload is standard for Android)

### 7. iOS preparation (no build)

1. `capacitor.config.ts`: add `--web-dir=out` and document `npx cap add ios` as the next step
2. Note in `README.md`: iOS requires a Mac with Xcode 15+ and Apple Developer account ($99/yr). Capacitor's `ios` platform is technically addable now and would create `ios/` with the same share extension configuration, but we **do not** run `cap add ios` in v1 to avoid half-configured iOS artifacts
3. Stub `ShareViewController` instructions in `MOBILE.md` for the future iOS handoff

### 8. Testing (limited environment)

The dev environment here has no Android SDK / Xcode, so we test what we can:

1. **`npm run lint`** — strict TypeScript + ESLint on the new routes
2. **`npm run build`** — confirm `web/out` builds successfully for mobile target
3. **`mobile:smoke`** — Node script that:
   - Boots `next dev` against `/app/*` routes
   - Uses `playwright` (or `curl` + DOM checks) to load `/app/sign-in`, `/app/console`, `/app/queue` paths and assert the bottom tab bar, safe-area CSS, and that `Capacitor.isNativePlatform()` polyfill correctly returns `false` in browser dev
4. **`mobile:unit`** — Jest tests for:
   - `share-intent-receiver.ts` parsing logic
   - `mobile-queue-list.tsx` rendering given fixture records
   - `formatBytes` / `formatDate` (already exist; add tests for negative/edge cases)
5. Document the **on-device test plan** in `MOBILE.md`:
   - Install APK on a real Android device
   - Verify: sign up, sign in, upload from gallery, upload from file manager, share from another app into Resonate, sign out, kill + reopen app preserves session
   - Verify: iOS doesn't ship in v1 — note would-be test steps for future
6. Add a `mobile:doctor` script that runs `npx cap doctor` to flag any missing native tooling on the dev machine

### 9. Documentation

Add `web/MOBILE.md` covering:
- How to build the mobile bundle
- How to add a new mobile-only route
- How the share extension manifests in different Android apps
- How to add iOS later (one-liner checklist)
- How to bump `versionCode` for new releases
- Sideload install instructions for testers

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Next.js static export drops server-side features (auth headers, edge runtime) | All `/app/*` routes are client-rendered; rely on Better Auth cookies + `/api/*` calls. Test auth round-trip from WebView to server. |
| Capacitor WebView sees cookies as third-party | Use `server.androidScheme: 'https'` and configure cookie domain to apex (resonate.aaravlabs.com). Test login persistence across app restarts. |
| Share intent delivers huge files that time out server-side | Pre-flight: client checks size against 500 MB cap before upload, warns user. Server already enforces it. |
| Release signing key lost | Store keystore in 1Password / Bitwarden + write down SHA-256 fingerprint. Backup at two physical locations. |
| Static export of `app/` accidentally ships marketing landing page | Use `next.config.mobile.js` with `output: 'export'` + restricted page set; OR use Next.js `unstable_onlyMiddleware` to redirect `/` to `/app`. Pick: redirect to `/app` in the bundled landing. |
| Capacitor version drift with iOS SDK | Pin Capacitor to a known-good version (6.x as of 2026); document upgrade procedure. |
| No FCM in v1 | Defer explicitly; add a TODO in `lib/email.ts` near `sendFinishedNotification` with a comment block outlining the future work. |

## Validation plan

Acceptance criteria for v1:

1. `npm run lint` passes
2. `npm run build` (default target) still passes — existing web app continues working
3. `npm run mobile:build` produces `web/out` with `app/` HTML
4. `npm run mobile:package` produces a signed APK
5. APK installs on a real Android device (sideload)
6. User can: sign up, sign in, upload a file from gallery, upload via share intent from another app, see the file in queue, sign out, reopen app and stay signed in
7. White-label polish: app icon, splash, status bar all match brand; haptics on tab tap; safe-area padding correct on devices with notches
8. iOS not built in v1, but `capacitor.config.ts` is iOS-ready (no Android-only assumptions)

## Out of scope (documented explicitly)

- Push notifications (FCM/APNs) — add in v2
- Play Store listing — direct APK distribution only
- iOS App Store build — config is iOS-ready but no `ios/` directory created
- Biometric unlock — defer
- Offline upload queue with auto-retry — defer
- In-app purchases / subscriptions — N/A (paid via web)
- Background upload (app killed mid-upload) — defer
- Widget / Quick Tile — defer

## Open questions left to the implementation agent

- Should the upload card default to "audio only" or "audio + video" first-launch? Recommend audio-only primary, video as secondary action (matches the "cleaned audio" product framing).
- App icon design: text + wave mark, or pure wave mark? Recommend pure wave mark on dark canvas (matches existing `BrandMark`).
- Should we add a one-time "Welcome to the app" onboarding (3 screens) the first time the user opens it? Recommend defer (KISS).
