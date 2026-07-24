import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const clientDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: clientDir,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: fileURLToPath(new URL("../src/server/public", import.meta.url)),
    emptyOutDir: true,
  },
});
