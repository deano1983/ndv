import { createServerFn } from "@tanstack/react-start";

const GATEWAY_V2 = "https://connector-gateway.lovable.dev/firecrawl/v2";

interface ResolveResult {
  term: string;
  url: string | null;
  title: string | null;
  error?: string;
}

// URL must be a real product-item page on aliexpress.com or aliexpress.us
const ITEM_URL_RE = /^https?:\/\/(?:[a-z0-9-]+\.)?aliexpress\.(?:com|us)\/item\/\d{6,}\.html/i;
// URLs we always reject (wholesale/category/store/sitemap/mobile-i/af landing)
const BAD_URL_RE = /\/(?:w|wholesale|category|store|af|popular|sitemapgz|i)\//i;

// Words we strip from the search term before doing token-overlap matching
const STOPWORDS = new Set([
  "ndv", "luxury", "atelier", "intimates", "shapewear", "bedding", "adornment",
  "sanctuary", "the", "and", "for", "with", "a", "an", "of", "set", "pack",
  "pair", "piece", "pieces", "women", "womens", "ladies", "&",
]);

// Titles containing any of these are almost always mismatches for this catalog
const TITLE_BLACKLIST = /(captcha|sitemap|cosplay|anime|witch|kids|children|baby|toddler|men'?s|male\b|boys|toy)/i;

function normalizeItemUrl(raw: string): string {
  // Strip query string + fragment; force canonical host
  try {
    const u = new URL(raw);
    const m = u.pathname.match(/\/item\/(\d+)\.html/i);
    if (!m) return raw;
    return `https://www.aliexpress.com/item/${m[1]}.html`;
  } catch {
    return raw;
  }
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function titleMatchScore(searchTerm: string, title: string): number {
  const search = tokenize(searchTerm);
  if (!search.length) return 0;
  const t = title.toLowerCase();
  const hits = search.filter((w) => t.includes(w)).length;
  return hits / search.length;
}

function isAcceptable(url: string, title: string, searchTerm: string): boolean {
  if (!ITEM_URL_RE.test(url)) return false;
  if (BAD_URL_RE.test(url)) return false;
  if (!title) return false;
  if (TITLE_BLACKLIST.test(title)) return false;
  return titleMatchScore(searchTerm, title) >= 0.5;
}

async function firecrawlSearch(query: string): Promise<Array<{ url: string; title?: string }>> {
  const LOVABLE = process.env.LOVABLE_API_KEY!;
  const FC = process.env.FIRECRAWL_API_KEY!;
  const res = await fetch(`${GATEWAY_V2}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE}`,
      "X-Connection-Api-Key": FC,
    },
    body: JSON.stringify({ query, limit: 10 }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    data?: { web?: Array<{ url: string; title?: string }>; results?: Array<{ url: string; title?: string }> };
    web?: Array<{ url: string; title?: string }>;
  };
  return json.data?.web ?? json.data?.results ?? json.web ?? [];
}

async function resolveOne(rawTerm: string): Promise<ResolveResult> {
  const term = rawTerm.trim();
  const core = tokenize(term).join(" ");
  // Strict → looser query cascade, but every hit must still pass isAcceptable()
  const queries = [
    `site:aliexpress.com/item "${core}"`,
    `site:aliexpress.com/item ${core}`,
    `site:aliexpress.com ${term}`,
  ];

  const seen = new Set<string>();
  const rejected: string[] = [];
  for (const q of queries) {
    try {
      const results = await firecrawlSearch(q);
      for (const r of results) {
        if (!r?.url || seen.has(r.url)) continue;
        seen.add(r.url);
        const title = (r.title ?? "").trim();
        if (isAcceptable(r.url, title, term)) {
          return { term, url: normalizeItemUrl(r.url), title };
        }
        rejected.push(`${title || "(no title)"} → ${r.url}`);
      }
    } catch (e) {
      return {
        term,
        url: null,
        title: null,
        error: e instanceof Error ? e.message : "Firecrawl error",
      };
    }
  }
  return {
    term,
    url: null,
    title: null,
    error:
      rejected.length > 0
        ? `No strict-match product; rejected ${rejected.length} candidate(s)`
        : "No search hits",
  };
}

export const resolveAliExpressUrls = createServerFn({ method: "POST" })
  .inputValidator((data: { terms: string[] }) => {
    if (!data || !Array.isArray(data.terms)) throw new Error("terms[] required");
    const terms = data.terms.map((t) => String(t || "").trim()).filter(Boolean).slice(0, 50);
    return { terms };
  })
  .handler(async ({ data }): Promise<{ results: ResolveResult[] }> => {
    if (!process.env.LOVABLE_API_KEY || !process.env.FIRECRAWL_API_KEY) {
      throw new Error("Firecrawl connector not configured");
    }
    const results: ResolveResult[] = [];
    for (const term of data.terms) {
      results.push(await resolveOne(term));
    }
    return { results };
  });
