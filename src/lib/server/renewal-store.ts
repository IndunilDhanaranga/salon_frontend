import fs from "node:fs";
import path from "node:path";
import type { SubscriptionRenewal } from "@/lib/types";

const RENEWAL_STORE_FILE = path.join(process.cwd(), ".renewals-store.json");

interface RenewalStoreData {
  renewals: SubscriptionRenewal[];
}

let memoryRenewals: SubscriptionRenewal[] = [];

// Load initial store
try {
  if (fs.existsSync(RENEWAL_STORE_FILE)) {
    const raw = fs.readFileSync(RENEWAL_STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.renewals)) {
      memoryRenewals = parsed.renewals;
    }
  }
} catch {
  // Memory fallback
}

function persistStore() {
  try {
    fs.writeFileSync(
      RENEWAL_STORE_FILE,
      JSON.stringify({ renewals: memoryRenewals }, null, 2),
      "utf-8",
    );
  } catch {
    // Write failure fallback
  }
}

export function getStoredRenewals(tenantId?: string): SubscriptionRenewal[] {
  if (tenantId) {
    return memoryRenewals.filter((r) => r.tenant_id === tenantId);
  }
  return [...memoryRenewals].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function addStoredRenewal(
  data: Partial<SubscriptionRenewal>,
): SubscriptionRenewal {
  const newRenewal: SubscriptionRenewal = {
    id: data.id || `rnw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tenant_id: data.tenant_id || "demo-tenant",
    subscription_id: data.subscription_id || "demo-sub",
    payment_method: data.payment_method || "bank_transfer",
    amount_minor: data.amount_minor || 500000,
    reference: data.reference || `REF-${Date.now().toString().slice(-6)}`,
    type: data.type || "late",
    status: "pending",
    notes: data.notes || null,
    proof_url: data.proof_url || null,
    review_notes: null,
    submitted_by_user_id: data.submitted_by_user_id || null,
    reviewed_by_user_id: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenant: data.tenant,
  };

  memoryRenewals = [newRenewal, ...memoryRenewals];
  persistStore();
  return newRenewal;
}

export function updateStoredRenewal(
  id: string,
  updates: Partial<SubscriptionRenewal>,
): SubscriptionRenewal | null {
  const index = memoryRenewals.findIndex((r) => r.id === id);
  if (index === -1) return null;

  memoryRenewals[index] = {
    ...memoryRenewals[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  persistStore();
  return memoryRenewals[index];
}
