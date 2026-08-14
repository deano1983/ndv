import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { storefront, SITE_BASE } from "../shopify-client";

const QUERY = `
  query Search($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys!, $reverse: Boolean!) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      pageInfo { hasNextPage endCursor }
      edges { cursor node {
        id title handle productType tags vendor
        priceRange { minVariantPrice { amount currencyCode } }
        images(first: 1) { edges { node { url altText } } }
      } }
    }
  }
`;

type Resp = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: {
      cursor: string;
      node: {
        id: string; title: string; handle: string; productType: string;
        tags: string[]; vendor?: string;
        priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
        images: { edges: { node: { url: string; altText: string | null } }[] };
      };
    }[];
  };
};

const SORT_MAP = {
  relevance: { sortKey: "RELEVANCE", reverse: false },
  newest: { sortKey: "CREATED_AT", reverse: true },
  oldest: { sortKey: "CREATED_AT", reverse: false },
  price_asc: { sortKey: "PRICE", reverse: false },
  price_desc: { sortKey: "PRICE", reverse: true },
  title_asc: { sortKey: "TITLE", reverse: false },
  title_desc: { sortKey: "TITLE", reverse: true },
  best_selling: { sortKey: "BEST_SELLING", reverse: false },
} as const;

export default defineTool({
  name: "search_products",
  title: "Search NDV products",
  description: "Search the NDV luxury catalog by keyword with pagination and sorting. Returns title, price, category, image, and product URL. Pass the returned `next_cursor` back as `cursor` to fetch the next page.",
  inputSchema: {
    query: z.string().min(1).describe("Free-text search: fabric, garment type, mood, house name."),
    limit: z.number().int().min(1).max(25).default(10).describe("Page size (1-25)."),
    cursor: z.string().optional().describe("Opaque cursor from a previous call's `next_cursor` to fetch the next page."),
    sort: z.enum(["relevance", "newest", "oldest", "price_asc", "price_desc", "title_asc", "title_desc", "best_selling"])
      .default("relevance")
      .describe("Sort order for results."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit, cursor, sort }) => {
    const { sortKey, reverse } = SORT_MAP[sort];
    const data = await storefront<Resp>(QUERY, {
      first: limit,
      after: cursor ?? null,
      query,
      sortKey,
      reverse,
    });
    const items = data.products.edges.map((e) => ({
      id: e.node.id,
      title: e.node.title,
      handle: e.node.handle,
      url: `${SITE_BASE}/product/${e.node.handle}`,
      category: e.node.productType,
      tags: e.node.tags,
      vendor: e.node.vendor,
      price: `${e.node.priceRange.minVariantPrice.amount} ${e.node.priceRange.minVariantPrice.currencyCode}`,
      image: e.node.images.edges[0]?.node.url ?? null,
    }));
    const result = {
      sort,
      items,
      page_info: {
        has_next_page: data.products.pageInfo.hasNextPage,
        next_cursor: data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null,
      },
    };
    return {
      content: [
        { type: "text", text: items.length ? JSON.stringify(result, null, 2) : "No products found." },
      ],
      structuredContent: result,
    };
  },
});
