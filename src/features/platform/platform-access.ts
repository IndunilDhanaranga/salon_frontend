import type { PlatformTab } from "./types";

export const platformTabPermissions: Record<PlatformTab, string> = {
  dashboard: "platform.dashboard.view",
  reports: "platform.reports.view",
  businesses: "platform.tenants.view",
  plans: "platform.plans.view",
  subscriptions: "platform.subscriptions.manage",
  access: "platform.access.manage",
  accounts: "platform.users.view",
  notifications: "platform.dashboard.view",
};

export function availablePlatformTab(
  requested: PlatformTab,
  hasPermission: (permission: string) => boolean,
): PlatformTab | undefined {
  if (hasPermission(platformTabPermissions[requested])) return requested;
  return (Object.keys(platformTabPermissions) as PlatformTab[]).find((tab) =>
    hasPermission(platformTabPermissions[tab]),
  );
}
