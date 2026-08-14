import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Loader2 } from "lucide-react";

const transport = new DefaultChatTransport({ api: "/api/chat" });

export function Concierge() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition" aria-label="Open concierge">
          <Sparkles className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-background">
        <SheetHeader className="flex-shrink-0 border-b hairline pb-4">
          <SheetTitle className="font-display text-2xl gold-grad">The Concierge</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">Sizing, fabrics, sensory questions, checkout — quietly.</SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground space-y-3">
              <p>Welcome. I can help you choose a size, explain a fabric, or walk you through checkout.</p>
              <div className="flex flex-col gap-2">
                {["Help me find my size", "What fabrics are sensory-friendly?", "Is shipping discreet?"].map(p => (
                  <button key={p} onClick={() => sendMessage({ text: p })} className="text-left px-3 py-2 border hairline rounded-sm hover:border-primary transition text-xs">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map(m => {
            const text = m.parts.map(p => (p.type === "text" ? p.text : "")).join("");
            return (
              <div key={m.id} className={`text-sm leading-relaxed ${m.role === "user" ? "text-foreground" : "text-muted-foreground"}`}>
                <p className="text-[10px] uppercase tracking-[0.2em] mb-1 text-primary">{m.role === "user" ? "You" : "Concierge"}</p>
                <p className="whitespace-pre-wrap">{text}</p>
              </div>
            );
          })}
          {busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>

        <form onSubmit={send} className="flex-shrink-0 border-t hairline pt-4 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask quietly…" disabled={busy} className="flex-1 bg-secondary px-3 py-2 text-sm rounded-sm border hairline focus:border-primary outline-none" />
          <Button type="submit" disabled={busy || !input.trim()} size="icon" className="rounded-sm bg-primary text-primary-foreground"><Send className="h-4 w-4" /></Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
