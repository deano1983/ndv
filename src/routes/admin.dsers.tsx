import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/shopify";
import { toast } from "sonner";
import { Copy, Download, FileDown, Plus, Trash2, Upload, AlertCircle, Wand2, Loader2, ExternalLink } from "lucide-react";
import { resolveAliExpressUrls } from "@/lib/aliexpress-resolver.functions";

export const Route = createFileRoute("/admin/dsers")({
  head: () => ({
    meta: [
      { title: "DSers Import Wizard — NDV" },
      { name: "description", content: "Internal tool: map AliExpress SKUs to NDV houses for DSers push-to-Shopify." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DsersWizard,
});

type House = (typeof CATEGORIES)[number]["slug"];

interface Row {
  id: string;
  input: string;      // AliExpress URL or search term
  title: string;      // Suggested NDV product title
  house: House;
  retail: number;
  notes: string;
}

const DEFAULT_RETAIL: Record<House, number> = {
  atelier: 480, intimates: 180, shapewear: 220, bedding: 320, adornment: 260,
};

function isUrl(s: string) { return /^https?:\/\//i.test(s.trim()); }
function uid() { return Math.random().toString(36).slice(2, 9); }

function csvEscape(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(rows: Row[]) {
  const headers = [
    "DSers Product Name","Shopify Handle","House","Category Tag","Vendor","Product Type",
    "Retail Price (AUD)","Target Cost (≤40%)","AliExpress URL","AliExpress Search Term",
    "Shipping ETA","Notes",
  ];
  const body = rows.map((r, i) => {
    const house = CATEGORIES.find(c => c.slug === r.house)!;
    const handle = `ndv-${r.house}-${String(i + 1).padStart(2, "0")}`;
    const url = isUrl(r.input) ? r.input : "";
    const term = isUrl(r.input) ? "" : r.input;
    return [
      `NDV ${r.title || "Untitled"}`, handle, house.title, r.house, "NDV", house.title,
      r.retail, (r.retail * 0.4).toFixed(2), url, term, "7-14 days", r.notes,
    ].map(csvEscape).join(",");
  });
  return [headers.join(","), ...body].join("\n");
}

function buildDsersUrlCsv(rows: Row[]) {
  const withUrls = rows.filter(r => isUrl(r.input));
  const headers = ["product_url", "shopify_handle", "vendor", "product_type", "tags"];
  const body = withUrls.map((r, i) => {
    const house = CATEGORIES.find(c => c.slug === r.house)!;
    const handle = `ndv-${r.house}-${String(i + 1).padStart(2, "0")}`;
    return [r.input, handle, "NDV", house.title, r.house].map(csvEscape).join(",");
  });
  return {
    csv: [headers.join(","), ...body].join("\n"),
    count: withUrls.length,
    skipped: rows.length - withUrls.length,
  };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur = "", row: string[] = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); rows.push(row); row = []; cur = "";
      } else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim().length));
}

const TEMPLATE_HEADERS = ["input", "title", "house", "retail", "notes"] as const;
const INPUT_ALIASES = ["input", "url", "search", "search term", "search_term"];
const HOUSE_ALIASES = ["house", "category", "tag"];
const RETAIL_ALIASES = ["retail", "price"];
const ALL_KNOWN_HEADERS = [...INPUT_ALIASES, ...HOUSE_ALIASES, ...RETAIL_ALIASES, "title", "notes"];

function buildTemplateCsv() {
  const sample = [
    ["https://www.aliexpress.com/item/1005006123456789.html", "Silk Slip Dress", "atelier", "480", "Ivory, S-XL"],
    ["seamless bonded shapewear bodysuit", "Second Skin Bodysuit", "shapewear", "220", "Nude + Noir"],
    ["weighted silk duvet queen", "Sanctuary Weighted Duvet", "bedding", "620", "Queen only"],
  ];
  return [TEMPLATE_HEADERS.join(","), ...sample.map(r => r.map(csvEscape).join(","))].join("\n");
}

interface CsvValidation {
  ok: boolean;
  errors: string[];
  warnings: string[];
  rows: Row[];
}

function validateCsv(text: string, fallbackHouse: House): CsvValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsed = parseCsv(text);
  if (!parsed.length) return { ok: false, errors: ["File is empty."], warnings, rows: [] };

  const header = parsed[0].map(h => h.trim().toLowerCase());
  const looksHeader = header.some(h => ALL_KNOWN_HEADERS.includes(h));
  if (!looksHeader) {
    errors.push(`Missing header row. First row must include: ${TEMPLATE_HEADERS.join(", ")}. Download the template below.`);
    return { ok: false, errors, warnings, rows: [] };
  }

  const hasInput = INPUT_ALIASES.some(a => header.includes(a));
  if (!hasInput) errors.push(`Required column missing: "input" (accepted aliases: ${INPUT_ALIASES.join(", ")}).`);

  const unknown = header.filter(h => h && !ALL_KNOWN_HEADERS.includes(h));
  if (unknown.length) warnings.push(`Unknown columns ignored: ${unknown.join(", ")}.`);

  const dataRows = parsed.slice(1);
  if (!dataRows.length) errors.push("No data rows found under the header.");
  if (errors.length) return { ok: false, errors, warnings, rows: [] };

  const col = (name: string) => header.indexOf(name);
  const pickIdx = (aliases: string[]) => {
    for (const a of aliases) { const i = col(a); if (i >= 0) return i; }
    return -1;
  };
  const iInput = pickIdx(INPUT_ALIASES);
  const iTitle = col("title");
  const iHouse = pickIdx(HOUSE_ALIASES);
  const iRetail = pickIdx(RETAIL_ALIASES);
  const iNotes = col("notes");

  const validHouses = CATEGORIES.map(c => c.slug) as House[];
  const norm = (s: string): House | null => {
    const v = s.trim().toLowerCase();
    if (!v) return null;
    return validHouses.find(h => h === v)
      || validHouses.find(h => CATEGORIES.find(c => c.slug === h)?.title.toLowerCase() === v)
      || null;
  };

  const rows: Row[] = [];
  dataRows.forEach((r, idx) => {
    const rowNum = idx + 2;
    const input = (r[iInput] || "").trim();
    if (!input) { warnings.push(`Row ${rowNum}: blank input — skipped.`); return; }
    const title = (iTitle >= 0 ? r[iTitle] : "").trim();
    let house: House = fallbackHouse;
    if (iHouse >= 0 && r[iHouse]?.trim()) {
      const n = norm(r[iHouse]);
      if (!n) warnings.push(`Row ${rowNum}: unknown house "${r[iHouse]}" — using ${fallbackHouse}.`);
      else house = n;
    }
    let retail = DEFAULT_RETAIL[house];
    if (iRetail >= 0 && r[iRetail]?.trim()) {
      const n = Number(String(r[iRetail]).replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(n) || n <= 0) warnings.push(`Row ${rowNum}: invalid retail "${r[iRetail]}" — using ${retail}.`);
      else retail = n;
    }
    const notes = (iNotes >= 0 ? r[iNotes] : "").trim();
    rows.push({ id: uid(), input, title, house, retail, notes });
  });

  return { ok: rows.length > 0, errors: rows.length ? [] : ["No valid rows to import."], warnings, rows };
}




function DsersWizard() {
  const [rows, setRows] = useState<Row[]>([
    { id: uid(), input: "", title: "", house: "atelier", retail: DEFAULT_RETAIL.atelier, notes: "" },
  ]);
  const [bulk, setBulk] = useState("");
  const [bulkHouse, setBulkHouse] = useState<House>("atelier");

  const totals = useMemo(() => ({
    count: rows.length,
    retail: rows.reduce((s, r) => s + (Number(r.retail) || 0), 0),
    cost: rows.reduce((s, r) => s + (Number(r.retail) || 0) * 0.4, 0),
  }), [rows]);

  const update = (id: string, patch: Partial<Row>) =>
    setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => setRows(rs => rs.filter(r => r.id !== id));
  const add = () => setRows(rs => [...rs, { id: uid(), input: "", title: "", house: "atelier", retail: DEFAULT_RETAIL.atelier, notes: "" }]);

  const importBulk = () => {
    const lines = bulk.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const added: Row[] = lines.map(l => ({
      id: uid(), input: l, title: "", house: bulkHouse, retail: DEFAULT_RETAIL[bulkHouse], notes: "",
    }));
    setRows(rs => [...rs, ...added]);
    setBulk("");
    toast.success(`Added ${added.length} row${added.length === 1 ? "" : "s"}`);
  };

  const [lastValidation, setLastValidation] = useState<CsvValidation | null>(null);

  const importCsvFile = async (file: File, replace: boolean) => {
    if (!/\.csv$/i.test(file.name) && file.type && !file.type.includes("csv")) {
      const v: CsvValidation = { ok: false, errors: [`"${file.name}" isn't a .csv file. Export as CSV (UTF-8) and try again.`], warnings: [], rows: [] };
      setLastValidation(v);
      toast.error("Wrong file type — CSV required");
      return;
    }
    const text = await file.text();
    const v = validateCsv(text, bulkHouse);
    setLastValidation(v);
    if (!v.ok) { toast.error(v.errors[0] || "CSV failed validation"); return; }
    setRows(rs => replace ? v.rows : [...rs, ...v.rows]);
    const msg = `${replace ? "Loaded" : "Added"} ${v.rows.length} row${v.rows.length === 1 ? "" : "s"}` + (v.warnings.length ? ` · ${v.warnings.length} warning${v.warnings.length === 1 ? "" : "s"}` : "");
    v.warnings.length ? toast.warning(msg) : toast.success(msg);
  };

  const onCsvInput = (e: React.ChangeEvent<HTMLInputElement>, replace: boolean) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) importCsvFile(f, replace);
  };

  const downloadTemplate = () => {
    const blob = new Blob([buildTemplateCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ndv-dsers-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const [resolving, setResolving] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; ok: number; fail: number; elapsedMs: number } | null>(null);
  const [failedIds, setFailedIds] = useState<string[]>([]);

  const runResolve = async (targets: Row[]) => {
    if (!targets.length) { toast.error("No search-term rows to resolve"); return; }
    setResolving(true);
    const started = Date.now();
    const total = targets.length;
    setProgress({ done: 0, total, ok: 0, fail: 0, elapsedMs: 0 });
    const timer = setInterval(() => {
      setProgress(p => p ? { ...p, elapsedMs: Date.now() - started } : p);
    }, 250);
    let ok = 0, fail = 0;
    const newFailed: string[] = [];
    try {
      const CHUNK = 5;
      for (let i = 0; i < targets.length; i += CHUNK) {
        const chunk = targets.slice(i, i + CHUNK);
        const { results } = await resolveAliExpressUrls({ data: { terms: chunk.map(r => r.input.trim()) } });
        const byTerm = new Map(results.map(r => [r.term, r]));
        for (const t of chunk) {
          const hit = byTerm.get(t.input.trim());
          if (hit?.url) {
            ok++;
            const url = hit.url; const title = hit.title;
            setRows(rs => rs.map(r => r.id === t.id ? { ...r, input: url, title: r.title || (title ?? "").slice(0, 80) } : r));
          } else {
            fail++;
            newFailed.push(t.id);
          }
        }
        setProgress(p => p ? { ...p, done: Math.min(i + chunk.length, total), ok, fail, elapsedMs: Date.now() - started } : p);
      }
      setFailedIds(newFailed);
      if (ok) toast.success(`Resolved ${ok} URL${ok === 1 ? "" : "s"}${fail ? ` · ${fail} unresolved` : ""} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
      else toast.error(`No URLs resolved (${fail} failed)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Resolver failed");
    } finally {
      clearInterval(timer);
      setProgress(p => p ? { ...p, elapsedMs: Date.now() - started } : p);
      setResolving(false);
    }
  };

  const resolveUrls = () => runResolve(rows.filter(r => r.input.trim() && !isUrl(r.input)));

  const retryFailed = () => {
    const set = new Set(failedIds);
    const targets = rows.filter(r => set.has(r.id) && r.input.trim() && !isUrl(r.input));
    if (!targets.length) { toast.error("No failed rows to retry"); return; }
    runResolve(targets);
  };





  const copyRow = async (r: Row, index: number) => {
    const house = CATEGORIES.find(c => c.slug === r.house)!;
    const block = [
      `Title: NDV ${r.title || "Untitled"}`,
      `Vendor: NDV`,
      `Product type: ${house.title}`,
      `Tags: ${r.house}`,
      `Handle: ndv-${r.house}-${String(index + 1).padStart(2, "0")}`,
      `Retail: ${r.retail} AUD`,
      `Target cost (≤40%): ${(r.retail * 0.4).toFixed(2)} AUD`,
      `Metafield custom.shipping_eta: 7-14 days`,
      isUrl(r.input) ? `Metafield custom.supplier_url: ${r.input}` : `Search term: ${r.input}`,
    ].join("\n");
    await navigator.clipboard.writeText(block);
    toast.success("DSers push fields copied");
  };

  const downloadCsv = () => {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ndv-dsers-mapping-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDsersUrlCsv = () => {
    const { csv, count, skipped } = buildDsersUrlCsv(rows);
    if (!count) { toast.error("No AliExpress URLs found — add product URLs first"); return; }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ndv-dsers-urls-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${count} URL${count === 1 ? "" : "s"}${skipped ? ` · ${skipped} search-term row${skipped === 1 ? "" : "s"} skipped` : ""}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Internal · Not indexed</p>
          <h1 className="font-display text-4xl md:text-5xl mt-2">DSers Import Wizard</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            Paste AliExpress URLs or search terms, assign each to an NDV house, and copy the exact fields to enter in DSers' "Push to Shopify" panel. Export a CSV to keep alongside your DSers mapping.
          </p>
        </div>

        {/* Bulk paste */}
        <section className="border hairline rounded-sm p-5 mb-8 bg-secondary/30">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Bulk paste — one URL or search term per line</p>
          <textarea
            value={bulk} onChange={e => setBulk(e.target.value)} rows={4}
            placeholder={"https://aliexpress.com/item/…\nsilk slip dress luxury\n…"}
            className="w-full bg-background border hairline rounded-sm p-3 text-sm font-mono focus:outline-none focus:border-primary"
          />
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">House</label>
            <select value={bulkHouse} onChange={e => setBulkHouse(e.target.value as House)}
              className="bg-background border hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary">
              {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
            <Button onClick={importBulk} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm">
              <Plus className="w-3 h-3 mr-1" /> Add rows
            </Button>
          </div>
        </section>

        {/* CSV upload */}
        <section className="border hairline rounded-sm p-5 mb-8 bg-secondary/30">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Upload CSV — auto-populate rows</p>
          <p className="text-xs text-muted-foreground mb-3">
            Required header: <code className="text-primary">input</code> (aliases: <code className="text-primary">url</code>, <code className="text-primary">search_term</code>). Optional: <code className="text-primary">title</code>, <code className="text-primary">house</code>, <code className="text-primary">retail</code>, <code className="text-primary">notes</code>. Valid house values: {CATEGORIES.map(c => c.slug).join(", ")}. Missing house falls back to the selection above.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={downloadTemplate} type="button"
              className="inline-flex items-center gap-2 px-3 py-2 border hairline rounded-sm text-sm hover:border-primary hover:text-primary transition">
              <FileDown className="w-3 h-3" /> Download template CSV
            </button>
            <label className="inline-flex items-center gap-2 px-3 py-2 border hairline rounded-sm text-sm cursor-pointer hover:border-primary hover:text-primary transition">
              <Upload className="w-3 h-3" /> Append from CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => onCsvInput(e, false)} />
            </label>
            <label className="inline-flex items-center gap-2 px-3 py-2 border hairline rounded-sm text-sm cursor-pointer hover:border-primary hover:text-primary transition">
              <Upload className="w-3 h-3" /> Replace with CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => onCsvInput(e, true)} />
            </label>
          </div>

          {lastValidation && (lastValidation.errors.length > 0 || lastValidation.warnings.length > 0) && (
            <div className={`mt-4 border hairline rounded-sm p-3 text-xs ${lastValidation.errors.length ? "border-destructive/60 text-destructive" : "text-muted-foreground"}`}>
              <div className="flex items-center gap-2 mb-2 uppercase tracking-[0.2em]">
                <AlertCircle className="w-3 h-3" />
                {lastValidation.errors.length ? "Validation failed" : `Imported with ${lastValidation.warnings.length} warning${lastValidation.warnings.length === 1 ? "" : "s"}`}
              </div>
              {lastValidation.errors.length > 0 && (
                <ul className="list-disc pl-5 space-y-0.5">
                  {lastValidation.errors.map((e, i) => <li key={`e${i}`}>{e}</li>)}
                </ul>
              )}
              {lastValidation.warnings.length > 0 && (
                <ul className="list-disc pl-5 space-y-0.5 mt-2 text-muted-foreground">
                  {lastValidation.warnings.slice(0, 20).map((w, i) => <li key={`w${i}`}>{w}</li>)}
                  {lastValidation.warnings.length > 20 && <li>…and {lastValidation.warnings.length - 20} more.</li>}
                </ul>
              )}
            </div>
          )}
        </section>



        {/* Rows */}
        <div className="space-y-3">
          {rows.map((r, i) => {
            const cost = (Number(r.retail) || 0) * 0.4;
            return (
              <div key={r.id} className="border hairline rounded-sm p-4 grid grid-cols-12 gap-3 items-start">
                <div className="col-span-12 md:col-span-4">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">URL or search term</label>
                  <input value={r.input} onChange={e => update(r.id, { input: e.target.value })}
                    className="w-full mt-1 bg-background border hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  {r.input && <p className="text-[10px] text-muted-foreground mt-1">{isUrl(r.input) ? "→ supplier URL" : "→ search term"}</p>}
                </div>
                <div className="col-span-12 md:col-span-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">NDV title</label>
                  <input value={r.title} onChange={e => update(r.id, { title: e.target.value })} placeholder="Silk Slip Dress"
                    className="w-full mt-1 bg-background border hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">House</label>
                  <select value={r.house}
                    onChange={e => { const h = e.target.value as House; update(r.id, { house: h, retail: DEFAULT_RETAIL[h] }); }}
                    className="w-full mt-1 bg-background border hairline rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-primary">
                    {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
                  </select>
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Retail AUD</label>
                  <input type="number" min={0} value={r.retail}
                    onChange={e => update(r.id, { retail: Number(e.target.value) })}
                    className="w-full mt-1 bg-background border hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  <p className="text-[10px] text-muted-foreground mt-1">Cost ≤ {cost.toFixed(2)}</p>
                </div>
                <div className="col-span-12 md:col-span-1 flex md:flex-col gap-2 md:pt-5 md:items-end justify-end">
                  <button onClick={() => copyRow(r, i)} title="Copy DSers fields"
                    className="p-2 border hairline rounded-sm hover:text-primary hover:border-primary transition">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(r.id)} title="Remove"
                    className="p-2 border hairline rounded-sm hover:text-destructive hover:border-destructive transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={add} className="rounded-sm">
            <Plus className="w-3 h-3 mr-1" /> Add row
          </Button>
          <Button variant="outline" onClick={resolveUrls} disabled={resolving} className="rounded-sm" title="Use Firecrawl to find the top AliExpress product URL for each search-term row">
            {resolving ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Wand2 className="w-3 h-3 mr-2" />}
            {resolving ? "Resolving…" : "Resolve URLs (Firecrawl)"}
          </Button>
          <Button
            variant="outline"
            onClick={retryFailed}
            disabled={resolving || failedIds.length === 0}
            className="rounded-sm"
            title="Retry only the rows that failed to resolve in the last run"
          >
            {resolving ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Wand2 className="w-3 h-3 mr-2" />}
            Retry failed{failedIds.length ? ` (${failedIds.length})` : ""}
          </Button>
          <a
            href="https://docs.firecrawl.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 border hairline rounded-sm text-sm hover:border-primary hover:text-primary transition"
          >
            <ExternalLink className="w-3 h-3" /> Firecrawl docs
          </a>
          <Button onClick={downloadCsv} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm">
            <Download className="w-3 h-3 mr-2" /> Export mapping CSV
          </Button>
          <Button variant="outline" onClick={downloadDsersUrlCsv} className="rounded-sm">
            <Download className="w-3 h-3 mr-2" /> Export DSers URL CSV
          </Button>
          <div className="text-xs text-muted-foreground ml-auto">
            {totals.count} rows · Retail {totals.retail.toFixed(0)} AUD · Max landed cost {totals.cost.toFixed(0)} AUD
          </div>
        </div>

        {progress && (
          <div className="mt-4 border hairline rounded-sm p-3 bg-secondary/30">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <span>Firecrawl resolver {resolving ? "· running" : "· complete"}</span>
              <span>
                {progress.done}/{progress.total} · {(progress.elapsedMs / 1000).toFixed(1)}s
                {progress.done > 0 && resolving && ` · ~${(((progress.elapsedMs / progress.done) * (progress.total - progress.done)) / 1000).toFixed(0)}s left`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-background border hairline rounded-sm overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground flex gap-4">
              <span>✓ {progress.ok} resolved</span>
              <span>✗ {progress.fail} failed</span>
              <span className="ml-auto">{progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%</span>
            </div>
          </div>
        )}

        {/* Guide */}
        <section className="mt-12 border hairline rounded-sm p-6 bg-secondary/30">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">DSers Push-to-Shopify checklist</p>
          <ol className="text-sm space-y-2 list-decimal pl-5 text-muted-foreground">
            <li>In DSers → Import List, paste the AliExpress URL from a row here.</li>
            <li>Click the row's copy icon and paste the block into DSers' edit panel (Title, Vendor, Type, Tags).</li>
            <li>Confirm cost ≤ 40% of retail before pushing to Shopify.</li>
            <li>After push, open the product in Shopify Admin and set metafields <code className="text-primary">custom.shipping_eta</code>, <code className="text-primary">custom.supplier_url</code>, <code className="text-primary">custom.cost</code>.</li>
            <li>The storefront will surface the product under its house automatically once the category tag matches.</li>
          </ol>
        </section>
      </div>
      <Footer />
    </div>
  );
}
