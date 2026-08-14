# Active Context — READ THIS FIRST when resuming

_Last updated: 2026-08-14 ~22:20 (session: resume + native wrap) — ANDROID BUILD COMPLETE_

## ✅ BUILT THIS SESSION
- `android\app\build\outputs\apk\debug\app-debug.apk` (4.7 MB) — installable debug build
- `android\app\build\outputs\bundle\release\app-release.aab` (3.3 MB) — **Play-Store-ready**,
  signed with `ndv-upload` key (jarsigner verified)
- VS Code Insiders open on `C:\dev\ndv`; iOS CI workflow at `.github/workflows/ios-build.yml`
- JDK **21** at `C:\Program Files\Microsoft\jdk-21.0.12.8-hotspot` (JAVA_HOME updated) —
  Capacitor 8 needs Java 21; JDK 17 fails with "invalid source release: 21"

## NEXT (in priority order)
1. Test the app: install `app-debug.apk` on a device/emulator (`adb install`) OR just upload
   the AAB to Play Console internal testing.
2. Google Play Console: create app (id `com.ndv.vault` — confirm before first upload!),
   upload AAB, fill listing (copy below), screenshots, privacy policy → submit.
3. iOS: push repo to GitHub → run Actions → "iOS build" (`.github/workflows/ios-build.yml`),
   or open `ios/App/App.xcworkspace` on any Mac. Signing needs Apple Developer account ($99/yr).
4. Replace placeholder icons (`scripts/generate-native-assets.ps1` output) with final art.
5. Optional: Supabase OAuth deep links, push notifications, hosted Concierge API.

## Rebuild commands
```
cd C:\dev\ndv
npm run app:sync            # web SPA -> both native shells
cd android && gradlew.bat bundleRelease   # signed AAB (JAVA_HOME must be JDK 21)
```

## Where things stand RIGHT NOW
The Capacitor 8 native wrapper is set up; we are mid-way through building the Android release.

### Done this session
- Rescued project off OneDrive → `C:\dev\ndv` (root cause of dev-server failure: OneDrive
  placeholder files can't load native .node binaries → rolldown fell back to WASI → UNRESOLVED_ENTRY).
- Renamed OneDrive folder (apostrophe removed): `Nouveau Dames Vault1`.
- Installed: VS Code Insiders (was already present), Microsoft OpenJDK 17, Android Studio.
  User env vars set: `JAVA_HOME`, `ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk`.
- SPA/app build pipeline: `vite.config.app.ts` (SPA mode, nitro off) + `.env.appshell` (VITE_APP_SHELL=true)
  + Concierge hidden in app builds (`src/routes/__root.tsx`) + `scripts/prepare-app-shell.mjs`
  (copies `dist/client/_shell.html` → `index.html`). `npm run build:app` WORKS (verified).
- `capacitor.config.ts`: appId `com.ndv.vault` (placeholder — must finalize before store upload),
  appName `NDV`, webDir `dist/client`, androidScheme https.
- Platforms added: `android/` and `ios/` (Capacitor 8 → iOS uses Swift Package Manager, no CocoaPods).
- Brand icons/splash generated into both platforms via `scripts/generate-icons.ps1` +
  `scripts/generate-native-assets.ps1` (PLACEHOLDER art — noir bg + champagne NDV monogram).
- Release signing: `android/app/ndv-upload.keystore` (alias `ndv-upload`) + root `keystore.properties`
  + signing config wired into `android/app/build.gradle`. **BACK UP THESE TWO FILES — losing them
  means losing Play Store update rights.**
- Android SDK (headless at `%LOCALAPPDATA%\Android\Sdk`): cmdline-tools, platform-tools,
  `platforms;android-36` (installed manually — sdkmanager's unzipper kept failing).

### IN FLIGHT (was happening when session ended)
- **First Gradle build running**: `cd C:\dev\ndv\android && gradlew.bat assembleDebug --no-daemon`
  (log: `C:\dev\gradle-debug.log`). First run downloads Gradle 8.14.3 + AGP 8.13 deps — slow.
- build-tools 36.0.0 installed manually ✅ (`aapt2.exe` verified). sdkmanager stayed broken —
  manual zips from dl.google.com work (build-tools zip uses UNDERSCORE: `build-tools_r36_windows.zip`).

### Immediate next steps
1. Verify assembleDebug success → APK at `android\app\build\outputs\apk\debug\app-debug.apk`.
2. Release: `gradlew.bat bundleRelease` → AAB in `android\app\build\outputs\bundle\release\`.
5. `npm run app:sync` = rebuild web + copy into both platforms.
6. Open in VS Code Insiders: `code-insiders C:\dev\ndv` (binary:
   `C:\Users\DC\AppData\Local\Programs\Microsoft VS Code Insiders\bin\code-insiders.cmd`).
7. iOS: no macOS here — Xcode project is ready at `ios/`; build via Mac or CI (GitHub Actions
   `macos` runner / Codemagic / Xcode Cloud) + Apple Developer account ($99/yr).
8. Store prep: finalize appId `com.ndv.vault`, privacy policy URL, store listing copy,
   replace placeholder icons, Google Play dev account ($25). Screenshots needed for both stores.

### Watch-outs
- Do NOT run npm/vite/gradle inside the OneDrive copy — placeholders break native binaries.
- `npm run dev` = full-stack web (SSR). `npm run build:app` = static SPA for Capacitor.
- Concierge chat + MCP + admin imports are server-only → hidden/absent in app builds by design.
- Shopify calls are client-side → work inside the WebView. Supabase OAuth deep links NOT wired yet.
