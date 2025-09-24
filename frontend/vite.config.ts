import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  server: {
    cors: true
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
});
