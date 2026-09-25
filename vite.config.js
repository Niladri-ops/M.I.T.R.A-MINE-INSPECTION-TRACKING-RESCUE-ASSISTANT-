import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },

      "/droidcam": {
        target: "http://10.132.121.26:4747",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/droidcam/, ""),
      },
    },
  },
});