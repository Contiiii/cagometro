import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  CacheFirst,
  NetworkFirst,
} from "workbox-strategies";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ url }) =>
    url.pathname.match(/^\/rest\/v1\/(entries|profiles)\//),
  new NetworkFirst({
    cacheName: "tracker-read",
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60,
        maxEntries: 50,
      }),
    ],
  }),
);

registerRoute(
  /\.(?:woff2|webp)$/i,
  new CacheFirst({
    cacheName: "static-assets",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60,
        maxEntries: 16,
      }),
    ],
  }),
);

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Cagometro", body: event.data.text() };
  }

  const title = data.title || "Cagometro";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url: data.url || "/",
    },
    tag: data.tag || `cagometro-${data.type || "general"}`,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  );

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();

          const currentUrl = client.url ? new URL(client.url).href : null;

          if (currentUrl !== targetUrl.href && "navigate" in client) {
            await client.navigate(targetUrl.href);
          }

          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl.href);
      }
    })(),
  );
});