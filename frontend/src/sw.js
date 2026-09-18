import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import {
  CacheFirst,
  NetworkFirst,
} from "workbox-strategies";

import {
  createPushSubscriptionWithRetry,
  enqueuePushSubscriptionChange,
  getVapidApplicationServerKey,
  notifyClientsPushSubscriptionSync,
} from "./services/pushSubscriptionChange.js";
import { resolvePushClickTarget } from "./services/pushUrl.js";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Con strategia injectManifest il plugin non inietta skipWaiting/clientsClaim
// (valgono solo per generateSW): li aggiungiamo qui per rendere effettivo
// registerType "autoUpdate" (attivazione immediata + reload della pagina).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Analytics errori service worker: inoltra ogni errore non gestito alla
// pagina aperta, che provvede a registrarlo su Supabase.
function forwardAnalytics(event, payload) {
  const message = { type: "ANALYTICS_EVENT", event, payload };

  self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      clients.forEach((client) => client.postMessage(message));
    })
    .catch(() => {});
}

self.addEventListener("error", (event) => {
  forwardAnalytics("sw_error", {
    message: event?.message ?? "unknown",
  });
});

self.addEventListener("unhandledrejection", (event) => {
  forwardAnalytics("sw_error", {
    reason: String(event?.reason ?? "unknown"),
  });
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Fallback offline per le navigazioni: prova prima la rete, poi serve la
// shell precacheata (index.html) così l'SPA si avvia anche senza connessione.
registerRoute(
  new NavigationRoute(async ({ request, event }) => {
    try {
      return await fetch(request);
    } catch {
      return (await createHandlerBoundToURL("/index.html"))({ request, event });
    }
  }),
);

// NOTA TECNICA: la Cache Storage "tracker-read" non viene svuotata al logout
// (clearAllLocalData agisce solo su localStorage). Se questa route resta
// attiva, valutare una pulizia esplicita della cache alla disconnessione.
registerRoute(
  ({ url }) =>
    url.pathname.match(/^\/rest\/v1\/(entries|profiles)(?:$|\/)/),
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

// Rotazione endpoint (provider push, reset browser, reinstallazione, cambio
// profilo): ricrea la subscription, la accoda in modo persistente e avvisa le
// pagine aperte. Se nessuna pagina è aperta la queue resta in IndexedDB e viene
// svuotata da PushSyncProvider (mount, "online", messaggio SW).
self.addEventListener("pushsubscriptionchange", (event) => {
  const oldSubscription = event.oldSubscription ?? null;

  event.waitUntil(
    (async () => {
      const applicationServerKey = getVapidApplicationServerKey();

      if (!applicationServerKey) {
        forwardAnalytics("sw_error", {
          message: "VAPID key mancante su pushsubscriptionchange",
        });
        return;
      }

      const subscription = await createPushSubscriptionWithRetry({
        pushManager: self.registration.pushManager,
        applicationServerKey,
      });

      if (!subscription?.endpoint) {
        forwardAnalytics("sw_error", {
          message: "pushsubscriptionchange: re-subscribe fallito",
          reason: subscription?.error?.message ?? "unknown",
        });
        return;
      }

      await enqueuePushSubscriptionChange({
        subscription,
        oldSubscription,
      });

      await notifyClientsPushSubscriptionSync(self);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // B2: la destinazione è vincolata a percorsi interni. URL esterne o
  // maleformate producono null -> nessuna apertura verso domini esterni.
  const targetUrl = resolvePushClickTarget(
    event.notification.data?.url,
    self.location.origin,
  );

  if (!targetUrl) {
    return;
  }

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