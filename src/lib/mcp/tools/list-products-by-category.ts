import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { storefront, SITE_BASE, CATEGORIES } from "../shopify-client";

const QUERY = `
  query ByTag($first: Int!, $after: String, $query: String!, $sortKey: ProductSortKeys!, $reverse: Boolean!) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      pageInfo { hasNextPage endCursor }
      edges { cursor node {
        id title handle productType tags
        priceRange { minVariantPrice { amount currencyCode } }
        images(first: 1) { edges { node { url } } }
      } }
    }
  }
`;

type Resp = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: { cursor: string; node: {
      id: string; title: string; handle: string; productType: string; tags: string[];
      priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
      images: { edges: { node: { url: string } }[] };
    } }[];
  };
};

const slugs = CATEGORIES.map((c) => c.slug) as [string, ...string[]];

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
  name: "list_products_by_category",
  title: "List NDV products in a house",
  description: "List products from one of the five NDV houses with pagination and sorting. Use `list_categories` first to see valid slugs. Pass the returned `next_cursor` back as `cursor` to fetch the next page.",
  inputSchema: {
    category: z.enum(slugs).describe("Category slug: atelier | intimates | shapewear | bedding | adornment."),
    limit: z.number().int().min(1).max(50).default(20).describe("Page size (1-50)."),
    cursor: z.string().optional().describe("Opaque cursor from a previous call's `next_cursor` to fetch the next page."),
    sort: z.enum(["relevance", "newest", "oldest", "price_asc", "price_desc", "title_asc", "title_desc", "best_selling"])
      .default("best_selling")
      .describe("Sort order for results."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit, cursor, sort }) => {
    const cat = CATEGORIES.find((c) => c.slug === category);
    if (!cat) return { content: [{ type: "text", text: `Unknown category "${category}".` }], isError: true };
    const { sortKey, reverse } = SORT_MAP[sort];
    const data = await storefront<Resp>(QUERY, {
      first: limit,
      after: cursor ?? null,
      query: `tag:${cat.tag}`,
      sortKey,
      reverse,
    });
    const items = data.products.edges.map((e) => ({
      title: e.node.title,
      handle: e.node.handle,
      url: `${SITE_BASE}/product/${e.node.handle}`,
      price: `${e.node.priceRange.minVariantPrice.amount} ${e.node.priceRange.minVariantPrice.currencyCode}`,
      image: e.node.images.edges[0]?.node.url ?? null,
    }));
    const result = {
      category: cat.title,
      sort,
      items,
      page_info: {
        has_next_page: data.products.pageInfo.hasNextPage,
        next_cursor: data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null,
      },
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
