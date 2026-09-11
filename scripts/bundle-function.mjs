#!/usr/bin/env node
/**
 * bundle-function.mjs — inline the price-book JSON import into the checkout
 * function so it becomes ONE self-contained .mjs file, ready to upload via the
 * Netlify Functions API (which takes a single bundled file per function).
 *
 * Usage: node scripts/bundle-function.mjs
 *   in:  netlify/functions/create-checkout-session.mjs (+ ./data/<brand>-prices.json)
 *   out: .netlify-function-build/create-checkout-session.mjs (self-contained)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "netlify", "functions", "create-checkout-session.mjs");
const OUT_DIR = path.join(ROOT, ".netlify-function-build");
const OUT = path.join(OUT_DIR, "create-checkout-session.mjs");

const src = fs.readFileSync(SRC, "utf8");

// Find the price-book import, e.g.  import pricesData from "./data/ndv-prices.json";
const m = src.match(/import\s+(\w+)\s+from\s+"\.\/data\/([\w.-]+\.json)";/);
if (!m) {
  console.error("No ./data/*.json import found in", SRC);
  process.exit(1);
}
const [, ident, dataFile] = m;
const pricesPath = path.join(ROOT, "netlify", "functions", "data", dataFile);
const prices = fs.readFileSync(pricesPath, "utf8").trim();

fs.mkdirSync(OUT_DIR, { recursive: true });
const bundled = src.replace(
  m[0],
  `// INLINED by scripts/bundle-function.mjs — do not edit by hand.\nconst ${ident} = ${prices};`,
);
fs.writeFileSync(OUT, bundled);
console.log("bundled ->", OUT, `(${bundled.length} bytes)`);
