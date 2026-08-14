# Resonate AI — Mobile app (Android, Capacitor)

The mobile app is a thin native shell that loads a static export of the
web app's `/app/*` routes inside a Capacitor WebView. There is no mobile
backend — every API call hits the same `resonate.aaravlabs.com` instance
the marketing site uses, with absolute URLs resolved at runtime.

```
android/                  Capacitor-generated native project (committed)
capacitor.config.json     App id, splash, status-bar, server scheme
web/src/app/app/*         Mobile UI (sign-in, sign-up, console, queue, account, share)
web/src/components/       Mobile components (MobileScaffold, BottomTabs, …)
web/src/lib/api-base.ts   Resolves the API base URL in both web and native contexts
web/src/lib/capacitor-runtime.ts   isNativePlatform / getCapacitorServerUrl
```

## Build the mobile bundle

```bash
# 1. Static export of the /app/* routes into web/out
npm run mobile:build

# 2. Sync the static bundle + plugins into the native project
npm run mobile:sync

# 3. Build a signed APK
#    Set RESONATE_KEYSTORE_FILE / RESONATE_KEYSTORE_PASSWORD /
#    RESONATE_KEY_ALIAS / RESONATE_KEY_PASSWORD in ~/.gradle/gradle.properties
#    (or pass them via -P flags to gradle)
npm run mobile:package
# Output: android/app/build/outputs/apk/release/app-release.apk
```

`mobile:package` runs `mobile:build → mobile:sync → gradle assembleRelease`.

For an unsigned debug build that you can sideload immediately:

```bash
npm run mobile:assemble
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

## Add a new mobile-only route

1. Create a `page.tsx` under `web/src/app/app/<route>/`.
2. Wrap any chrome in `<MobileScaffold>` (already provided by
   `web/src/app/app/layout.tsx`).
3. Use `apiUrl('/api/...')` from `@/lib/api-base` for fetch calls —
   never raw `/api/...`, which resolves to the WebView's `https://localhost`
   origin and would 404.
4. Run `npm run mobile:build` to verify it exports.
5. Open the route in a regular browser dev session at
   `http://localhost:3000/app/<route>` — Capacitor helpers (`isNativePlatform()`,
   haptics) gracefully no-op in the browser, so you can develop the mobile
   UI without the native shell.

## Share extension (Android)

The native Android manifest registers an `ACTION_SEND` / `ACTION_SEND_MULTIPLE`
intent filter for `audio/*` and `video/*`. When the user picks
"Resonate AI" from another app's share sheet, Android launches the app
and the WebView receives the shared file via `Capacitor.Plugins.App.addListener('appUrlOpen', …)`.
The receiver UI lives at `/app/share` and renders the shared file in
the upload card.

> v1's deep-link bridge expects the WebView to be foregrounded. Files
> shared while the app is cold-launched open `/app/share` automatically.

## Add iOS later (one-liner checklist)

iOS requires a Mac with Xcode 15+ and an Apple Developer account
($99/yr). To add iOS in v2:

```bash
npx cap add ios
# Configure ios/App/App/Info.plist share extension (NSExtensionPrincipalClass =
# ShareViewController) — see Capacitor docs.
# Bundle a 1024×1024 PNG and run npx capacitor-assets generate --ios.
```

The web bundle, `capacitor.config.json`, and the `/app/*` routes are
already iOS-ready (no Android-only assumptions). The same `apiUrl()`
helper transparently resolves to the deployed backend on iOS too.

## Bump `versionCode` / `versionName`

Edit `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2      // bump for every Play/internal release
    versionName "1.0.1"
}
```

Also update the strings in `android/app/src/main/res/values/strings.xml`
if you rename the app.

## Sideload install instructions (for testers)

1. Receive the APK file (currently distributed out-of-band, not via Play).
2. On the Android device: Settings → Apps → Special access → **Install
   unknown apps** → allow installs from your file manager / browser.
3. Tap the APK to install.
4. Open "Resonate AI", sign up or sign in, and verify:
   - Upload a file from the gallery / file manager
   - Share an audio file from another app and confirm it lands in
     the upload card
   - Sign out, kill the app, reopen — session should persist

## On-device test plan (manual)

- [ ] Sign up
- [ ] Sign out, sign back in
- [ ] Upload audio from file picker
- [ ] Upload video from file picker
- [ ] Share audio from another app → confirm appears in `/app/share`
- [ ] Kill the app, reopen — still signed in
- [ ] Sign out → returns to `/app/sign-in`
- [ ] Trigger sign-out from the web app, reopen the mobile app — also signed out
- [ ] Tab navigation feels native (haptics fire, status bar matches theme)

## Doctor

```bash
npm run mobile:doctor
```

Runs `npx cap doctor android` and reports any missing native tooling
(Android SDK, Java, etc.) on the dev machine.
