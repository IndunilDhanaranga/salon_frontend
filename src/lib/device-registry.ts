"use client";

export interface DeviceRecord {
  id: string;
  browser: string;
  os: string;
  deviceType: "Mobile" | "Desktop" | "Tablet";
  userEmail?: string;
  userName?: string;
  tenantSlug?: string;
  pushPermission: NotificationPermission | "unsupported";
  registeredAt: string;
  lastActive: string;
}

const DEVICE_STORAGE_KEY = "salon_device_id";
const REGISTRY_STORAGE_KEY = "salon_device_registry";

/** Detect OS and Browser for device registry */
function detectDeviceInfo(): {
  browser: string;
  os: string;
  deviceType: "Mobile" | "Desktop" | "Tablet";
} {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { browser: "Browser", os: "Unknown OS", deviceType: "Desktop" };
  }

  const ua = navigator.userAgent;
  let browser = "Chrome";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  let os = "Windows";
  if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (typeof window !== "undefined" && window.innerWidth <= 768);
  const isTablet = /iPad|Tablet/i.test(ua);

  const deviceType: "Mobile" | "Desktop" | "Tablet" = isTablet
    ? "Tablet"
    : isMobile
      ? "Mobile"
      : "Desktop";

  return { browser, os, deviceType };
}

/** Get or create persistent device ID */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "dev-server";
  try {
    let id = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!id) {
      const { os, browser } = detectDeviceInfo();
      const rand = Math.random().toString(36).slice(2, 7);
      id = `dev-${os.toLowerCase()}-${browser.toLowerCase()}-${rand}`;
      localStorage.setItem(DEVICE_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `dev-${Date.now()}`;
  }
}

/** Register current device into persistent registry */
export function registerCurrentDevice(
  user?: { name: string; email?: string },
  tenantSlug?: string,
): DeviceRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const id = getOrCreateDeviceId();
    const { browser, os, deviceType } = detectDeviceInfo();
    const pushPermission: NotificationPermission | "unsupported" =
      "Notification" in window ? Notification.permission : "unsupported";

    const record: DeviceRecord = {
      id,
      browser,
      os,
      deviceType,
      userEmail: user?.email,
      userName: user?.name,
      tenantSlug,
      pushPermission,
      registeredAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    let registry: DeviceRecord[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) registry = parsed;
      } catch {
        registry = [];
      }
    }

    const index = registry.findIndex((item) => item.id === id);
    if (index >= 0) {
      registry[index] = {
        ...registry[index],
        ...record,
        registeredAt: registry[index].registeredAt, // preserve initial registration
      };
    } else {
      registry.push(record);
    }

    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
    return record;
  } catch {
    return null;
  }
}

/** Retrieve all devices that have ever logged in */
export function getRegisteredDevices(): DeviceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Get device statistics */
export function getDeviceStats() {
  const devices = getRegisteredDevices();
  return {
    total: Math.max(1, devices.length),
    mobile: devices.filter((d) => d.deviceType === "Mobile").length,
    desktop: devices.filter((d) => d.deviceType === "Desktop").length,
    pushEnabled: devices.filter((d) => d.pushPermission === "granted").length,
  };
}

/**
 * Automatically requests browser push notification permission on the device.
 * Safely handles environments where Notification is unsupported or already resolved.
 */
export async function autoRequestPushPermission(
  user?: { name: string; email?: string },
  tenantSlug?: string,
): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  try {
    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
    }
    registerCurrentDevice(user, tenantSlug);
    return perm;
  } catch {
    return "unsupported";
  }
}

/**
 * Automatically prompts every device for push notification permission.
 * 1. Tries immediate prompt on mount.
 * 2. If modern browser requires a user gesture (like Safari/Chrome Mobile),
 *    binds to the very first user interaction (click, touch, keypress)
 *    so it automatically triggers seamlessly without the user needing to search settings.
 */
export function setupAutoPushPermission(
  user?: { name: string; email?: string },
  tenantSlug?: string,
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  registerCurrentDevice(user, tenantSlug);

  if (
    Notification.permission === "granted" ||
    Notification.permission === "denied"
  ) {
    return;
  }

  // Attempt 1: Immediate auto-request
  void autoRequestPushPermission(user, tenantSlug);

  // Attempt 2: User-gesture trigger (fallback for browsers requiring gesture)
  const triggerOnGesture = () => {
    void autoRequestPushPermission(user, tenantSlug);
    cleanup();
  };

  const cleanup = () => {
    window.removeEventListener("click", triggerOnGesture);
    window.removeEventListener("touchstart", triggerOnGesture);
    window.removeEventListener("keydown", triggerOnGesture);
  };

  window.addEventListener("click", triggerOnGesture, {
    once: true,
    passive: true,
  });
  window.addEventListener("touchstart", triggerOnGesture, {
    once: true,
    passive: true,
  });
  window.addEventListener("keydown", triggerOnGesture, {
    once: true,
    passive: true,
  });
}
