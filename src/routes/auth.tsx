import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNext(s.next) }),
  head: () => ({
    meta: [
      { title: "Sign in · NDV" },
      {
        name: "description",
        content: "Sign in to your NDV account to manage connections and authorized integrations.",
      },
      { property: "og:title", content: "Sign in · NDV" },
      { property: "og:description", content: "Sign in to your NDV account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = next;
    });
  }, [next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + next },
      });
      setBusy(false);
      if (error) return setError(error.message);
      setNotice("Check your inbox to confirm your address, then return here.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    if (next.startsWith("/.lovable/")) window.location.href = next;
    else void navigate({ to: next });
  }

  async function onGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + next,
    });
    if (result.error) return setError(String(result.error));
    if (result.redirected) return;
    window.location.href = next;
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl tracking-[0.2em] uppercase">NDV</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to continue." : "Create an account to continue."}
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <Button type="button" variant="outline" onClick={onGoogle} className="w-full">
        Continue with Google
      </Button>

      <button
        type="button"
        className="text-sm text-muted-foreground underline underline-offset-4"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setNotice(null);
        }}
      >
        {mode === "signin" ? "Need an account? Register" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
