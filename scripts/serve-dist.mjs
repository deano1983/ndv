// Minimal static server for dist/client with SPA fallback (no deps).
// Used for local screenshots/preview of the app-shell build.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const root = "dist/client";
const port = Number(process.argv[2] || 8080);
const types = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".woff2": "font/woff2", ".txt": "text/plain", ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p === "/") p = "/index.html";
    let file = normalize(join(root, p));
    if (!file.startsWith(normalize(root))) throw new Error("path escape");
    let data;
    try {
      data = await readFile(file);
    } catch {
      // SPA fallback
      file = join(root, "index.html");
      data = await readFile(file);
    }
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch (e) {
    res.writeHead(404); res.end("not found");
  }
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
