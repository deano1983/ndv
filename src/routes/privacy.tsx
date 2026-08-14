import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// TODO before store submission: replace bracketed placeholders below
// (legal entity name, contact email, effective date).
export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — NDV · Neurodivergence" },
      { name: "description", content: "How NDV collects, uses, and protects your data. Quiet, plain-language privacy for the sensitive woman." },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground space-y-3">{children}</div>
    </section>
  );
}

function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-20 space-y-12">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">NDV · Neurodivergence</p>
          <h1 className="font-display text-4xl md:text-5xl">Privacy, in plain language</h1>
          <p className="text-sm text-muted-foreground">
            Effective date: <span className="text-foreground">[EFFECTIVE DATE]</span> ·
            Controller: <span className="text-foreground">[LEGAL ENTITY NAME]</span> ·
            Contact: <span className="text-foreground">[privacy@your-domain.com]</span>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You are sensitive; your data is treated the same way. This policy explains what we
            collect, why, and what we will never do. No legalese where plain words will do.
          </p>
        </header>

        <Section title="What we collect">
          <p><strong className="text-foreground">If you browse only:</strong> nothing that identifies you. Pages are served without advertising trackers.</p>
          <p><strong className="text-foreground">If you create an account:</strong> your email address and (optionally) your name, processed by Supabase (our authentication provider).</p>
          <p><strong className="text-foreground">If you buy:</strong> checkout is completed on Shopify&apos;s secure checkout. Shopify processes your contact, shipping, and payment details as our commerce processor. We never see or store your full card number.</p>
          <p><strong className="text-foreground">Your cart:</strong> items and quantities are kept in your device&apos;s local storage and in your Shopify cart so they follow you quietly between visits.</p>
        </Section>

        <Section title="What we never do">
          <p>We do not sell your data. We do not run third-party advertising. We do not use cross-site tracking, fingerprinting, countdown-pressure analytics, or dark-pattern telemetry. There are no ad networks in this app.</p>
        </Section>

        <Section title="Third-party processors">
          <p>Shopify — catalog, cart, checkout, order processing (privacy: shopify.com/legal/privacy).</p>
          <p>Supabase — account authentication (privacy: supabase.com/privacy).</p>
          <p>Google Fonts — typeface delivery (receives your IP to serve font files).</p>
          <p>App distribution — Google Play / Apple App Store may collect their own crash and install diagnostics under their own policies.</p>
        </Section>

        <Section title="Your rights">
          <p>Wherever you live, you may ask us to access, correct, export, or delete your personal data (GDPR, UK GDPR, CCPA/CPRA and similar frameworks are honored). Email <span className="text-foreground">[privacy@your-domain.com]</span> and we will respond within 30 days. Account deletion removes your authentication record; order records are retained only as long as tax and consumer law requires.</p>
        </Section>

        <Section title="Security & retention">
          <p>Traffic is encrypted in transit (TLS). We retain account data until you delete your account, and order data for the period required by law. Cart data on your device can be cleared at any time by clearing the app/browser storage.</p>
        </Section>

        <Section title="Changes">
          <p>If this policy changes, the effective date above moves and the current version always lives at this URL. Material changes are announced in-app before they apply.</p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
