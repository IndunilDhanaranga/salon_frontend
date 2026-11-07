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
const NOTIFICATION_ICON = "/icon.svg";
const NOTIFICATION_BADGE = "/icon.svg";

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

self.addEventListener("pushsubscriptionchange", function (event) {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: event.oldSubscription
          ? event.oldSubscription.options.applicationServerKey
          : null,
      })
      .then(function (newSubscription) {
        // Notify app of re-subscription
        return fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: newSubscription.toJSON(),
            action: "resubscribe",
          }),
        });
      }),
  );
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
