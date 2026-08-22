import { defineConfig } from "vite";
import react from "@vitejs/plugin-React";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^\/api\/conversations\/.*$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "conversation-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      manifest: {
        name: "Lumina",
        short_name: "Lumina",
        description: "Your personal movie archive and AI companion.",
        display: "standalone",
        theme_color: "#0a0a0f",
        background_color: "#0a0a0f",
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
});
