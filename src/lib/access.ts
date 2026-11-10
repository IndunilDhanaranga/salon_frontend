import type { Subscription, SubscriptionFeature, Tenant } from "./types";

const permissionFeatures: Record<string, SubscriptionFeature> = {
  staff: "staff",
  appointments: "appointments",
  catalog: "catalog",
  orders: "orders",
  payroll: "payroll",
  branches: "branches",
};

/** Compute exact 1-week grace period cutoff for paid subscriptions */
export function getSubscriptionGraceEnd(subscription: Subscription | null): number | null {
  if (!subscription) return null;
  if (subscription.grace_period_ends_at) {
    return Date.parse(subscription.grace_period_ends_at);
  }
  const isPaid =
    subscription.price_minor > 0 ||
    (subscription.status !== "trialing" && subscription.plan_id !== null);
  if (isPaid && subscription.current_period_end) {
    return Date.parse(subscription.current_period_end) + 7 * 24 * 60 * 60 * 1000;
  }
  return null;
}

export function isSubscriptionInGracePeriod(subscription: Subscription | null): boolean {
  if (!subscription || subscription.status === "cancelled") return false;
  const now = Date.now();
  const periodEnd = Date.parse(subscription.current_period_end);
  const graceEnd = getSubscriptionGraceEnd(subscription);
  if (!graceEnd) return subscription.status === "grace_period";

  if (subscription.status === "grace_period") {
    return now <= graceEnd;
  }
  return periodEnd <= now && now <= graceEnd;
}

export function getGracePeriodDaysRemaining(subscription: Subscription | null): number {
  const graceEnd = getSubscriptionGraceEnd(subscription);
  if (!graceEnd) return 0;
  const diff = graceEnd - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** Subscription entitlements and user permissions are independent requirements. */
export function hasBusinessAccess(tenant: Tenant) {
  const subscription = tenant.subscription;
  if (!subscription || tenant.status !== "active") {
    return false;
  }

  // Keep access active while admin is reviewing renewal
  if (subscription.status === "pending_renewal") {
    return true;
  }

  const now = Date.now();
  const periodEnd = Date.parse(subscription.current_period_end);

  if (["trialing", "active"].includes(subscription.status)) {
    if (periodEnd > now) return true;
  }

  // 1-Week Grace Period after expiration: access is allowed
  const graceEnd = getSubscriptionGraceEnd(subscription);
  if (graceEnd && now <= graceEnd) {
    return true;
  }

  // After 1-week grace period ends: access is locked
  return false;
}

export function hasFeature(tenant: Tenant, feature: SubscriptionFeature) {
  return (
    hasBusinessAccess(tenant) &&
    (tenant.subscription?.status === "trialing" ||
      tenant.subscription?.features.includes(feature) === true)
  );
}

export function canPermission(tenant: Tenant, permission: string) {
  if (tenant.needs_branch_setup) return false;
  if (!hasBusinessAccess(tenant)) return false;
  if (
    (permission.startsWith("payroll.") || permission === "access.manage") &&
    tenant.has_all_branches_access === false
  )
    return false;
  if (permission === "deductions.view") {
    return (
      tenant.permissions.includes("deductions.view") ||
      tenant.permissions.includes("payroll.view")
    );
  }
  if (permission === "deductions.manage") {
    return (
      tenant.permissions.includes("deductions.manage") ||
      tenant.permissions.includes("payroll.manage")
    );
  }
  if (!tenant.permissions.includes(permission)) return false;
  const feature = permissionFeatures[permission.split(".")[0]];
  return !feature || hasFeature(tenant, feature);
}

/** The first location is required even on a plan without multiple branches. */
export function canSetUpFirstBranch(tenant: Tenant) {
  return (
    tenant.needs_branch_setup === true &&
    hasBusinessAccess(tenant) &&
    tenant.permissions.includes("branches.manage") &&
    tenant.has_all_branches_access !== false
  );
}

export function subscriptionStatusLabel(subscription: Subscription | null) {
  if (!subscription) return "Unavailable";
  if (subscription.status === "cancelled") return "Cancelled";
  if (subscription.status === "pending_renewal") return "Pending renewal";
  if (isSubscriptionInGracePeriod(subscription)) return "Grace period (1 week)";
  const now = Date.now();
  if (Date.parse(subscription.current_period_end) <= now) {
    return "Expired (Locked)";
  }
  return subscription.status === "trialing" ? "Free trial" : "Active";
}

export const subscriptionFeatures: {
  key: SubscriptionFeature;
  label: string;
}[] = [
  { key: "staff", label: "Staff management" },
  { key: "appointments", label: "Appointments" },
  { key: "catalog", label: "Services & products" },
  { key: "orders", label: "Customer bills & POS" },
  { key: "payroll", label: "Payroll drafts" },
];
