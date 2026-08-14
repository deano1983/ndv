export function Footer() {
  return (
    <footer className="border-t hairline mt-32">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10 text-sm">
        <div>
          <p className="font-display text-2xl gold-grad mb-2">NDV</p>
          <p className="text-muted-foreground max-w-xs">Luxury for the sensitive woman. A sanctuary of objects engineered to soften the noise of the world.</p>
        </div>
        <div>
          <p className="uppercase tracking-[0.2em] text-xs text-muted-foreground mb-3">Sourcing</p>
          <p className="text-muted-foreground">Curated globally via AliTrade and Made-in-China partners. Vetted for craft, tactility, and sensory care.</p>
        </div>
        <div>
          <p className="uppercase tracking-[0.2em] text-xs text-muted-foreground mb-3">Contact</p>
          <p className="text-muted-foreground">concierge@ndv.co</p>
        </div>
      </div>
      <div className="border-t hairline py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} NDV · Neurodivergence · All rights reserved.</div>
    </footer>
  );
}
