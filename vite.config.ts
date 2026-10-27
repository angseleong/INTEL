import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Plain HTML pages, no router (docs/ARCHITECTURE.md §5). JSX is compiled by Vite's esbuild (tsconfig "jsx").
export default defineConfig({
  plugins: [tailwindcss()],
  build: { rollupOptions: { input: ["index.html", "tentang.html", "peliput.html", "upaya.html"] } },
  preview: { allowedHosts: [".trycloudflare.com"] }, // `npx vite preview` + cloudflared, to try it on a phone or tablet
});
