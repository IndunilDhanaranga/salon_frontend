import fs from "node:fs";
import path from "node:path";

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

interface StoreData {
  devices: ServerDeviceRecord[];
  broadcasts: ServerBroadcastMessage[];
}

const STORE_FILE = path.join(process.cwd(), ".device-notifications-store.json");

let memoryStore: StoreData = {
  devices: [],
  broadcasts: [],
};

// Load initial store from file if exists
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
  }
} catch {
  // Fall back to memoryStore
}

function persistStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
  } catch {
    // Write failure fallback
  }
}

export function registerServerDevice(
  device: ServerDeviceRecord,
): ServerDeviceRecord {
  const existingIdx = memoryStore.devices.findIndex((d) => d.id === device.id);
  if (existingIdx >= 0) {
    memoryStore.devices[existingIdx] = {
      ...memoryStore.devices[existingIdx],
      ...device,
      registeredAt: memoryStore.devices[existingIdx].registeredAt, // preserve original registration
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

export function getServerDevices(): ServerDeviceRecord[] {
  return [...memoryStore.devices].sort(
    (a, b) =>
      new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
  );
}

export function addServerBroadcast(
  broadcast: ServerBroadcastMessage,
): ServerBroadcastMessage {
  memoryStore.broadcasts = [broadcast, ...memoryStore.broadcasts].slice(0, 100);
  persistStore();
  return broadcast;
}

export function getServerBroadcasts(since?: string): ServerBroadcastMessage[] {
  if (!since) return [...memoryStore.broadcasts];
  const sinceTime = new Date(since).getTime();
  return memoryStore.broadcasts.filter(
    (b) => new Date(b.sentAt).getTime() > sinceTime,
  );
}
