// Server-side Storefront API client for MCP tools. Reads only public catalog data.
const STORE_DOMAIN = "6g358e-tz.myshopify.com";
const API_VERSION = "2025-07";
const STOREFRONT_TOKEN = "745fa452d4d5229f5e56530910b1f60d";
const ENDPOINT = `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`;

export async function storefront<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join(", "));
  return json.data as T;
}

export const CATEGORIES = [
  { slug: "atelier", title: "Atelier", tag: "atelier", blurb: "Cashmere, silk, tagless seams — ready-to-wear engineered for the sensitive skin." },
  { slug: "intimates", title: "Intimates", tag: "intimates", blurb: "Luxury lingerie in sensory-friendly fabrics. Soft-cup, wireless, considered." },
  { slug: "shapewear", title: "Second Skin", tag: "shapewear", blurb: "Seamless shapewear. Compression as comfort, not constraint." },
  { slug: "bedding", title: "Sanctuary Bedding", tag: "bedding", blurb: "Weighted blankets, silk sheets, intimate bedding — for deep regulation." },
  { slug: "adornment", title: "Objects & Adornment", tag: "adornment", blurb: "Fine jewelry, tactile objects, calm-finish electronics." },
] as const;

export const SITE_BASE = "https://ndv-luxe-haven.lovable.app";
