import type { Subscription, SubscriptionFeature, Tenant } from "./types";

const permissionFeatures: Record<string, SubscriptionFeature> = {
  staff: "staff",
  appointments: "appointments",
  catalog: "catalog",
  orders: "orders",
  payroll: "payroll",
  branches: "branches",
};

/** Subscription entitlements and user permissions are independent requirements. */
export function hasBusinessAccess(tenant: Tenant) {
  const subscription = tenant.subscription;
  return (
    tenant.status === "active" &&
    !!subscription?.access_allowed &&
    ["trialing", "active"].includes(subscription.status) &&
    Date.parse(subscription.current_period_end) > Date.now()
  );
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
  if (
    !subscription.access_allowed ||
    Date.parse(subscription.current_period_end) <= Date.now()
  )
    return "Expired";
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
