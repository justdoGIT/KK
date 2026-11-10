import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import codspeedPlugin from "@codspeed/vitest-plugin";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    codspeedPlugin(),
    {
      name: "development-csp",
      apply: "serve",
      transformIndexHtml(html) {
        // Vite injects styles and uses HMR; builds retain the strict policy.
        return html.replace(
          /<meta http-equiv="Content-Security-Policy"[^>]*>/,
          "",
        );
      },
    },
  ],
  build: {
    manifest: true,
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    // Let dynamic scene imports define sharing. Grouping every "three" module
    // together pulled the career's postprocessing into the opening scene.
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    exclude: ["**/e2e/**", "**/node_modules/**", "**/dist/**"],
  },
});
