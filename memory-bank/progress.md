# Progress

## Web app (from Lovable session, Aug 7)
- [x] All routes, components (Header/Footer/ProductCard/ProductGrid/CartDrawer/SizeGuide/Concierge)
- [x] Shopify Storefront wired (live store), cart store, ~100 generated brand/product images
- [x] Supabase auth integration, MCP server endpoints, admin AliExpress import tooling

## Environment rescue (Aug 13–14)
- [x] npm install (Aug 13) — dev server failed (OneDrive placeholder bug, root-caused Aug 14)
- [x] Working copy at C:\dev\ndv; JDK 17, Android Studio, VS Code Insiders, env vars

## Native wrap (Aug 14)
- [x] SPA build pipeline (`npm run build:app`) verified
- [x] Capacitor config + android + ios platforms added
- [x] Icons/splash generated (placeholders) into both platforms
- [x] Upload keystore + Gradle signing config
- [x] Android SDK: cmdline-tools, platform-tools, platform-36
- [x] Android SDK: build-tools 36.0.0 (manual zip: repository `build-tools_r36_windows.zip` — note underscore!)
- [x] android/local.properties (sdk.dir)
- [x] Debug APK smoke build — `app-debug.apk` (4.7 MB) ✅
- [x] Release AAB — `app-release.aab` (3.3 MB), signed + jarsigner-verified ✅
- [x] Memory bank installed (this folder + .clinerules + copilot-instructions + AGENTS.md + global Cline rule)
- [x] iOS CI workflow (.github/workflows/ios-build.yml) for no-Mac builds
- [x] Git repo init'd + first commit (secrets gitignored & verified absent)
- [x] Store listings drafted (store/play-listing.md, store/appstore-listing.md)
- [x] APK manifest sanity-checked (aapt badging)
- [x] Privacy policy route (/privacy) + included in app build
- [x] Real screenshots (home/category/product/privacy) in store/assets/
- [x] Play feature graphic 1024×500 + hi-res icon 512 (store/assets/)
- [x] Final AAB rebuilt with /privacy (BUILD SUCCESSFUL, 3.3 MB)
- [x] Push to GitHub — https://github.com/deano1983/ndv (private), gh CLI authed (workflow scope)
- [x] iOS CI build GREEN — unsigned .xcarchive artifact produced on macOS runner
- [x] On-device test — DONE 2026-08-22 via headless emulator (Pixel 7 API 36): launch, render,
      scroll, product tap, back-nav, background+resume all pass; no crashes; evidence
      store/assets/emu-test-*.png + scripts/emu-test-flow.ps1
- [x] Fill privacy placeholders — DONE 2026-08-22: entity "Nouveau Dames Vault (NDV)",
      privacy@ndvluxury.com.au, effective 22 August 2026 (privacy.tsx + store/privacy.html);
      AAB/APK rebuilt + web redeployed so live /privacy reflects it
- [x] Web app LIVE — https://ndv-luxury.netlify.app (2026-08-15); privacy URL live for store forms
- [x] Yu+Mi sibling app (mindful-luxury-emporium repo) — full NDV-format wrap: signed AAB,
      debug APK, iOS CI green, web live at yumi-adhd-sanctuary.netlify.app, store listings drafted
- [x] Web BLANK-PAGE BUG FIXED (2026-08-16) — backslash zip paths broke assets; redeployed
      via Netlify API with fwd-slash zip (deploy 6a8178f9…); ndv-luxury + ndvluxury.com.au live ✅
- [x] Shopify image audit COMPLETE (2026-08-15) — 82 products/210 images reviewed;
      7 products need replacement images, ~15 need overlay stripping (see activeContext)
- [x] Clean AliExpress-import product images — WORST 2 DELETED 2026-08-22 (cashmere-turtleneck,
      seamless-mid-thigh-short; verified gone, catalog 80 products). Remaining REPLACE/STRIP
      items from audit are polish-only, not launch blockers.
- [~] Test on emulator/real device — ✅ COMPLETE 2026-08-22 (see top of file)
- [ ] iOS archive (REQUIRES macOS — CI or a Mac)
- [ ] Finalize appId — ✅ RESOLVED: actual appId is `au.com.ndvluxury` (confirmed via aapt 2026-08-22; old "com.ndv.vault placeholder" notes were stale)
- [ ] Store accounts: Google Play ($25), Apple Developer ($99) — USER ACTIONS, the only true blockers left
- [ ] Replace placeholder icons/splash with final artwork (user art needed)
- [ ] Optional v1.1: Supabase OAuth deep links, push notifications, Concierge via hosted API URL
