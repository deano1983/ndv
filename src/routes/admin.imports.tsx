import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2, ChevronRight, FileText, AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/imports")({
  head: () => ({
    meta: [
      { title: "DSers Import Runs — NDV Admin" },
      { name: "description", content: "Internal dashboard: history of NDV DSers import runs, row counts, and validation error summaries." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ImportsDashboard,
});

interface RunErrorRow { row: number; handle: string; field: string; code: string; message: string }
type RunStatus = "queued" | "validating" | "complete" | "failed";
interface StatusEvent { status: RunStatus; at: string; note?: string }
interface Run {
  id: string;
  label: string;
  importedAt: string;      // ISO — queued at
  importFileName: string;
  importRowCount: number;
  errorFileName?: string;
  errorRowCount: number;   // rows with ≥1 error
  totalErrors: number;
  validRows: number;
  errorCodes: Record<string, number>;
  errorsSample: RunErrorRow[]; // first 200 rows
  status: RunStatus;
  queuedAt: string;
  validatingAt?: string;
  completedAt?: string;
  failedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  history: StatusEvent[];
}

const STORAGE_KEY = "ndv.admin.imports.runs.v2";

function loadRuns(): Run[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveRuns(runs: Run[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}
function uid() { return Math.random().toString(36).slice(2, 10); }

// Minimal CSV parser (handles quoted fields + escaped quotes)
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.length && r.some(v => v !== ""));
}

function toRecords(rows: string[][]): { header: string[]; records: Record<string, string>[] } {
  if (!rows.length) return { header: [], records: [] };
  const [header, ...body] = rows;
  const records = body.map(r => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
  return { header: header.map(h => h.trim()), records };
}

function ImportsDashboard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setRuns(loadRuns()); }, []);

  const openRun = useMemo(() => runs.find(r => r.id === openId) ?? null, [runs, openId]);


  const handleImport = async (importFile: File, errorFile: File | null) => {
    setBusy(true);
    const id = uid();
    const queuedAt = new Date().toISOString();
    const label = importFile.name.replace(/\.csv$/i, "");

    // 1) Queued
    const initial: Run = {
      id, label, importedAt: queuedAt,
      importFileName: importFile.name,
      importRowCount: 0,
      errorFileName: errorFile?.name,
      errorRowCount: 0, totalErrors: 0, validRows: 0,
      errorCodes: {}, errorsSample: [],
      status: "queued", queuedAt,
      history: [{ status: "queued", at: queuedAt, note: "File accepted" }],
    };
    setRuns(prev => { const next = [initial, ...prev]; saveRuns(next); return next; });
    setOpenId(id);

    const patch = (updater: (r: Run) => Run) => {
      setRuns(prev => {
        const next = prev.map(r => r.id === id ? updater(r) : r);
        saveRuns(next);
        return next;
      });
    };

    try {
      // brief pause so the "queued" state is visible
      await new Promise(res => setTimeout(res, 250));

      // 2) Validating
      const validatingAt = new Date().toISOString();
      patch(r => ({
        ...r,
        status: "validating",
        validatingAt,
        history: [...r.history, { status: "validating", at: validatingAt, note: "Parsing CSV" }],
      }));

      const importText = await importFile.text();
      const importParsed = toRecords(parseCsv(importText));
      const importRowCount = importParsed.records.length;
      if (!importRowCount) throw new Error("Import CSV appears empty.");

      let errorRowCount = 0;
      let totalErrors = 0;
      const errorCodes: Record<string, number> = {};
      const errorsSample: RunErrorRow[] = [];

      if (errorFile) {
        const errText = await errorFile.text();
        const errParsed = toRecords(parseCsv(errText));
        const header = errParsed.header.map(h => h.toLowerCase());
        const col = (name: string) => header.findIndex(h => h === name);
        const idxCode = col("code") >= 0 ? "code" : col("error_code") >= 0 ? "error_code" : "code";
        const idxHandle = col("shopify_handle") >= 0 ? "shopify_handle" : col("handle") >= 0 ? "handle" : "";
        const idxField = col("field") >= 0 ? "field" : col("column") >= 0 ? "column" : "";
        const idxMsg = col("message") >= 0 ? "message" : col("error") >= 0 ? "error" : "";
        const idxRow = col("row") >= 0 ? "row" : "";

        const handlesWithErrors = new Set<string>();
        errParsed.records.forEach((r, i) => {
          const code = r[idxCode] || "UNKNOWN";
          errorCodes[code] = (errorCodes[code] || 0) + 1;
          totalErrors += 1;
          const handle = idxHandle ? (r[idxHandle] || "") : "";
          if (handle) handlesWithErrors.add(handle);
          if (errorsSample.length < 200) {
            errorsSample.push({
              row: Number(idxRow ? r[idxRow] : i + 2) || (i + 2),
              handle,
              field: idxField ? (r[idxField] || "") : "",
              code,
              message: idxMsg ? (r[idxMsg] || "") : "",
            });
          }
        });
        errorRowCount = handlesWithErrors.size || Math.min(totalErrors, importRowCount);
      }

      const validRows = Math.max(0, importRowCount - errorRowCount);

      // 3) Complete
      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(queuedAt).getTime();
      patch(r => ({
        ...r,
        status: "complete",
        completedAt,
        durationMs,
        importRowCount,
        errorRowCount,
        totalErrors,
        validRows,
        errorCodes,
        errorsSample,
        history: [...r.history, { status: "complete", at: completedAt, note: `${importRowCount} rows · ${totalErrors} error${totalErrors === 1 ? "" : "s"}` }],
      }));
      toast.success(`Run complete · ${importRowCount} rows · ${totalErrors} error${totalErrors === 1 ? "" : "s"}`);
    } catch (e) {
      console.error(e);
      const failedAt = new Date().toISOString();
      const msg = e instanceof Error ? e.message : "Failed to parse CSV file.";
      patch(r => ({
        ...r,
        status: "failed",
        failedAt,
        durationMs: new Date(failedAt).getTime() - new Date(queuedAt).getTime(),
        errorMessage: msg,
        history: [...r.history, { status: "failed", at: failedAt, note: msg }],
      }));
      toast.error(msg);
    } finally { setBusy(false); }
  };

  const removeRun = (id: string) => {
    const next = runs.filter(r => r.id !== id);
    setRuns(next); saveRuns(next);
    if (openId === id) setOpenId(null);
    toast.success("Run removed");
  };

  const clearAll = () => {
    if (!confirm("Delete all recorded import runs?")) return;
    setRuns([]); saveRuns([]); setOpenId(null);
  };

  const totals = useMemo(() => ({
    runs: runs.length,
    rows: runs.reduce((s, r) => s + r.importRowCount, 0),
    valid: runs.reduce((s, r) => s + r.validRows, 0),
    errors: runs.reduce((s, r) => s + r.totalErrors, 0),
  }), [runs]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <div className="flex items-baseline justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">NDV · Admin</p>
            <h1 className="font-serif text-3xl mt-1">DSers Import Runs</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              History of DSers import validations. Upload your import CSV (and optional errors CSV) to record a run, then review row counts and error breakdowns.
            </p>
          </div>
          <Link to="/admin/dsers" className="text-sm text-primary underline underline-offset-4">Open Import Wizard →</Link>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Tile label="Runs recorded" value={totals.runs} />
          <Tile label="Total rows" value={totals.rows} />
          <Tile label="Valid rows" value={totals.valid} tone="ok" />
          <Tile label="Total errors" value={totals.errors} tone={totals.errors ? "warn" : "ok"} />
        </div>

        {/* Uploader */}
        <UploadRow onImport={handleImport} busy={busy} />

        {/* Runs table */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl">Recorded runs</h2>
            {runs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
                <Trash2 className="w-4 h-4 mr-1" /> Clear all
              </Button>
            )}
          </div>
          {runs.length === 0 ? (
            <div className="border border-dashed border-border rounded-md p-10 text-center text-sm text-muted-foreground">
              No runs yet. Upload a validated CSV above to record your first run.
            </div>
          ) : (
            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Run</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Rows</th>
                    <th className="text-right p-3">Valid</th>
                    <th className="text-right p-3">Errors</th>
                    <th className="text-left p-3 hidden md:table-cell">Queued</th>
                    <th className="text-left p-3 hidden lg:table-cell">Duration</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map(r => (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/20 cursor-pointer" onClick={() => setOpenId(r.id === openId ? null : r.id)}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{r.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.importFileName}{r.errorFileName ? ` · ${r.errorFileName}` : ""}</div>
                      </td>
                      <td className="p-3"><StatusBadge status={r.status} /></td>
                      <td className="p-3 text-right tabular-nums">{r.importRowCount || "—"}</td>
                      <td className="p-3 text-right tabular-nums text-emerald-600">{r.status === "complete" ? r.validRows : "—"}</td>
                      <td className={`p-3 text-right tabular-nums ${r.totalErrors ? "text-amber-600" : "text-muted-foreground"}`}>{r.status === "complete" || r.status === "failed" ? r.totalErrors : "—"}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">{new Date(r.queuedAt).toLocaleString()}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs tabular-nums">{r.durationMs != null ? formatDuration(r.durationMs) : "—"}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${openId === r.id ? "rotate-90" : ""}`} />
                          <button
                            onClick={(e) => { e.stopPropagation(); removeRun(r.id); }}
                            className="text-muted-foreground hover:text-destructive p-1"
                            aria-label="Remove run"
                          ><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Detail panel */}
        {openRun && (
          <section className="mt-8 border border-border rounded-md p-6 bg-muted/10">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-lg">{openRun.label}</h3>
                <StatusBadge status={openRun.status} />
              </div>
              <span className="text-xs text-muted-foreground">
                Queued {new Date(openRun.queuedAt).toLocaleString()}
                {openRun.durationMs != null && ` · ${formatDuration(openRun.durationMs)}`}
              </span>
            </div>

            {/* Status timeline */}
            <div className="mb-6 border border-border rounded-md bg-background">
              <div className="px-4 py-3 border-b border-border text-xs uppercase tracking-widest text-muted-foreground">Processing timeline</div>
              <ol className="p-4 space-y-2">
                {openRun.history.map((ev, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5"><StatusIcon status={ev.status} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="capitalize font-medium">{ev.status}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{new Date(ev.at).toLocaleTimeString()}</span>
                      </div>
                      {ev.note && <div className="text-xs text-muted-foreground mt-0.5 break-words">{ev.note}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {openRun.status === "failed" && openRun.errorMessage && (
              <div className="mb-6 border border-destructive/40 bg-destructive/10 text-destructive rounded-md p-3 text-sm flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{openRun.errorMessage}</span>
              </div>
            )}


            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Tile label="Import rows" value={openRun.importRowCount} />
              <Tile label="Valid rows" value={openRun.validRows} tone="ok" />
              <Tile label="Error rows" value={openRun.errorRowCount} tone={openRun.errorRowCount ? "warn" : "ok"} />
              <Tile label="Total errors" value={openRun.totalErrors} tone={openRun.totalErrors ? "warn" : "ok"} />
            </div>

            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              {openRun.totalErrors ? <AlertCircle className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              Error summary
            </h4>
            {Object.keys(openRun.errorCodes).length === 0 ? (
              <p className="text-sm text-muted-foreground">No errors recorded for this run.</p>
            ) : (
              <div className="overflow-hidden border border-border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr><th className="text-left p-2">Code</th><th className="text-right p-2">Count</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(openRun.errorCodes)
                      .sort((a, b) => b[1] - a[1])
                      .map(([code, count]) => (
                        <tr key={code} className="border-t border-border">
                          <td className="p-2 font-mono text-xs">{code}</td>
                          <td className="p-2 text-right tabular-nums">{count}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {openRun.errorsSample.length > 0 && (
              <>
                <h4 className="text-sm font-medium mt-6 mb-2">Failing rows (first {openRun.errorsSample.length})</h4>
                <div className="overflow-auto border border-border rounded max-h-96">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground sticky top-0">
                      <tr>
                        <th className="text-left p-2">Row</th>
                        <th className="text-left p-2">Handle</th>
                        <th className="text-left p-2">Field</th>
                        <th className="text-left p-2">Code</th>
                        <th className="text-left p-2">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openRun.errorsSample.map((e, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="p-2 tabular-nums">{e.row}</td>
                          <td className="p-2 font-mono">{e.handle}</td>
                          <td className="p-2 font-mono">{e.field}</td>
                          <td className="p-2 font-mono">{e.code}</td>
                          <td className="p-2 text-muted-foreground">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" }) {
  const color = tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-foreground";
  return (
    <div className="border border-border rounded-md p-4 bg-background">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-2xl font-serif mt-1 tabular-nums ${color}`}>{value.toLocaleString()}</div>
    </div>
  );
}

function UploadRow({ onImport, busy }: { onImport: (importFile: File, errorFile: File | null) => void; busy: boolean }) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [errorFile, setErrorFile] = useState<File | null>(null);

  return (
    <div className="border border-border rounded-md p-5">
      <h2 className="font-serif text-lg mb-1">Record a new run</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Upload the DSers import CSV to record row counts. Optionally add the matching validation errors CSV to include an error summary.
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        <FilePick label="Import CSV (required)" file={importFile} onFile={setImportFile} />
        <FilePick label="Errors CSV (optional)" file={errorFile} onFile={setErrorFile} />
      </div>
      <div className="flex items-center justify-end gap-2 mt-4">
        <Button
          disabled={!importFile || busy}
          onClick={() => importFile && onImport(importFile, errorFile)}
        >
          <Upload className="w-4 h-4 mr-2" />
          {busy ? "Recording…" : "Record run"}
        </Button>
      </div>
    </div>
  );
}

function FilePick({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File | null) => void }) {
  return (
    <label className="block cursor-pointer">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1 border border-dashed border-border rounded-md p-3 text-sm hover:bg-muted/20 transition-colors">
        {file ? <span>{file.name} <span className="text-muted-foreground">· {(file.size / 1024).toFixed(1)} KB</span></span> : <span className="text-muted-foreground">Click to select…</span>}
      </div>
      <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </label>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(s < 10 ? 2 : 1)} s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s - m * 60);
  return `${m}m ${rem}s`;
}

function StatusIcon({ status }: { status: RunStatus }) {
  if (status === "queued") return <Clock className="w-4 h-4 text-muted-foreground" />;
  if (status === "validating") return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
  if (status === "complete") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  return <XCircle className="w-4 h-4 text-destructive" />;
}

function StatusBadge({ status }: { status: RunStatus }) {
  const styles: Record<RunStatus, string> = {
    queued: "bg-muted text-muted-foreground border-border",
    validating: "bg-primary/10 text-primary border-primary/30",
    complete: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
    failed: "bg-destructive/10 text-destructive border-destructive/40",
  };
  const label: Record<RunStatus, string> = {
    queued: "Queued",
    validating: "Validating",
    complete: "Complete",
    failed: "Failed",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${styles[status]}`}>
      <StatusIcon status={status} />
      {label[status]}
    </span>
  );
}
