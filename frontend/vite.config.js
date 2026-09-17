import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json" with { type: "json" };

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Inlina nell'HTML il CSS dell'entry per eliminare la richiesta
// render-blocking. Il JS resta code-split.
function inlineEntryCss() {
  return {
    name: "inline-entry-css",
    apply: "build",
    enforce: "post",

    transformIndexHtml: {
      order: "post",

      handler(html, ctx) {
        const rawBundle = ctx?.bundle;

        if (!rawBundle) {
          return html;
        }

        const assets = Array.isArray(rawBundle)
          ? rawBundle
          : Object.values(rawBundle);

        let result = html;

        for (const asset of assets) {
          if (
            !asset ||
            asset.type !== "asset" ||
            typeof asset.fileName !== "string" ||
            !asset.fileName.endsWith(".css")
          ) {
            continue;
          }

          const marker = `href="/${asset.fileName}"`;

          if (!result.includes(marker)) {
            continue;
          }

          const linkPattern = new RegExp(
            `<link[^>]*${escapeRegExp(marker)}[^>]*>`,
            "g",
          );

          result = result.replace(
            linkPattern,
            `<style>${asset.source}</style>`,
          );

          if (!Array.isArray(rawBundle)) {
            delete rawBundle[asset.fileName];
          }
        }

        return result;
      },
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },

  test: {
    include: [
      "src/**/*.test.{js,jsx}",
      "supabase/functions/**/*.test.{ts,tsx}",
    ],
    exclude: ["e2e/**", "node_modules/**"],
  },

  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      strategies: "injectManifest",

      srcDir: "src",
      filename: "sw.js",

      injectManifest: {
        globPatterns: ["**/*.{js,wasm,css,html,woff2,webp}"],
      },

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
    }),

    inlineEntryCss(),
  ],
});
