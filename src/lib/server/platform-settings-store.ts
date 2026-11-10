import fs from "node:fs";
import path from "node:path";
import type { PlatformPaymentSettings } from "@/lib/types";

const PAYMENT_SETTINGS_STORE_FILE = path.join(
  process.cwd(),
  ".platform-payment-settings.json",
);

export const DEFAULT_PLATFORM_PAYMENT_SETTINGS: PlatformPaymentSettings = {
  bank_name: "Commercial Bank of Ceylon / BOC",
  account_name: "Salon Platform (Pvt) Ltd",
  account_number: "1000-8472-9102-001",
  branch_name: "Colombo City Centre / Digital Banking",
  updated_at: new Date().toISOString(),
};

let memoryPaymentSettings: PlatformPaymentSettings = {
  ...DEFAULT_PLATFORM_PAYMENT_SETTINGS,
};

try {
  if (fs.existsSync(PAYMENT_SETTINGS_STORE_FILE)) {
    const raw = fs.readFileSync(PAYMENT_SETTINGS_STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      memoryPaymentSettings = {
        ...DEFAULT_PLATFORM_PAYMENT_SETTINGS,
        ...parsed,
      };
    }
  }
} catch {
  // Fallback to defaults when the file is missing or unreadable.
}

function persistPaymentSettings() {
  try {
    fs.writeFileSync(
      PAYMENT_SETTINGS_STORE_FILE,
      JSON.stringify(memoryPaymentSettings, null, 2),
      "utf-8",
    );
  } catch {
    // Silent fallback if this environment is read-only.
  }
}

export function getStoredPaymentSettings(): PlatformPaymentSettings {
  return {
    ...DEFAULT_PLATFORM_PAYMENT_SETTINGS,
    ...memoryPaymentSettings,
    updated_at: memoryPaymentSettings.updated_at || new Date().toISOString(),
  };
}

export function setStoredPaymentSettings(
  updates: Partial<PlatformPaymentSettings>,
): PlatformPaymentSettings {
  memoryPaymentSettings = {
    ...DEFAULT_PLATFORM_PAYMENT_SETTINGS,
    ...memoryPaymentSettings,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  persistPaymentSettings();
  return getStoredPaymentSettings();
}
