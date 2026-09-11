// STANDALONE (detached from Lovable): vanilla Vite + TanStack Start config.
// Replaces @lovable.dev/vite-tanstack-config (which bundled the buggy
// @lovable.dev/mcp-js vite plugin — its routesDir assertion fails on Windows).
// Lovable dev-time extras (sandbox detection, HMR gate, dev-server bridge,
// error loggers) are intentionally dropped: they are dev-only and not needed
// for standalone builds or local dev.
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
      // Import protection carried over from the Lovable preset.
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      // Redirect TanStack Start's bundled server entry to src/server.ts
      // (our SSR error wrapper).
      server: { entry: "server" },
    }),
    viteReact(),
  ],
});
