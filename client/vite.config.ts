import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["anemic-snowcap-happier.ngrok-free.dev"],
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://localhost:9000",
        changeOrigin: true,
      },
    },
  },
});
