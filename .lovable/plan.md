
# NDV — Neurodivergence (Luxury for Her)

Port the structure, stack, and design system of your existing **Yu+Mi A.D.H.D Sanctuary** project into this one, rebranded as **NDV** and re-curated for wealthy, neurodivergent women aged 18–55 (autism, Asperger's, ADHD, and adjacent sensitivities).

## Brand

- Name: **NDV** (Neurodivergence)
- Tagline direction: *"Luxury for the sensitive woman."*
- Audience: women 18–55, upper-class, sensory-sensitive
- Tone: hushed, tactile, sanctuary-like — same Noir + Gold palette as Yu+Mi, but softer (warmer champagne gold, faint blush undertone in the dark base) so it reads feminine without going pastel.
- Typography carried over: Cormorant Garamond (display) + Inter (sans).

## Stack (mirrors Yu+Mi)

- TanStack Start + TanStack Router (file-based routes)
- TanStack Query
- Tailwind v4 + shadcn
- **Shopify** for catalog, cart, checkout (will prompt you to enable — new dev store vs. connect existing)

## Categories ("The Five Houses", re-curated for her)

1. **Atelier** — ready-to-wear womenswear (cashmere, silk, tagless seams)
2. **Intimates** — luxury lingerie, soft-cup bras, sensory-friendly fabrics
3. **Shapewear & Second Skin** — seamless shaping, compression-as-comfort
4. **Sanctuary Bedding** — weighted blankets, silk sheets, intimate bedding
5. **Objects & Adornment** — fine jewelry, tactile fidget objects, personal electronics in calm finishes

## Routes (same shape as Yu+Mi)

- `/` — hero, five-house grid, product edit, manifesto
- `/category/$slug` — filtered Shopify collection view
- `/product/$handle` — product detail with variants + add-to-cart

Header, Footer, ProductCard, Shopify Storefront client (`src/lib/shopify.ts`), and cart store all port over with NDV copy + the feminine palette tweak.

## Manifesto (placeholder, editable)

> "We line the silk so the seam never bites. We weight the blanket because the world is loud. We make the bra without the wire, the shapewear without the squeeze. Every object here has a second job: to soften something."

## Build order

1. Enable Shopify (ask: new dev store or connect existing).
2. Port `styles.css` tokens with feminine-luxe tweak; add Google Fonts link in `__root.tsx`.
3. Port `src/lib/shopify.ts` with NDV `CATEGORIES` array.
4. Port `Header`, `Footer`, `ProductCard`, cart store.
5. Build `/`, `/category/$slug`, `/product/$handle` routes with NDV copy and SEO metadata per route.
6. Generate 6 brand images (hero + 5 category tiles) in the noir-champagne aesthetic.
7. Wire cart → Shopify checkout.

## Open question before build

Should I **connect the same Shopify store** as Yu+Mi (shared catalog, NDV as a second storefront) or **create a brand-new Shopify dev store** for NDV? I'll ask this once we start.
