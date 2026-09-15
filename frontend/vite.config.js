import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json" with { type: "json" };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },

  test: {
    include: ["src/**/*.test.{js,jsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },

  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon-32.png",
        "apple-touch-icon-180.png",
        "maskable-icon-512.png",
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
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/maskable-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.match(/^\/rest\/v1\/(entries|profiles)\//),
            handler: "NetworkFirst",
            options: {
              cacheName: "tracker-read",
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60,
                maxEntries: 50,
              },
            },
          },
          {
            urlPattern: /\.(?:woff2|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: {
                maxAgeSeconds: 7 * 24 * 60 * 60,
                maxEntries: 16,
              },
            },
          },
        ],
      },
    }),
  ],
});
