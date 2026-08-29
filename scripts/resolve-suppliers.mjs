// NDV family — bulk AliExpress supplier resolver for DSers mapping CSVs.
// Reuses the tuned matching logic from src/lib/aliexpress-resolver.functions.ts
// (search cascade via the Lovable Firecrawl gateway, >=50% title-token match,
// mismatch blacklist) so it can run offline from a terminal.
//
// Usage:  node scripts/resolve-suppliers.mjs <csv-path> <ndv|yumi> [--limit N] [--dry]
// Env:    LOVABLE_API_KEY, FIRECRAWL_API_KEY  (never commit these)
// Fills SUPPLIER PRODUCT NAME + URL in place; writes a JSON sidecar
// (<csv>.results.json) so re-runs skip already-resolved handles.
import { readFile, writeFile } from "node:fs/promises";

const [CSV, BRAND, ...rest] = process.argv.slice(2);
const LIMIT = rest.includes("--limit") ? Number(rest[rest.indexOf("--limit") + 1]) : Infinity;
const DRY = rest.includes("--dry");
if (!CSV || !BRAND || !["ndv", "yumi"].includes(BRAND)) {
  console.error("Usage: node resolve-suppliers.mjs <csv-path> <ndv|yumi> [--limit N] [--dry]");
  process.exit(1);
}

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2/search";
const LOVABLE = process.env.LOVABLE_API_KEY;
const FIRECRAWL = process.env.FIRECRAWL_API_KEY;
if (!LOVABLE || !FIRECRAWL) {
  console.error("LOVABLE_API_KEY and FIRECRAWL_API_KEY must be set in the environment.");
  process.exit(1);
}

// Brand-tuned profiles (yumi = men's catalog: never reject "men's", reject women/kids instead)
const PROFILES = {
  ndv: {
    stopwords: new Set(["ndv", "luxury", "atelier", "intimates", "shapewear", "bedding", "adornment", "sanctuary", "the", "and", "for", "with", "a", "an", "of", "set", "pack", "pair", "piece", "pieces", "women", "womens", "ladies", "&"]),
    blacklist: /(captcha|sitemap|cosplay|anime|witch|kids|children|baby|toddler|men'?s|male\b|boys|toy)/i,
  },
  yumi: {
    stopwords: new Set(["yumi", "adhd", "a.d.h.d", "sanctuary", "mindful", "luxury", "emporium", "fashion", "accessories", "electronics", "objects", "the", "and", "for", "with", "a", "an", "of", "set", "pack", "pair", "piece", "pieces", "&"]),
    blacklist: /(captcha|sitemap|cosplay|anime|witch|kids|children|baby|toddler|women|female\b|girls|toy)/i,
  },
};
const { stopwords, blacklist } = PROFILES[BRAND];

const ITEM_URL_RE = /^https?:\/\/(?:[a-z0-9-]+\.)?aliexpress\.(?:com|us)\/item\/\d{6,}\.html/i;
const BAD_URL_RE = /\/(?:w|wholesale|category|store|af|popular|sitemapgz|i)\//i;

function tokenize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)
    .map(t => t.trim()).filter(t => t.length > 1 && !stopwords.has(t));
}

function titleMatchScore(searchTerm, title) {
  const search = tokenize(searchTerm);
  if (!search.length) return 0;
  const t = title.toLowerCase();
  return search.filter(w => t.includes(w)).length / search.length;
}

function isAcceptable(url, title, term) {
  if (!ITEM_URL_RE.test(url) || BAD_URL_RE.test(url) || !title) return false;
  if (blacklist.test(title)) return false;
  return titleMatchScore(term, title) >= 0.5;
}

function normalize(raw) {
  const m = raw.match(/\/item\/(\d+)\.html/i);
  return m ? `https://www.aliexpress.com/item/${m[1]}.html` : raw;
}

async function search(query) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE}`, "X-Connection-Api-Key": FIRECRAWL },
    body: JSON.stringify({ query, limit: 10 }),
  });
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return json.data?.web ?? json.data?.results ?? json.web ?? [];
}

async function resolveOne(term) {
  const core = tokenize(term).join(" ");
  for (const q of [`site:aliexpress.com/item "${core}"`, `site:aliexpress.com/item ${core}`, `site:aliexpress.com ${term}`]) {
    const results = await search(q);
    for (const r of results) {
      const url = r?.url ?? "";
      const title = (r?.title ?? "").trim();
      if (url && title && isAcceptable(url, title, term)) return { url: normalize(url), title };
    }
  }
  return null;
}

// --- tiny CSV parse/serialize (handles quoted fields) ---
function parseCsv(text) {
  const rows = []; let row = []; let field = ""; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length && r.some(f => f !== ""));
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const raw = await readFile(CSV, "utf8");
const rows = parseCsv(raw);
const header = rows.shift();
const iName = header.indexOf("STORE PRODUCT NAME");
const iHandle = header.indexOf("STORE PRODUCT HANDLE");
const iSupName = header.indexOf("SUPPLIER PRODUCT NAME");
const iSupUrl = header.indexOf("SUPPLIER PRODUCT URL");
if (iName < 0 || iHandle < 0 || iSupName < 0 || iSupUrl < 0) throw new Error("Unexpected CSV header");

let sidecar = {};
try { sidecar = JSON.parse(await readFile(CSV + ".results.json", "utf8")); } catch { /* fresh run */ }

const todo = rows.filter(r => !r[iSupUrl] && !sidecar[r[iHandle]]?.url).slice(0, LIMIT);
console.log(`Rows: ${rows.length} · to resolve: ${todo.length}`);

let ok = 0, fail = 0, n = 0;
for (const r of todo) {
  n++;
  const handle = r[iHandle];
  try {
    const hit = await resolveOne(r[iName]);
    if (hit) {
      ok++;
      sidecar[handle] = { url: hit.url, title: hit.title };
      r[iSupName] = hit.title;
      r[iSupUrl] = hit.url;
      console.log(`[${n}/${todo.length}] OK   ${handle} -> ${hit.url}`);
    } else {
      fail++;
      sidecar[handle] = { url: null, title: null, failed: true };
      console.log(`[${n}/${todo.length}] MISS ${handle} (${r[iName]})`);
    }
  } catch (e) {
    fail++;
    sidecar[handle] = { url: null, title: null, error: String(e.message || e) };
    console.log(`[${n}/${todo.length}] ERR  ${handle}: ${e.message}`);
  }
  if (!DRY && n % 5 === 0) {
    await writeFile(CSV, header.map(csvEscape).join(",") + "\r\n" + rows.map(r2 => r2.map(csvEscape).join(",")).join("\r\n") + "\r\n", "utf8");
    await writeFile(CSV + ".results.json", JSON.stringify(sidecar, null, 2), "utf8");
  }
  await new Promise(res => setTimeout(res, 400)); // gentle pacing
}

if (!DRY) {
  await writeFile(CSV, header.map(csvEscape).join(",") + "\r\n" + rows.map(r2 => r2.map(csvEscape).join(",")).join("\r\n") + "\r\n", "utf8");
  await writeFile(CSV + ".results.json", JSON.stringify(sidecar, null, 2), "utf8");
}
console.log(`Done. resolved=${ok} missed/failed=${fail} (sidecar: ${CSV}.results.json)`);


