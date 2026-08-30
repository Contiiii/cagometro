import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon-32.png",
        "apple-touch-icon-180.png",
        "screenshot-mobile.png",
        "screenshot-desktop.png",
      ],

      manifest: {
        id: "/",
        name: "Cagometro",
        short_name: "Cagometro",
        description: "Tracker personale delle registrazioni",
        lang: "it",

        theme_color: "#000000",
        background_color: "#000000",

        display: "standalone",
        start_url: "/",
        scope: "/",

        screenshots: [
          {
            src: "/screenshot-mobile.png",
            sizes: "1080x1920",
            type: "image/png",
            form_factor: "narrow",
          },
          {
            src: "/screenshot-desktop.png",
            sizes: "1920x1080",
            type: "image/png",
            form_factor: "wide",
          },
        ],

        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});