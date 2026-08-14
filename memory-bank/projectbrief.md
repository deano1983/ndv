# NDV — Project Brief

**NDV (Neurodivergence) — "Luxury for the sensitive woman."**
Luxury e-commerce for neurodivergent women 18–55 (autism/ADHD/sensory-sensitive).
Noir (#1A1616) + champagne (#E8D5C4) + dusty rose (#CFA0A0). Cormorant Garamond + Inter.

- Source: Lovable export ("Nouveau Dames' Vault"). Original lives at
  `C:\Users\DC\OneDrive\Desktop\yumi-ndv\Nouveau Dames Vault1` (backup only — do NOT work there; see decisions.md).
- **Working copy (use this one): `C:\dev\ndv`** (local disk, no OneDrive placeholders).
- Stack: TanStack Start + Router + Query, Tailwind v4 + shadcn, zustand cart, Supabase auth,
  Shopify Storefront API (store `6g358e-tz.myshopify.com`, token hardcoded in `src/lib/shopify.ts`).
- Routes: `/`, `/category/$slug`, `/product/$handle`, `/cart`, `/thank-you`, `/auth`, admin (`admin.dsers`, `admin.imports`), MCP endpoints, AI Concierge (`/api/chat`).
- Five Houses: Atelier, Intimates, Second Skin (shapewear), Sanctuary Bedding, Objects & Adornment.

## Current mission
Wrap NDV as a **native mobile app** (Capacitor 8) and ship to **Google Play** and **Apple App Store**,
developed from **VS Code Insiders**. Web deploy stays as-is; native shell shares the same codebase.
