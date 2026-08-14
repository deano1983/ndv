import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { storefront, SITE_BASE } from "../shopify-client";

const QUERY = `
  query Product($handle: String!) {
    product(handle: $handle) {
      id title description handle productType tags vendor
      priceRange { minVariantPrice { amount currencyCode } }
      images(first: 8) { edges { node { url altText } } }
      variants(first: 25) {
        edges { node { id title availableForSale price { amount currencyCode } selectedOptions { name value } } }
      }
      options { name values }
      shippingEta: metafield(namespace: "custom", key: "shipping_eta") { value }
    }
  }
`;

type Product = {
  product: {
    id: string; title: string; description: string; handle: string;
    productType: string; tags: string[]; vendor?: string;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    images: { edges: { node: { url: string; altText: string | null } }[] };
    variants: { edges: { node: {
      id: string; title: string; availableForSale: boolean;
      price: { amount: string; currencyCode: string };
      selectedOptions: { name: string; value: string }[];
    } }[] };
    options: { name: string; values: string[] }[];
    shippingEta: { value: string } | null;
  } | null;
};

export default defineTool({
  name: "get_product",
  title: "Get NDV product details",
  description: "Fetch full details for a single NDV product by its handle (URL slug), including description, all variants, sizes, and shipping ETA.",
  inputSchema: {
    handle: z.string().min(1).describe("Product handle (URL slug), e.g. 'the-quiet-slip'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ handle }) => {
    const data = await storefront<Product>(QUERY, { handle });
    if (!data.product) {
      return { content: [{ type: "text", text: `No product with handle "${handle}".` }], isError: true };
    }
    const p = data.product;
    const result = {
      title: p.title,
      handle: p.handle,
      url: `${SITE_BASE}/product/${p.handle}`,
      description: p.description,
      category: p.productType,
      tags: p.tags,
      vendor: p.vendor,
      price: `${p.priceRange.minVariantPrice.amount} ${p.priceRange.minVariantPrice.currencyCode}`,
      shipping_eta: p.shippingEta?.value ?? null,
      options: p.options,
      images: p.images.edges.map((e) => e.node.url),
      variants: p.variants.edges.map((e) => ({
        title: e.node.title,
        price: `${e.node.price.amount} ${e.node.price.currencyCode}`,
        available: e.node.availableForSale,
        options: e.node.selectedOptions,
      })),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
