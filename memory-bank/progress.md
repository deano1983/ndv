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
- [ ] Push to GitHub (needs user's repo URL/auth) → unlocks iOS CI
- [ ] On-device test (needs a phone plugged in or an emulator)
- [ ] Test on emulator/real device (needs platform-tools adb + a device/emulator image)
- [ ] iOS archive (REQUIRES macOS — CI or a Mac)
- [ ] Store accounts: Google Play ($25), Apple Developer ($99)
- [ ] Finalize appId (com.ndv.vault placeholder), privacy policy URL, listing copy + screenshots
- [ ] Replace placeholder icons/splash with final artwork
- [ ] Optional v1.1: Supabase OAuth deep links, push notifications, Concierge via hosted API URL
