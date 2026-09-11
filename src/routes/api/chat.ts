import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

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

        // STANDALONE: any OpenAI-compatible endpoint (OpenAI, OpenRouter, Groq, ...)
        // via env vars. No Lovable gateway.
        const key = process.env.OPENAI_API_KEY;
        if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

        const provider = createOpenAICompatible({
          name: process.env.OPENAI_PROVIDER_NAME ?? "openai",
          baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
          apiKey: key,
        });
        const result = streamText({
          model: provider(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
