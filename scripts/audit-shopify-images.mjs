// NDV — Shopify catalog image audit (read-only, Storefront API).
// Dumps every product + its images to .audit/ and downloads sized copies for review.
// Usage: node scripts/audit-shopify-images.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SHOP = "6g358e-tz.myshopify.com";
const TOKEN = "745fa452d4d5229f5e56530910b1f60d"; // public Storefront token (same as src/lib/shopify.ts)
const API = `https://${SHOP}/api/2025-07/graphql.json`;
const OUT = path.resolve(process.cwd(), ".audit");
const IMG = path.join(OUT, "img");

const QUERY = `
  query Audit($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id title handle vendor productType tags status: status
          images(first: 10) { edges { node { url altText } } }
        }
      }
    }
  }
`;

// status isn't on Storefront Product in all versions — drop it if the API complains.
const QUERY_SAFE = `
  query Audit($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id title handle vendor productType tags
          images(first: 10) { edges { node { url altText } } }
        }
      }
    }
  }
`;

async function gql(query, variables) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

// Shopify CDN: request a small review copy via width param.
function sized(url, w = 480) {
  return url + (url.includes("?") ? "&" : "?") + `width=${w}`;
}

const products = [];
let cursor = null;
try {
  // first attempt with status field; fall back to safe query
  let q = QUERY;
  for (;;) {
    let data;
    try {
      data = await gql(q, { cursor });
    } catch (e) {
      if (q !== QUERY_SAFE) { q = QUERY_SAFE; continue; }
      throw e;
    }
    const conn = data.products;
    for (const { node } of conn.edges) products.push(node);
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
} catch (e) {
  console.error("Storefront query failed:", e.message);
  process.exit(1);
}

await mkdir(IMG, { recursive: true });
await writeFile(path.join(OUT, "products.json"), JSON.stringify(products, null, 2));

let dl = 0, fail = 0;
const manifest = [];
for (const p of products) {
  const imgs = p.images.edges.map((e) => e.node);
  imgs.forEach((img, i) => manifest.push({ handle: p.handle, title: p.title, index: i, url: img.url, altText: img.altText }));
  for (let i = 0; i < imgs.length; i++) {
    const file = path.join(IMG, `${p.handle}__${i + 1}.jpg`);
    try {
      const r = await fetch(sized(imgs[i].url));
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await writeFile(file, Buffer.from(await r.arrayBuffer()));
      dl++;
    } catch (e) {
      fail++;
      console.error(`  download failed ${p.handle}[${i}]: ${e.message}`);
    }
  }
}

await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Products: ${products.length}`);
console.log(`Images:   ${manifest.length} (downloaded ${dl}, failed ${fail})`);
console.log(`Out:      ${OUT}`);
console.log("\nPer-product image counts:");
for (const p of products) {
  console.log(`  ${p.handle}  [${p.images.edges.length} img]  ${p.title}`);
}
