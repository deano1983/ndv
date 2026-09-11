// Native-app-shell build config (Capacitor). Builds the app as a static SPA:
// no Nitro server, no server routes. The storefront runs fully client-side
// against the local catalog. Server-only features (Concierge /api/chat,
// MCP endpoints, admin import tools) are disabled in this build via
// VITE_APP_SHELL=true (see .env.appshell and src/routes/__root.tsx).
//
// STANDALONE: vanilla Vite config (Lovable wrapper removed).
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      spa: {
        enabled: true,
        prerender: { enabled: true, crawlLinks: false },
      },
    }),
    viteReact(),
  ],
});
