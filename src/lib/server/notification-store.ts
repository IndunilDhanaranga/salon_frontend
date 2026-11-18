import fs from "node:fs";
import path from "node:path";
import * as webpush from "web-push";
import {
  notificationBackend,
  useNotificationBackend,
} from "./notification-backend";

/* ------------------------------------------------------------------ */
/*  VAPID Configuration                                                 */
/* ------------------------------------------------------------------ */

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidEmail = process.env.VAPID_EMAIL || "admin@salonplatform.local";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    `mailto:${vapidEmail}`,
    vapidPublicKey,
    vapidPrivateKey,
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface ServerDeviceRecord {
  id: string;
  browser: string;
  os: string;
  deviceType: "Mobile" | "Desktop" | "Tablet";
  model: string;
  userEmail?: string;
  userName?: string;
  tenantSlug?: string;
  pushPermission: "granted" | "default" | "denied" | "unsupported";
  registeredAt: string;
  lastActive: string;
}

export interface ServerBroadcastMessage {
  id: string;
  title: string;
  message: string;
  priority: "normal" | "urgent";
  category?: string;
  targetAudience?: string;
  targetView?: string;
  sentBy: string;
  sentAt: string;
}

/** Stored Web Push subscription per device */
export interface PushSubscriptionRecord {
  deviceId: string;
  subscription: object;
  subscribedAt: string;
}

interface StoreData {
  devices: ServerDeviceRecord[];
  broadcasts: ServerBroadcastMessage[];
  pushSubscriptions: PushSubscriptionRecord[];
}

/* ------------------------------------------------------------------ */
/*  Persistence                                                         */
/* ------------------------------------------------------------------ */

const STORE_FILE =
  process.env.NOTIFICATION_STORE_FILE ||
  path.join(process.cwd(), ".device-notifications-store.json");

let memoryStore: StoreData = {
  devices: [],
  broadcasts: [],
  pushSubscriptions: [],
};

// Route bundles can have separate module instances. Read the latest persisted
// snapshot before each operation instead of overwriting it with startup data.
function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.devices)) {
        memoryStore.devices = parsed.devices;
      }
      if (parsed && Array.isArray(parsed.broadcasts)) {
        memoryStore.broadcasts = parsed.broadcasts;
      }
      if (parsed && Array.isArray(parsed.pushSubscriptions)) {
        memoryStore.pushSubscriptions = parsed.pushSubscriptions;
      }
    }
  } catch (error) {
    console.error("Failed to read notification store", error);
    throw error;
  }
}

function persistStore() {
  const temporaryFile = `${STORE_FILE}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(memoryStore, null, 2),
      "utf-8",
    );
    fs.renameSync(temporaryFile, STORE_FILE);
  } catch (error) {
    console.error("Failed to persist notification store", error);
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Device Registry                                                     */
/* ------------------------------------------------------------------ */

export async function registerServerDevice(
  device: ServerDeviceRecord,
): Promise<ServerDeviceRecord> {
  if (useNotificationBackend()) {
    return notificationBackend("devices", "POST", {
      key: device.id,
      value: device,
    });
  }
  loadStore();
  const existingIdx = memoryStore.devices.findIndex((d) => d.id === device.id);
  if (existingIdx >= 0) {
    memoryStore.devices[existingIdx] = {
      ...memoryStore.devices[existingIdx],
      ...device,
      registeredAt: memoryStore.devices[existingIdx].registeredAt,
      lastActive: new Date().toISOString(),
    };
  } else {
    memoryStore.devices.push({
      ...device,
      registeredAt: device.registeredAt || new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });
  }
  persistStore();
  return memoryStore.devices[
    existingIdx >= 0 ? existingIdx : memoryStore.devices.length - 1
  ];
}

export async function getServerDevices(): Promise<ServerDeviceRecord[]> {
  if (useNotificationBackend()) return notificationBackend("devices");
  loadStore();
  return [...memoryStore.devices].sort(
    (a, b) =>
      new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
  );
}

/* ------------------------------------------------------------------ */
/*  Broadcast Messages                                                  */
/* ------------------------------------------------------------------ */

export async function addServerBroadcast(
  broadcast: ServerBroadcastMessage,
): Promise<ServerBroadcastMessage> {
  if (useNotificationBackend()) {
    return notificationBackend("broadcasts", "POST", {
      key: broadcast.id,
      value: broadcast,
    });
  }
  loadStore();
  memoryStore.broadcasts = [broadcast, ...memoryStore.broadcasts].slice(0, 100);
  persistStore();
  return broadcast;
}

export async function getServerBroadcasts(
  since?: string,
): Promise<ServerBroadcastMessage[]> {
  if (useNotificationBackend()) {
    const broadcasts =
      await notificationBackend<ServerBroadcastMessage[]>("broadcasts");
    return since
      ? broadcasts.filter(
          (b) => new Date(b.sentAt).getTime() > new Date(since).getTime(),
        )
      : broadcasts;
  }
  loadStore();
  if (!since) return [...memoryStore.broadcasts];
  const sinceTime = new Date(since).getTime();
  return memoryStore.broadcasts.filter(
    (b) => new Date(b.sentAt).getTime() > sinceTime,
  );
}

/* ------------------------------------------------------------------ */
/*  Web Push Subscriptions                                              */
/* ------------------------------------------------------------------ */

export async function addPushSubscription(
  deviceId: string,
  subscription: object,
): Promise<void> {
  if (useNotificationBackend()) {
    await notificationBackend("subscriptions", "POST", {
      key: deviceId,
      value: { deviceId, subscription, subscribedAt: new Date().toISOString() },
    });
    return;
  }
  loadStore();
  const existingIdx = memoryStore.pushSubscriptions.findIndex(
    (s) => s.deviceId === deviceId,
  );
  const record: PushSubscriptionRecord = {
    deviceId,
    subscription,
    subscribedAt: new Date().toISOString(),
  };
  if (existingIdx >= 0) {
    memoryStore.pushSubscriptions[existingIdx] = record;
  } else {
    memoryStore.pushSubscriptions.push(record);
  }
  persistStore();
}

export async function removePushSubscription(
  deviceId: string,
  endpoint?: string,
): Promise<void> {
  if (useNotificationBackend()) {
    await notificationBackend("subscriptions", "DELETE", {
      key: deviceId,
      endpoint,
    });
    return;
  }
  loadStore();
  memoryStore.pushSubscriptions = memoryStore.pushSubscriptions.filter(
    (s) =>
      s.deviceId !== deviceId ||
      (endpoint !== undefined &&
        (s.subscription as webpush.PushSubscription).endpoint !== endpoint),
  );
  persistStore();
}

export async function getPushSubscriptions(): Promise<
  PushSubscriptionRecord[]
> {
  if (useNotificationBackend()) return notificationBackend("subscriptions");
  loadStore();
  return [...memoryStore.pushSubscriptions];
}

/* ------------------------------------------------------------------ */
/*  Native Web Push Delivery via VAPID                                  */
/* ------------------------------------------------------------------ */

export interface PushPayload {
  id: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  priority?: "normal" | "urgent";
  targetView?: string;
}

/**
 * Sends a real OS-level Web Push notification to ALL registered devices.
 * Works even when the browser is closed, in background, or screen is locked.
 * Compatible with: Android Chrome, Windows Chrome/Edge/Firefox,
 * macOS Chrome/Edge/Firefox/Safari 16+, iOS 16.4+ (PWA installed).
 */
export async function broadcastWebPush(payload: PushPayload): Promise<{
  sent: number;
  failed: number;
}> {
  const subscriptions = await getPushSubscriptions();
  if (!subscriptions.length || !vapidPublicKey || !vapidPrivateKey) {
    return { sent: 0, failed: 0 };
  }

  const pushData = JSON.stringify({
    id: payload.id,
    title: payload.title,
    body: payload.body,
    message: payload.body,
    icon: payload.icon || "/icon.svg",
    url: payload.url || "/",
    tag: payload.tag || `salon-${payload.id}`,
    priority: payload.priority || "normal",
    targetView: payload.targetView,
  });

  const results = await Promise.allSettled(
    subscriptions.map(async ({ deviceId, subscription }) => {
      try {
        await webpush.sendNotification(
          subscription as webpush.PushSubscription,
          pushData,
          {
            urgency: payload.priority === "urgent" ? "high" : "normal",
            TTL: 86400, // 24 hours TTL
          },
        );
        return { deviceId, success: true };
      } catch (err: unknown) {
        // Remove invalid/expired subscriptions (410 Gone = device unsubscribed)
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) {
          // A renewal may have completed while this request was in flight.
          // Never remove the replacement when the old endpoint expires.
          await removePushSubscription(
            deviceId,
            (subscription as webpush.PushSubscription).endpoint,
          );
        }
        return { deviceId, success: false };
      }
    }),
  );

  const sent = results.filter(
    (r) => r.status === "fulfilled" && r.value.success,
  ).length;
  const failed = results.length - sent;
  return { sent, failed };
}
