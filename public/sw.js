/**
 * Salon Platform - Service Worker for Web Push Notifications
 *
 * This service worker handles native OS-level push notifications for all devices:
 * - Windows / Linux PCs (Chrome, Firefox, Edge)
 * - MacBook (Chrome, Edge; Safari 16+ on macOS 13+)
 * - Android phones (Chrome, Firefox)
 * - iPhone / iPad (iOS 16.4+ PWA installed to Home Screen)
 *
 * Works like Helakuru / Facebook notifications — delivered by the OS even when
 * the browser tab is closed, the browser is in the background, or the screen is locked.
 */

const APP_URL = self.location.origin;
const NOTIFICATION_ICON = "/icon-192.png";
const NOTIFICATION_BADGE = "/icon-192.png";

/* ------------------------------------------------------------------ */
/*  Push Event: Receives notification from server via Web Push         */
/* ------------------------------------------------------------------ */

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "Salon Platform",
      body: event.data.text(),
      icon: NOTIFICATION_ICON,
    };
  }

  const title = data.title || "Salon Platform";
  const options = {
    body: data.body || data.message || "",
    icon: data.icon || NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    tag: data.tag || `salon-push-${Date.now()}`,
    data: {
      url: data.url || APP_URL,
      notificationId: data.id || `push-${Date.now()}`,
      targetView: data.targetView || null,
    },
    // Vibration pattern: works on Android, ignored gracefully elsewhere
    vibrate: [200, 100, 200, 100, 200],
    // Actions shown in the notification panel (Android / Desktop)
    actions: [
      {
        action: "open",
        title: "Open App",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    // Keep notification visible until user interacts (desktop)
    requireInteraction: data.priority === "urgent",
    // Silent for normal, audible chime for urgent
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ------------------------------------------------------------------ */
/*  Notification Click: Opens / focuses the app                        */
/* ------------------------------------------------------------------ */

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "dismiss") return;

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || APP_URL;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // If app is already open in a tab, focus it
        for (const client of clientList) {
          if (client.url.startsWith(APP_URL) && "focus" in client) {
            // Send message to in-app handler with target view
            client.postMessage({
              type: "PUSH_NOTIFICATION_CLICK",
              targetView: notifData.targetView,
              notificationId: notifData.notificationId,
            });
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});

/* ------------------------------------------------------------------ */
/*  Push Subscription Change: Handle automatic re-subscription         */
/* ------------------------------------------------------------------ */

async function syncPushSubscription() {
  const cache = await caches.open("salon-push-state-v1");
  const contextResponse = await cache.match("/__salon-push-context");
  if (!contextResponse) return; // Older installs recover on their next app visit.
  const { deviceId, vapidPublicKey } = await contextResponse.json();
  if (!deviceId) return;

  let subscription = await self.registration.pushManager.getSubscription();
  if (!subscription) {
    const base64 = vapidPublicKey.replace(/-/g, "+").replace(/_/g, "/");
    const key = Uint8Array.from(atob(base64), (character) =>
      character.charCodeAt(0),
    );
    subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
  }
  const response = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId,
      subscription: subscription.toJSON(),
      action: "resubscribe",
    }),
  });
  if (!response.ok) throw new Error("Failed to save renewed push subscription");
}

self.addEventListener("pushsubscriptionchange", function (event) {
  event.waitUntil(
    syncPushSubscription().catch(async (error) => {
      // Background Sync retries failed network requests on supporting browsers.
      // Other browsers recover through foreground subscription reconciliation.
      if (self.registration.sync) {
        await self.registration.sync.register("salon-push-resubscribe");
      } else {
        throw error;
      }
    }),
  );
});

self.addEventListener("sync", function (event) {
  if (event.tag === "salon-push-resubscribe") {
    event.waitUntil(syncPushSubscription());
  }
});

/* ------------------------------------------------------------------ */
/*  Activate: Claim all clients immediately                            */
/* ------------------------------------------------------------------ */

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});

/* ------------------------------------------------------------------ */
/*  Install: Skip waiting so new SW activates immediately              */
/* ------------------------------------------------------------------ */

self.addEventListener("install", function (event) {
  self.skipWaiting();
});
