// Native-app-shell build config (Capacitor). Builds the app as a static SPA:
// no Nitro server, no server routes. The storefront runs fully client-side
// against the Shopify Storefront API. Server-only features (Concierge /api/chat,
// MCP endpoints, admin import tools) are disabled in this build via
// VITE_APP_SHELL=true (see .env.appshell and src/routes/__root.tsx).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: { enabled: true, crawlLinks: false },
    },
  },
});
