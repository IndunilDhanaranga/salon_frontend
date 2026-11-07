"use client";

export interface DeviceRecord {
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

const DEVICE_STORAGE_KEY = "salon_device_id";
const REGISTRY_STORAGE_KEY = "salon_device_registry";

/**
 * Accurately detects OS, Browser, Device Type, and Model,
 * with special attention to iPhone, iPad, MacBook, and Android.
 */
export function detectDeviceInfo(): {
  browser: string;
  os: string;
  deviceType: "Mobile" | "Desktop" | "Tablet";
  model: string;
} {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      browser: "Browser",
      os: "Unknown OS",
      deviceType: "Desktop",
      model: "Unknown Device",
    };
  }

  const ua = navigator.userAgent;
  const platform =
    (
      navigator as unknown as {
        userAgentData?: { platform?: string };
        platform?: string;
      }
    ).platform || "";

  // 1. Detect Browser
  let browser = "Chrome";
  if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|Edg/i.test(ua))
    browser = "Safari";
  else if (/CriOS/i.test(ua)) browser = "Chrome (iOS)";
  else if (/FxiOS/i.test(ua)) browser = "Firefox (iOS)";
  else if (/Opera|OPR/i.test(ua)) browser = "Opera";

  // 2. Detect OS & Model (Apple focus: iPhone, iPad, MacBook)
  let os = "Windows";
  let deviceType: "Mobile" | "Desktop" | "Tablet" = "Desktop";
  let model = "Desktop PC";

  const isIPhone = /iPhone/i.test(ua);
  const isIPad =
    /iPad/i.test(ua) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMac = /Macintosh|Mac OS X/i.test(ua) && !isIPad;
  const isAndroid = /Android/i.test(ua);
  const isLinux = /Linux/i.test(ua) && !isAndroid;

  if (isIPhone) {
    os = "iOS";
    deviceType = "Mobile";
    model = "Apple iPhone";
  } else if (isIPad) {
    os = "iPadOS";
    deviceType = "Tablet";
    model = "Apple iPad";
  } else if (isMac) {
    os = "macOS";
    deviceType = "Desktop";
    model = "Apple MacBook / Mac";
  } else if (isAndroid) {
    os = "Android";
    deviceType = /Mobile/i.test(ua) ? "Mobile" : "Tablet";
    model = "Android Mobile";
  } else if (isLinux) {
    os = "Linux";
    deviceType = "Desktop";
    model = "Linux Workstation";
  } else {
    os = "Windows";
    deviceType = window.innerWidth <= 768 ? "Mobile" : "Desktop";
    model = deviceType === "Mobile" ? "Mobile Device" : "Windows PC";
  }

  return { browser, os, deviceType, model };
}

/** Get or create persistent device ID */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "dev-server";
  try {
    let id = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!id) {
      const { os, browser } = detectDeviceInfo();
      const rand = Math.random().toString(36).slice(2, 7);
      id = `dev-${os.toLowerCase().replace(/\s+/g, "")}-${browser.toLowerCase().replace(/\s+/g, "")}-${rand}`;
      localStorage.setItem(DEVICE_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `dev-${Date.now()}`;
  }
}

/**
 * Register current device into both local registry AND central Next.js server API.
 * Ensures iPhones and MacBooks are always registered and visible in the Admin Panel.
 */
export function registerCurrentDevice(
  user?: { name: string; email?: string },
  tenantSlug?: string,
): DeviceRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const id = getOrCreateDeviceId();
    const { browser, os, deviceType, model } = detectDeviceInfo();
    const pushPermission: DeviceRecord["pushPermission"] =
      "Notification" in window ? Notification.permission : "unsupported";

    const record: DeviceRecord = {
      id,
      browser,
      os,
      deviceType,
      model,
      userEmail: user?.email,
      userName: user?.name,
      tenantSlug,
      pushPermission,
      registeredAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    // 1. Local registry fallback
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
        registeredAt: registry[index].registeredAt,
      };
    } else {
      registry.push(record);
    }
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));

    // 2. Server API registration (centralized across all devices)
    void fetch("/api/notifications/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }).catch(() => {
      // Server unreachable, local storage remains intact
    });

    return record;
  } catch {
    return null;
  }
}

/** Retrieve all registered devices (syncs from central server API + local fallback) */
export async function fetchServerDevices(): Promise<DeviceRecord[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/notifications/devices", {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.devices)) {
        return data.devices;
      }
    }
  } catch {
    // Fallback to localStorage
  }
  return getRegisteredDevices();
}

/** Retrieve locally cached devices */
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

/**
 * Automatically requests browser push notification permission on the device.
 * Safari / iOS / MacBook compatible (handles both Callback and Promise standards).
 */
export async function autoRequestPushPermission(
  user?: { name: string; email?: string },
  tenantSlug?: string,
): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    registerCurrentDevice(user, tenantSlug);
    return "unsupported";
  }

  try {
    let perm = Notification.permission;
    if (perm === "default") {
      // Safari compatibility: handle both callback and promise syntax
      perm = await new Promise<NotificationPermission>((resolve) => {
        try {
          const req = Notification.requestPermission((p) => resolve(p));
          if (req && typeof req.then === "function") {
            req.then(resolve).catch(() => resolve(Notification.permission));
          }
        } catch {
          resolve(Notification.permission);
        }
      });
    }
    registerCurrentDevice(user, tenantSlug);
    return perm;
  } catch {
    registerCurrentDevice(user, tenantSlug);
    return "unsupported";
  }
}

/**
 * Automatically prompts every device (iPhone, iPad, MacBook, Android, PC) for push notifications.
 * Immediately registers the device regardless of browser support,
 * and sets up user-gesture auto-prompt for Safari and mobile browsers.
 */
export function setupAutoPushPermission(
  user?: { name: string; email?: string },
  tenantSlug?: string,
) {
  if (typeof window === "undefined") return;

  // Always register the device first so it is immediately visible in the Admin Panel
  registerCurrentDevice(user, tenantSlug);

  if (!("Notification" in window)) return;

  if (
    Notification.permission === "granted" ||
    Notification.permission === "denied"
  ) {
    return;
  }

  // Attempt 1: Immediate prompt
  void autoRequestPushPermission(user, tenantSlug);

  // Attempt 2: User-gesture trigger (required by Apple iOS Safari & macOS Safari)
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

/**
 * Facebook-style crisp notification audio chime.
 * Synthesized using Web Audio API (warm marimba-style two-pitch chime).
 */
export function playFacebookNotificationSound() {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // First tone: F5 (698.46 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(698.46, now);
    gain1.gain.setValueAtTime(0.09, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // Second tone: C6 (1046.50 Hz) - higher, clear chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1046.5, now + 0.08);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.43);
  } catch {
    // Autoplay policy limitation fallback
  }
}
