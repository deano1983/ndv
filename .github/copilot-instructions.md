# NDV — Copilot instructions

- **Read `memory-bank/activeContext.md` first** when a session starts (it is the resumable
  memory of previous sessions). Update `memory-bank/activeContext.md` + `progress.md` after
  milestones and before the session ends.
- Work only in `C:\dev\ndv` (never the OneDrive copy — native modules break there).
- Web: TanStack Start SSR (`npm run dev`). Native app: Capacitor 8 shell built from the SPA
  bundle (`npm run build:app`, then `cap sync`). Keep both builds green.
- Design tokens: noir #1A1616, champagne #E8D5C4, dusty rose #CFA0A0; Cormorant Garamond + Inter.
