# Active Context — READ THIS FIRST when resuming

_Last updated: 2026-08-16 — CRASH RECOVERY: work verified safe; memory-bank backed up to Desktop_

## 💾 2026-08-16: AI crash recovery + backup
- AI session crashed on laptop 2026-08-15 (~midday); user feared a full day's work lost.
- FORENSICS: almost nothing was actually lost. Both repos fully committed by ~10:07 AM 2026-08-15
  (ndv @ e39874d, mindful-luxury-emporium @ 039e1de). Full-disk scans of both repos found NO other
  post-commit work products.
- Sole post-commit artifact: `store/assets/emu-ndv-home.png` (emulator home screenshot, 12:04 PM,
  553 KB) → committed + pushed 2026-08-16. Its existence shows EMULATOR DEVICE-TESTING was in
  flight when the crash hit — that test session's findings are the only true loss. Retest needed.
- Full memory-bank backup at `C:\Users\DC\OneDrive\Desktop\memory-bank-backup-2026-08-16\`
  (Desktop is OneDrive-synced → doubles as a cloud copy).

## 🖼️ 2026-08-16: Watermarked-image hunt (audit follow-up)
- All flagged audit images map to `src/assets\imports\` — Shopify CDN filename == local filename.
  Storefront pulls images from SHOPIFY at runtime → replacements MUST be applied in Shopify admin
  (or re-import); editing local/Lovable files alone does NOT change the live site.
- **DUPLICATE TRAP** (why user "couldn't find the second"): in both 2-watermark products, img2 is a
  byte-identical dupe of img1 under a DIFFERENT hash name (MD5-verified):
  - cashmere-turtleneck: `610667c4f15f.jpg` == `13f63524add5.jpg` (WDDFLOWER logo)
  - seamless-mid-thigh-short: `cb54acc36ddd.jpg` == `252ece6b6516.jpg` (Aishang logo)
- Also flagged: mid-thigh-short img3/4 = `6722da22de4f.jpg` / `6453039dbef1.jpg` ("BELLY IN WAIST" /
  "COMPRESSION SHAPEWEAR" infographics); cashmere img3 = `7612e025c6e8.jpg` (Japanese text overlay).
- bias-cut-midi-skirt images (`skirt-1.jpg`/`skirt-2.jpg`) exist ONLY on Shopify — not in local imports.
- Clean brand-generated replacements already in repo: `src/assets/products/atelier-turtleneck.png`,
  `sh-mid-thigh-short.png` (+ 55 others).
- User replaced one image "in the Lovable file" — replacement NOT yet visible in local repo/GitHub.
- Shopify Admin API creds provided via Desktop\shopifyAPI.txt (client_id + shpss_ client_secret —
  DO NOT commit; repo is PUBLIC). Token exchange FAILED: "app_not_installed" (Dev Dashboard app
  never installed on 6g358e-tz) and neither value works as an X-Shopify-Access-Token (401).
  BLOCKED until user provides a working `shpat_...` Admin token (Settings → Apps → Develop apps →
  create app with read/write_products → Install → reveal token) OR installs the dev-dashboard app.
- Round 2 (Desktop\shopifyAPI1.txt): new shpss_ secret → exchange now fails `invalid_request`
  (was `app_not_installed`). Docs confirm client-credentials grant REQUIRES the app version
  released with scopes AND installed on the store; success token = 32-hex (no prefix), 24h expiry.
  Fastest fix remains: admin → Develop apps → shpat_ token (no 24h expiry, no OAuth dance).
- DECISION (2026-08-16): user chose to DELETE both watermark products outright instead of image
  surgery: `ndv-cashmere-turtleneck` + `ndv-seamless-mid-thigh-short`. Ready to execute via
  productDelete GraphQL mutation the moment Admin API access works — still credential-blocked.
- CREDENTIAL DIAGNOSIS (2026-08-16): file-1 pair (client_id 1895b43f… + shpss_4344…) is VALID —
  fails only with `app_not_installed`. File-2 secret (shpss_9a3e…) = `invalid_request` → belongs to
  a DIFFERENT/dead app; ignore it. ONE STEP LEFT: install the Dev Dashboard app on 6g358e-tz
  (app page → Distribution / "Test on dev store"), with read_products+write_products scopes on the
  released version. Then file-1 creds yield a 24h token and deletions can proceed.

## ⚡ NEW (2026-08-15): Sister project Yu+Mi · A.D.H.D
- Repo C:\dev\mindful-luxury-emporium ← github.com/deano1983/mindful-luxury-emporium (PUBLIC).
  Full NDV-format native wrap applied: Capacitor 8 shell, appId au.com.yumiadhd, signed AAB,
  debug APK, iOS CI green, memory-bank installed there. See ITS memory-bank for details.
- Both repos under deano1983 are now PUBLIC (ndv repo too — safe: Shopify token is public-by-design,
  keystores gitignored in both).

## ✅ NDV catalog image audit (COMPLETE 2026-08-15 — all 82 products / 210 images reviewed)
- scripts/audit-shopify-images.mjs → .audit/img/ (gitignored). Cleanup list for Shopify admin:
- 🚩 REPLACE (wrong product / competitor brand visible):
  seamless-crew-tee (img4 = "SBLUU COSPLAY" cape), seamless-soft-cup-bra ("L'OGIELVE"
  watermark ×4), cocoon-wrap-cardigan (shows an abaya — mismatch), cashmere-turtleneck
  ("WDDFLOWER" ×2), open-bust-bodysuit ("VASLANDA" brand + size charts),
  seamless-mid-thigh-short ("Aishang" ×2), bias-cut-midi-skirt (img1 Cyrillic text).
- ⚠️ STRIP OVERLAYS (AliExpress-style infographics cheapen brand): compression-camisole,
  seamless-mid-thigh-short, seamless-shaping-tank, seamless-slip-dress, modal-boyshort,
  silk-flat-sheet (img3/4), silk-french-knicker (composite grids), and the whole shapewear
  set (long-leg-shaping-short, shaping-*, sculpt-*, strapless-sculpt-bodysuit,
  thigh-slimmer-short, high-waist-sculpt-brief, smoothing-brief).
- ✅ Clean: all silk bedding/robes/PJs, lace + wireless bras, all jewelry, cashmere robe/
  lounge/travel, bamboo line, weighted line, etc.

## ✅ GitHub (done — Phase 2 of SUBMISSION-GUIDE)
- Repo: **https://github.com/deano1983/ndv** (private). Auth via gh CLI (device flow), user `deano1983`
  (NOTE: NOT deanos1983 — first URL user gave was wrong account). gh has `workflow` scope ✅.
- Pushed: full project incl. memory-bank, store/, workflow. origin = correct URL.
- GitHub Pages 422: free plan + private repo → no Pages. Privacy URL options: make repo public
  (safe: Shopify token is public-by-design), or host `store/privacy.html` on Netlify/Vercel free,
  or wait for the real web deploy and use https://domain/privacy.

## iOS CI (.github/workflows/ios-build.yml) — runs:
- #31811020357 FAIL: EBADPLATFORM — win32-only @img/sharp-win32-x64 + @capacitor/assets devDeps
  broke `npm ci` on macOS → uninstalled both, pushed (icons are pre-generated; scripts use System.Drawing).
- #31811154574 FAIL: `App.xcworkspace does not exist` — Capacitor 8 SPM layout has NO workspace
  → fixed workflow to `-project App.xcodeproj` (also fixed in commented signed block).
- #31824957864 **SUCCESS** ✅ (2m1s) — iOS app compiles+archives on macOS; artifact
  `NDV-xcarchive-unsigned` (3.7 MB) stored on the run. CI path PROVEN end-to-end.
- Remaining for App Store: Apple Developer account → either add the 4 signing secrets (see
  workflow header) + uncomment signing block, or use Codemagic auto-signing → TestFlight.

## ✅ BUILT THIS SESSION
- `android\app\build\outputs\apk\debug\app-debug.apk` (4.7 MB) — installable debug build
- `android\app\build\outputs\bundle\release\app-release.aab` (3.3 MB) — **Play-Store-ready**,
  signed with `ndv-upload` key (jarsigner verified)
- VS Code Insiders open on `C:\dev\ndv`; iOS CI workflow at `.github/workflows/ios-build.yml`
- JDK **21** at `C:\Program Files\Microsoft\jdk-21.0.12.8-hotspot` (JAVA_HOME updated) —
  Capacitor 8 needs Java 21; JDK 17 fails with "invalid source release: 21"

## Added after the builds (same session)
- Git repo initialized at C:\dev\ndv (commit 1182880, 663 files). Git for Windows v2.55
  installed to `C:\Program Files\Git`. NOT yet pushed — add GitHub remote to enable the
  iOS CI workflow: `git remote add origin <url> && git push -u origin main`.
- Secrets protected: .gitignore excludes `*.keystore`, `keystore.properties`, `.env`
  (verified not tracked). memory-bank/ IS tracked on purpose.
- Store listings drafted: `store/play-listing.md` + `store/appstore-listing.md`
  (title/subtitle/full copy/keywords/review notes/asset checklists — privacy policy URL
  still a placeholder).
- APK manifest verified healthy: com.ndv.vault v1.0 (code 1), minSdk 24, targetSdk 36,
  INTERNET, label "NDV", launcher activity OK.
- adb present but no device/emulator was attached for an on-device test.

## Store-asset pack added (same session, later)
- `/privacy` route created (`src/routes/privacy.tsx`) — plain-language policy; placeholders to fill:
  [EFFECTIVE DATE], [LEGAL ENTITY NAME], [privacy@your-domain.com]. Usable as the privacy URL
  for BOTH stores once the web app is deployed.
- `scripts/serve-dist.mjs` — dep-free static server for dist/client (SPA fallback). Port arg.
- Real screenshots captured (Edge headless, 1080×1920) in `store/assets/`:
  shot-1-home, shot-2-category, shot-3-product, shot-4-privacy.
- `scripts/generate-store-graphics.ps1` → `store/assets/play-icon-512.png` + `play-feature-1024x500.png`.
- ⚠️ CATALOG DATA ISSUE spotted via screenshots: some Shopify products from the AliExpress import
  have watermarked/wrong supplier images (e.g. "NDV Seamless Crew Tee" shows a cosplay costume with
  a "UU COSPLAY" watermark; another shows "DFLOWER" text). Clean product images in Shopify admin
  before public launch — bad images will hurt store review + brand trust.
## IMAGE AUDIT IN FLIGHT (2026-08-15)
- `scripts/audit-shopify-images.mjs` (NEW) pulled every product image via Storefront API to
  `.audit/manifest.json` (210 imgs / 83 products) + downloaded to `.audit/img/<handle>__<n>.jpg`
  (dir is gitignored). Manual visual pass running.
- WATERMARKS / BAD confirmed so far:
  - ndv-bias-cut-midi-skirt__1 — foreign-text (Cyrillic) overlay, off-brand editorial bg
  - ndv-cashmere-turtleneck__1/__2 — "WDDFLOWER" watermark; __3/__4 Japanese-text flat-lay
  - ndv-compression-camisole__1/__2/__3 — text/infographic callouts (supplier listing art)
  - ndv-contour-slip (all 4), ndv-sculpt-thong-bodysuit (all 4) — generic AliExpress shapewear
- CLEAN so far: back-smoothing-bodysuit, bamboo duvet/sheet/pillowcase-pair/sleep-bra/high-waist-brief,
  bias-cut-midi-skirt__2, boucle-blazer, boucle-body-pillow, brushed-gold-watch, cashmere-bed-socks,
  cashmere-hooded-robe, cashmere-lounge-pant, cashmere-travel-set, ceramic-incense-holder,
  cocoon-wrap-cardigan, contour-midi-skirt.
- TODO: finish remaining handles (contour-thong-bodysuit … worry-bead-necklace), then write cleanup
  plan (replace-from-source vs crop vs re-shoot) into store/SUBMISSION-GUIDE phase 6.

- Final AAB rebuilt with /privacy included (check android\app\build\outputs\bundle\release\).

## Submission guide (user is executing this now)
- **`store/SUBMISSION-GUIDE.md` = the master checklist** (6 phases: key backup → privacy URL →
  GitHub push → Play → Apple → Shopify cleanup). Also added `store/privacy.html` (standalone
  static version, hostable on GitHub Pages as the required privacy URL).
- If the user returns mid-submission: ask which phase they're on and continue FROM THERE.

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

## Web deploy - LIVE
- **Public URL:** https://ndv-luxury.netlify.app (Netlify, deployed 2026-08-15). Privacy page at /privacy (SPA route).
- **Site ID:** b9893937-8874-4cd6-aa54-fd3d6d89f146 | token in .netlify-token (local, gitignored).
- **Custom domain pending:** ndvluxury.com.au / ndvluxury.au - wire in Netlify dashboard (Domain settings) when ready.
- **Build used:** npm run build:app (app-shell; disables mcp plugin + Concierge). Plain npm run build FAILS on Windows (mcp routesDir path bug) - use build:app for web deploys too.
