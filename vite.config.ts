import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/quran-api": {
        target: "https://api.alquran.cloud",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/quran-api/, ""),
      },
    },
  },
});
