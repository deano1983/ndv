# System Patterns

## Architecture (web)
- File-based routes (TanStack Router): `__root.tsx` shell (QueryClientProvider + Concierge),
  `index` / `category.$slug` / `product.$handle` / `cart` / `thank-you` / `auth` / admin / mcp.
- Data: TanStack Query → `storefrontApiRequest()` GraphQL against Shopify Storefront API.
  Products/collections load at RUNTIME (no build-time catalog). Local images are only
  hero/category tiles (+ AliExpress admin assets).
- Cart: zustand persist store; Shopify cart mutations (create/add/update/remove) with
  cart-not-found self-healing (`useCartSync` hook rehydrates on route entry).
- SEO: per-route `head()` meta + JSON-LD in `__root.tsx`.

## Architecture (native shell)
- Same codebase builds twice: SSR web (`npm run dev`/`build`) and SPA (`build:app`).
- Feature gating via env: `import.meta.env.VITE_APP_SHELL` (Concierge hidden in app).
- Capacitor serves `dist/client` inside the WebView (`androidScheme: https` for clean
  CORS/storage). Shopify checkoutUrl opens the Shopify-hosted checkout (physical goods →
  external payments allowed by both stores; no IAP needed).
- iOS via Swift Package Manager (Capacitor 8) — no CocoaPods step.
- Release signing: `keystore.properties` (root) → `signingConfigs.release` in
  `android/app/build.gradle` (conditional so unsigned builds still work without the file).

## Gotchas learned the hard way
- OneDrive placeholders → native .node LoadLibrary fails → rolldown WASI fallback →
  `UNRESOLVED_ENTRY`. Always work in `C:\dev\ndv`.
- TanStack SPA build emits `_shell.html`, not `index.html` (prepare script copies it).
- Google repo zips for build-tools ≥ r35 use UNDERSCORES: `build-tools_r36_windows.zip`.
- `@capacitor/assets`/sharp wouldn't install here → icons generated with System.Drawing scripts.
- Gradle daemon inherits stale env; use `--no-daemon` + explicit JAVA_HOME in the command.
