import { toast } from "sonner";

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "6g358e-tz.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "745fa452d4d5229f5e56530910b1f60d";

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
  };
}

const METAFIELD_IDENTIFIERS = `
  shippingEta: metafield(namespace: "custom", key: "shipping_eta") { key namespace value type }
  supplierUrl: metafield(namespace: "custom", key: "supplier_url") { key namespace value type }
`;

export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id title description handle productType tags vendor
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 5) { edges { node { url altText } } }
          variants(first: 10) {
            edges { node { id title price { amount currencyCode } availableForSale selectedOptions { name value } } }
          }
          options { name values }
          ${METAFIELD_IDENTIFIERS}
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id title description handle productType tags vendor
      priceRange { minVariantPrice { amount currencyCode } }
      images(first: 8) { edges { node { url altText } } }
      variants(first: 25) {
        edges { node { id title price { amount currencyCode } availableForSale selectedOptions { name value } } }
      }
      options { name values }
      ${METAFIELD_IDENTIFIERS}
    }
  }
`;

export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    toast.error("Shopify: Payment required", {
      description: "Shopify API access requires an active billing plan. Visit https://admin.shopify.com to upgrade.",
    });
    return;
  }

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  if (data.errors) throw new Error(`Shopify: ${data.errors.map((e: { message: string }) => e.message).join(", ")}`);
  return data;
}

export const CATEGORIES = [
  { slug: "atelier", title: "Atelier", tag: "atelier", blurb: "Cashmere, silk, tagless seams — ready-to-wear engineered for the sensitive skin." },
  { slug: "intimates", title: "Intimates", tag: "intimates", blurb: "Luxury lingerie in sensory-friendly fabrics. Soft-cup, wireless, considered." },
  { slug: "shapewear", title: "Second Skin", tag: "Second Skin", blurb: "Seamless shapewear. Compression as comfort, not constraint." },
  { slug: "bedding", title: "Sanctuary Bedding", tag: "bedding", blurb: "Weighted blankets, silk sheets, intimate bedding — for deep regulation." },
  { slug: "adornment", title: "Objects & Adornment", tag: "adornment", blurb: "Fine jewelry, tactile objects, calm-finish electronics." },
] as const;
