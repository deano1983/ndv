#!/usr/bin/env node
/**
 * finalize-mapping.mjs — merge resolver output with the v5 DSers mapping.
 *
 * Rules:
 *  - REPLACED / NEW rows: use the resolver's fresh supplier (high-confidence match).
 *  - RETAINED-* / UNRESOLVED rows: keep the v5 supplier URL (DSers source of truth),
 *    action=RETAINED, confidence=LEGACY (curated in DSers, not re-verifiable now).
 *  - Emits:
 *      1. store/ndv-dsers-product-mapping-v6.csv  — full audit trail (previous vs new)
 *      2. netlify/functions/data/ndv-prices.json  — server-side price book for checkout
 */
import fs from "node:fs";
import path from "node:path";
import { parseCsv, csvEscape } from "./csv-utils.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const V5 = path.join(ROOT, "store/ndv-dsers-mapping-full-v5.csv");
const V6 = path.join(ROOT, "store/ndv-dsers-product-mapping-v6.csv");
const RESOLVED = path.join(ROOT, "src/data/sourcing/dsers-resolved.json");
const PRICES = path.join(ROOT, "netlify/functions/data/ndv-prices.json");

const v5Rows = parseCsv(fs.readFileSync(V5, "utf8"));
const v5Head = v5Rows[0].map((h) => h.trim());
const idx = (needle) => v5Head.findIndex((h) => h.toLowerCase().includes(needle));
const C = {
  handle: idx("shopify handle"), id: idx("shopify product id"), variant: idx("variant id"),
  title: idx("ndv title"), house: idx("house"), retail: idx("retail"), url: idx("aliexpress url"),
  image: idx("shopify image"), eta: idx("shipping eta"), search: idx("aliexpress search term"),
};
const byHandle = new Map(v5Rows.slice(1).map((r) => [r[C.handle], r]));

const resolved = JSON.parse(fs.readFileSync(RESOLVED, "utf8"));
const lines = [[
  "STORE PRODUCT ID", "STORE PRODUCT NAME", "STORE PRODUCT HANDLE", "SKU",
  "RETAIL (AUD)", "PREVIOUS SUPPLIER URL", "ACTION", "MATCH CONFIDENCE",
  "MATCH SCORE", "SUPPLIER PRODUCT ID", "SUPPLIER PRODUCT NAME",
  "SUPPLIER PRODUCT URL", "SUPPLIER PRICE", "SUPPLIER CURRENCY",
  "SUPPLIER UNITS SOLD", "SEARCH QUERY",
].join(",")];

const prices = {};
let fresh = 0, legacy = 0, missing = 0;
for (const r of resolved) {
  const v5 = byHandle.get(r.storeHandle);
  const retail = v5 ? v5[C.retail] : r.retail;
  let supplier = r.supplier;
  let action = r.action, confidence = r.confidence;
  if (action.startsWith("RETAINED") || action === "UNRESOLVED") {
    const prev = r.previousUrl || (v5 ? v5[C.url] : "");
    if (prev) {
      const pid = prev.match(/item\/(\d+)\.html/)?.[1] ?? "";
      supplier = { productId: pid, url: prev, title: v5?.[C.title] ? "legacy DSers mapping" : "", price: null, currency: null, soldDesc: null };
      action = "RETAINED"; confidence = "LEGACY (DSers source of truth)";
      legacy++;
    } else { missing++; }
  } else fresh++;
  lines.push([
    r.storeId, r.storeName, r.storeHandle, r.sku, retail, r.previousUrl,
    action, confidence, r.score, supplier?.productId ?? "", supplier?.title ?? "",
    supplier?.url ?? "", supplier?.price ?? "", supplier?.currency ?? "",
    supplier?.soldDesc ?? "", r.searchQuery,
  ].map(csvEscape).join(","));

  if (retail && /^\d/.test(retail)) {
    const amountCents = Math.round(parseFloat(retail) * 100);
    prices[r.storeHandle] = {
      variantId: v5?.[C.variant] ?? "",
      title: v5?.[C.title] ?? r.storeName,
      house: v5?.[C.house] ?? "",
      amountCents,
      currency: "aud",
      image: v5?.[C.image] ?? "",
    };
  }
}
fs.writeFileSync(V6, lines.join("\r\n") + "\r\n");
fs.mkdirSync(path.dirname(PRICES), { recursive: true });
fs.writeFileSync(PRICES, JSON.stringify(prices, null, 2));
console.log(`fresh best-match: ${fresh} | retained legacy DSers: ${legacy} | missing URL: ${missing}`);
console.log(`prices: ${Object.keys(prices).length} -> ${PRICES}`);
