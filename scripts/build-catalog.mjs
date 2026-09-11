#!/usr/bin/env node
/**
 * build-catalog.mjs — build NDV's standalone local product catalog.
 *
 * Merges:
 *   .audit/products.json                 (images, tags, titles, handles — Shopify snapshot)
 *   store/ndv-dsers-mapping-full-v5.csv  (variant IDs, SKUs, AUD retail, house, supplier URL)
 *
 * Outputs:
 *   src/data/catalog.json                 (client catalog, ShopifyProduct-shaped nodes)
 *   netlify/functions/data/ndv-prices.json (server-side price truth for checkout validation)
 *
 * Descriptions are generated from house-voice templates because the Shopify
 * storefront API (descriptions source) is no longer accessible (HTTP 402).
 *
 * Usage: node scripts/build-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

const audit = read(".audit/products.json");
const v5Rows = parseCsv(fs.readFileSync(path.join(root, "store/ndv-dsers-mapping-full-v5.csv"), "utf8"));
const v5 = v5ToMap(v5Rows);

const HOUSE_COPY = {
  "Atelier": { vibe: "ready-to-wear engineered for sensitive skin", fabric: "sensory-considered fabrications" },
  "Intimates": { vibe: "luxury lingerie in sensory-friendly fabrics", fabric: "soft-cup, wireless constructions" },
  "Second Skin": { vibe: "seamless shapewear that compresses as comfort, never constraint", fabric: "second-skin knits" },
  "Sanctuary Bedding": { vibe: "bedding for deep regulation and restorative sleep", fabric: "weighted, silked, calm-finish textiles" },
  "Objects & Adornment": { vibe: "tactile objects and calm-finish electronics", fabric: "hypoallergenic finishes" },
};

function description(node, house) {
  const copy = HOUSE_COPY[house] ?? HOUSE_COPY["Objects & Adornment"];
  return (
    `${node.title}. From the ${house ? house + " " : ""}house: ${copy.vibe}. ` +
    `Cut from ${copy.fabric} with tagless seams and flat-locked edges — every detail chosen for low-sensory comfort. ` +
    `Ships in 7–14 days. Part of the Nouveau Dames Vault considered-edit: fewer pieces, kept longer.`
  );
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function v5ToMap(rows) {
  const head = rows[0].map((h) => h.trim());
  const idx = (n) => head.findIndex((h) => h.toLowerCase() === n.toLowerCase());
  const c = {
    handle: idx("Shopify Handle"), pid: idx("Shopify Product ID"), vid: idx("Variant ID"),
    sku: idx("SKU"), title: idx("NDV Title"), house: idx("House"),
    variant: idx("Variant Title"), retail: idx("Retail (AUD)"),
    eta: idx("Shipping ETA"), supplier: idx("AliExpress URL"),
  };
  const map = new Map();
  for (const r of rows.slice(1)) {
    map.set(r[c.handle].trim(), {
      productId: r[c.pid]?.trim() ?? "", variantId: r[c.vid]?.trim() ?? "",
      sku: r[c.sku]?.trim() ?? "", house: r[c.house]?.trim() ?? "",
      variantTitle: r[c.variant]?.trim() || "Default Title",
      retail: r[c.retail]?.trim() ?? "", eta: r[c.eta]?.trim() || "7-14 days",
      supplierUrl: r[c.supplier]?.trim() ?? "",
    });
  }
  return map;
}

const catalog = [];
const prices = {};
let withPrice = 0;
for (const p of audit) {
  const handle = p.handle;
  const m = v5.get(handle);
  const house = m?.house ?? (p.tags?.find((t) => t.startsWith("House:"))?.slice(6) ?? "");
  const retail = m?.retail ? Number(m.retail) : null;
  if (retail) withPrice++;
  const gid = m?.productId ? `gid://shopify/Product/${m.productId}` : p.id;
  const vgid = m?.variantId ? `gid://shopify/ProductVariant/${m.variantId}` : `${p.id}/variant/0`;
  const node = {
    id: gid,
    title: p.title,
    description: description(p, house),
    handle,
    productType: p.productType ?? "Ready-to-Wear",
    tags: p.tags ?? [],
    vendor: p.vendor ?? "NDV",
    priceRange: { minVariantPrice: { amount: retail ? retail.toFixed(2) : "0.00", currencyCode: "AUD" } },
    images: p.images,
    variants: {
      edges: [{
        node: {
          id: vgid,
          title: m?.variantTitle ?? "Default Title",
          price: { amount: retail ? retail.toFixed(2) : "0.00", currencyCode: "AUD" },
          availableForSale: true,
          selectedOptions: [{ name: "Title", value: m?.variantTitle ?? "Default Title" }],
          sku: m?.sku ?? "",
        },
      }],
    },
    options: [{ name: "Title", values: [m?.variantTitle ?? "Default Title"] }],
    shippingEta: m?.eta ? { key: "shipping_eta", namespace: "custom", value: m.eta, type: "single_line_text_field" } : null,
    supplierUrl: m?.supplierUrl ? { key: "supplier_url", namespace: "custom", value: m.supplierUrl, type: "url" } : null,
    house,
  };
  catalog.push({ node });
  prices[handle] = {
    variantId: vgid, title: p.title, house,
    amountCents: retail ? Math.round(retail * 100) : null,
    currency: "aud", image: p.images?.edges?.[0]?.node?.url ?? "",
  };
}

fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
fs.mkdirSync(path.join(root, "netlify/functions/data"), { recursive: true });
fs.writeFileSync(path.join(root, "src/data/catalog.json"), JSON.stringify(catalog, null, 2));
fs.writeFileSync(path.join(root, "netlify/functions/data/ndv-prices.json"), JSON.stringify(prices, null, 2));
console.log(`catalog: ${catalog.length} products, ${withPrice} priced. -> src/data/catalog.json + netlify/functions/data/ndv-prices.json`);

