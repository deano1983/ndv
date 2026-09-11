import rawCatalog from "@/data/catalog.json";

/**
 * STANDALONE CATALOG â€” no Shopify, no Lovable.
 * The storefront no longer calls the Shopify Storefront API (which began
 * returning HTTP 402). All product data now ships with the app from
 * src/data/catalog.json (built by scripts/build-catalog.mjs from the
 * .audit/products.json snapshot + store/ndv-dsers-mapping-full-v5.csv).
 *
 * storefrontApiRequest() is kept as a compatibility shim with the same
 * response shapes the routes already parse, so no route logic changes.
 */

export interface ShopifyMetafield {
  key: string;
  namespace: string;
  value: string;
  type: string;
}

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    productType: string;
    tags: string[];
    vendor?: string;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: { amount: string; currencyCode: string };
          availableForSale: boolean;
          selectedOptions: Array<{ name: string; value: string }>;
        };
      }>;
    };
    options: Array<{ name: string; values: string[] }>;
    shippingEta?: ShopifyMetafield | null;
    supplierUrl?: ShopifyMetafield | null;
    house?: string;
  };
}

const CATALOG = rawCatalog as unknown as ShopifyProduct[];

export const PRODUCTS_QUERY = "local:products";
export const PRODUCT_BY_HANDLE_QUERY = "local:product-by-handle";

export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  if (query === PRODUCT_BY_HANDLE_QUERY) {
    const product = CATALOG.find((p) => p.node.handle === variables.handle)?.node ?? null;
    return { data: { product } };
  }
  // products(first, query) â€” query uses Shopify tag syntax `tag:<tag>`; fall back to all.
  const tag = typeof variables.query === "string" ? variables.query.match(/^tag:(.+)$/)?.[1] : null;
  const edges = tag
    ? CATALOG.filter((p) => p.node.tags.includes(tag))
    : CATALOG;
  return { data: { products: { edges } } };
}

export const CATEGORIES = [
  { slug: "atelier", title: "Atelier", tag: "atelier", blurb: "Cashmere, silk, tagless seams â€” ready-to-wear engineered for the sensitive skin." },
  { slug: "intimates", title: "Intimates", tag: "intimates", blurb: "Luxury lingerie in sensory-friendly fabrics. Soft-cup, wireless, considered." },
  { slug: "shapewear", title: "Second Skin", tag: "Second Skin", blurb: "Seamless shapewear. Compression as comfort, not constraint." },
  { slug: "bedding", title: "Sanctuary Bedding", tag: "bedding", blurb: "Weighted blankets, silk sheets, intimate bedding â€” for deep regulation." },
  { slug: "adornment", title: "Objects & Adornment", tag: "adornment", blurb: "Fine jewelry, tactile objects, calm-finish electronics." },
] as const;

