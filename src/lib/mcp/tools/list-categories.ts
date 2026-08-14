import { defineTool } from "@lovable.dev/mcp-js";
import { CATEGORIES, SITE_BASE } from "../shopify-client";

export default defineTool({
  name: "list_categories",
  title: "List NDV houses",
  description: "List the five NDV houses (categories): Atelier, Intimates, Second Skin, Sanctuary Bedding, Objects & Adornment.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const items = CATEGORIES.map((c) => ({
      slug: c.slug,
      title: c.title,
      tag: c.tag,
      description: c.blurb,
      url: `${SITE_BASE}/category/${c.slug}`,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { categories: items },
    };
  },
});
