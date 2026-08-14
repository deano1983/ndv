import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Ruler } from "lucide-react";
import { APPAREL_SIZES, BAND_SIZES, CUP_SIZES, LOCALES, type Locale } from "@/lib/sizing";

export function SizeGuide({ kind = "apparel" }: { kind?: "apparel" | "intimates" }) {
  const [loc, setLoc] = useState<Locale>("US");
  const sizes = kind === "apparel" ? APPAREL_SIZES : BAND_SIZES;

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition">
        <Ruler className="h-3 w-3" /> Size guide
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-background border hairline">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Sizing — {kind === "apparel" ? "Atelier & Second Skin" : "Intimates"}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select your country. Where you sit between two sizes, the concierge can advise.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mt-2">
          {LOCALES.map(l => (
            <button key={l.code} onClick={() => setLoc(l.code)} className={`px-3 py-1.5 text-xs uppercase tracking-[0.15em] border rounded-sm transition ${loc === l.code ? "border-primary text-primary" : "hairline text-muted-foreground"}`}>
              {l.code}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          {kind === "apparel" ? (
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <th className="text-left py-2">{loc}</th>
                {LOCALES.filter(l => l.code !== loc).map(l => <th key={l.code} className="text-left py-2">{l.code}</th>)}
              </tr></thead>
              <tbody>
                {sizes[loc].map((_, i) => (
                  <tr key={i} className="border-t hairline">
                    <td className="py-2 font-medium">{sizes[loc][i]}</td>
                    {LOCALES.filter(l => l.code !== loc).map(l => <td key={l.code} className="py-2 text-muted-foreground">{sizes[l.code][i] ?? "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Band ({loc})</p>
                <div className="flex flex-wrap gap-2">
                  {BAND_SIZES[loc].map(b => <span key={b} className="px-3 py-1 border hairline text-sm">{b}</span>)}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Cup</p>
                <div className="flex flex-wrap gap-2">
                  {CUP_SIZES.map(c => <span key={c} className="px-3 py-1 border hairline text-sm">{c}</span>)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">All NDV intimates are wireless soft-cup. If between bands, size down; if between cups, size up.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
