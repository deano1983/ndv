import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listCategories from "./tools/list-categories";
import listProductsByCategory from "./tools/list-products-by-category";

// Issuer must be the direct Supabase auth host (inlined at build time).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ndv-mcp",
  title: "NDV · Neurodivergence",
  version: "0.1.0",
  instructions:
    "MCP for the NDV luxury storefront (Neurodivergence). Requires OAuth sign-in. Read-only access to the NDV catalog across five houses: Atelier, Intimates, Second Skin, Sanctuary Bedding, Objects & Adornment. Use `list_categories` to discover houses, `list_products_by_category` to browse, `search_products` for keyword queries, and `get_product` for full details, sizing, variants, and shipping ETA.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCategories, listProductsByCategory, searchProducts, getProduct],
});
