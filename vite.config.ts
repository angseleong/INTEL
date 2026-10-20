import { defineConfig } from "vite";

// Plain HTML pages, no router (docs/ARCHITECTURE.md §5).
export default defineConfig({
  build: { rollupOptions: { input: ["index.html", "tentang.html", "peliput.html", "upaya.html"] } },
});
