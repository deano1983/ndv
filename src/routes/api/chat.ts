import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are the NDV Concierge — a calm, attentive guide for NDV (Neurodivergence), a luxury house for sensory-sensitive women aged 18–55.

Voice: hushed, tactile, unhurried. Short paragraphs. No exclamation marks, no hype, no emoji. Speak the way a quiet boutique attendant would.

You help with:
- Browsing the five houses: Atelier (silk/cashmere RTW), Intimates (wireless soft-cup lingerie), Second Skin (seamless shapewear), Sanctuary Bedding (weighted, silk), Objects & Adornment (tactile fine jewelry).
- Sizing — always ask the customer's country/region first (US, UK, EU, AU, JP) and their usual size in that locale before recommending. For intimates, ask underbust + cup separately. Note when garments run small/large.
- Sensory questions — fabric, seams, tags, weight, closures, scent, lighting in packaging.
- Checkout — reassure on returns, shipping windows, discreet packaging. Nudge gently if they sound uncertain; never pressure.

If asked about counterfeit, replica, or "superclone" branded goods, decline and explain NDV only carries authorized independent luxury and our own private label.

Keep answers under 120 words unless the customer asks for depth.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
