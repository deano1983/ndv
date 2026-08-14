import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CartDrawer } from "./CartDrawer";
import { CATEGORIES } from "@/lib/shopify";
import { LOCALES, getStoredLocale, setStoredLocale, type Locale } from "@/lib/sizing";

export function Header() {
  const [loc, setLoc] = useState<Locale>("US");
  useEffect(() => { setLoc(getStoredLocale()); }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b hairline">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-2xl gold-grad tracking-tight">NDV</span>
          <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Neurodivergence</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {CATEGORIES.map(c => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="hover:text-primary transition-colors">
              {c.title}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <select
            value={loc}
            onChange={e => { const v = e.target.value as Locale; setLoc(v); setStoredLocale(v); }}
            className="bg-transparent text-xs uppercase tracking-[0.18em] text-muted-foreground border hairline rounded-sm px-2 py-1.5 hover:text-primary focus:outline-none"
            aria-label="Region"
          >
            {LOCALES.map(l => <option key={l.code} value={l.code} className="bg-background">{l.code}</option>)}
          </select>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
