import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { CATEGORIES, SHOPIFY_STOREFRONT_URL, SHOPIFY_STOREFRONT_TOKEN } from "@/lib/shopify";

const BASE_URL = "https://ndv-luxe-haven.lovable.app";

const SITEMAP_PRODUCTS_QUERY = `
  query SitemapProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges { node { handle updatedAt } }
    }
  }
`;

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

async function fetchAllProducts(): Promise<Array<{ handle: string; updatedAt: string }>> {
  const out: Array<{ handle: string; updatedAt: string }> = [];
  let after: string | null = null;
  for (let i = 0; i < 10; i++) {
    const r: Response = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: SITEMAP_PRODUCTS_QUERY, variables: { first: 250, after } }),
    });
    const json: any = await r.json();
    const conn: any = json?.data?.products;
    if (!conn) break;
    for (const e of (conn.edges ?? []) as Array<{ node: { handle: string; updatedAt: string } }>) {
      if (e?.node?.handle) out.push({ handle: e.node.handle, updatedAt: e.node.updatedAt });
    }
    if (!conn.pageInfo?.hasNextPage) break;
    after = conn.pageInfo.endCursor as string;
  }
  return out;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
        ];

        for (const c of CATEGORIES) {
          entries.push({ path: `/category/${c.slug}`, changefreq: "weekly", priority: "0.8" });
        }

        try {
          const products = await fetchAllProducts();
          for (const p of products) {
            entries.push({
              path: `/product/${p.handle}`,
              lastmod: p.updatedAt ? p.updatedAt.slice(0, 10) : undefined,
              changefreq: "weekly",
              priority: "0.6",
            });
          }
        } catch (e) {
          console.error("sitemap product fetch failed", e);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
