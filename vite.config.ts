import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("three") ||
              id.includes("@react-three/fiber") ||
              id.includes("@react-three/drei")
            ) {
              return "scene-vendor";
            }
            if (id.includes("@react-three/postprocessing")) {
              return "postprocessing";
            }
            if (id.includes("gsap") || id.includes("lenis")) {
              return "motion";
            }
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    exclude: ["**/e2e/**", "**/node_modules/**", "**/dist/**"],
  },
});
