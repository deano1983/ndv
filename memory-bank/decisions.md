# Decisions Log

1. **Work happens in `C:\dev\ndv`, never in the OneDrive copy.**
   OneDrive Files On-Demand placeholders (ReparsePoint attr) can't be memory-mapped by
   LoadLibrary → native node modules (rolldown binding) fail → silent fallback to WASI WASM
   → Vite dies with `UNRESOLVED_ENTRY` on any path. Robocopy to local disk hydrates files
   and strips placeholders. Fresh `npm install` at the new location.

2. **Capacitor 8 wrapper (not React Native rewrite).** The app is already a complete,
   client-side-capable storefront (Shopify Storefront API is CORS-open). Wrapping is weeks
   faster; e-commerce wrappers are routinely accepted by both stores (physical goods =
   external checkout allowed, no IAP required).

3. **SPA mode build for the shell** (`vite.config.app.ts`, TanStack Start `spa.enabled`),
   not a hosted-URL wrapper — avoids Apple 4.2 / Play WebView-spam rejection risk and works
   offline-first for the shell UI. `_shell.html` → `index.html` via `scripts/prepare-app-shell.mjs`.

4. **Server features trimmed in app v1**: Concierge (`/api/chat`), MCP endpoints, admin
   AliExpress tools are hidden via `VITE_APP_SHELL` (see `.env.appshell`). Can be re-enabled
   later pointed at a deployed API URL.

5. **sdkmanager avoided for package installs** — its unzip step repeatedly failed on this
   machine. Packages installed by direct zip download from dl.google.com + Expand-Archive.

6. **appId `com.ndv.vault` is a PLACEHOLDER.** Must be finalized before first store upload
   (immutable afterwards on both stores).

7. **Icons are generated placeholders** (System.Drawing monogram, `scripts/generate-*.ps1`)
   because `@capacitor/assets`/sharp native binary wouldn't install. Re-run scripts or drop
   designer PNGs into `assets/` when final art exists.

8. **Memory bank**: this folder is the source of truth across sessions. Update
   `activeContext.md` + `progress.md` at every milestone and before ending any session.
