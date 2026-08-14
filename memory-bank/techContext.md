# Tech Context

## Stack
- TanStack Start 1.168 + Router 1.170 + Query 5 (file-based routes in `src/routes`)
- Tailwind v4 + shadcn/ui (`src/components/ui`), zustand cart (`src/stores/cartStore.ts`)
- Shopify Storefront API 2025-07 — store `6g358e-tz.myshopify.com`, public token in `src/lib/shopify.ts`
- Supabase auth (`src/integrations/supabase`), AI Concierge via `/api/chat` (ai SDK),
  MCP endpoints (`src/lib/mcp`), AliExpress admin tooling (`admin.dsers`/`admin.imports`)

## Native shell
- Capacitor 8.5, appId `com.ndv.vault` (PLACEHOLDER — finalize before first store upload)
- `vite.config.app.ts` → SPA build (`spa.enabled`, nitro off) → `dist/client`
- `_shell.html` is copied to `index.html` by `scripts/prepare-app-shell.mjs` (part of `build:app`)
- `.env.appshell` sets `VITE_APP_SHELL=true` → hides Concierge in app builds (`__root.tsx`)
- Icons/splash: `scripts/generate-icons.ps1` + `scripts/generate-native-assets.ps1` (placeholders)

## Build machine (this Windows box)
- JDK **21** required (Capacitor 8): `C:\Program Files\Microsoft\jdk-21.0.12.8-hotspot`
  (JAVA_HOME set at User scope; JDK 17 also present but too old)
- Android SDK headless: `%LOCALAPPDATA%\Android\Sdk` (platform-tools, platform-36,
  build-tools 36.0.0 — installed by direct zip; **sdkmanager GUI/CLI unzip is broken here**)
- Android Studio at `C:\Program Files\Android\Android Studio`
- VS Code Insiders: `C:\Users\DC\AppData\Local\Programs\Microsoft VS Code Insiders`
- Node 24 / npm 12

## Commands
- `npm run dev` — full-stack web (SSR)
- `npm run build:app` — static SPA for the native shell
- `npm run app:sync` — build + `cap sync` (pushes web bundle into android/ and ios/)
- `cd android && gradlew.bat assembleDebug` / `bundleRelease` (JAVA_HOME must point to JDK 21)

## Hard constraints
- NEVER run node/vite/gradle from the OneDrive copy (placeholder files break native modules).
- iOS builds require macOS — use `.github/workflows/ios-build.yml` or a Mac.
