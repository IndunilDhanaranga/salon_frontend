import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Layers3,
  CreditCard,
  ShieldCheck,
  Users,
  BellRing,
} from "lucide-react";
import type { PlatformTab } from "../types";

export interface PlatformNavItem {
  id: PlatformTab;
  labelKey: string;
  defaultLabel: string;
  icon: typeof LayoutDashboard;
  perm: string;
}

export const PLATFORM_NAV_ITEMS: PlatformNavItem[] = [
  {
    id: "dashboard",
    labelKey: "overview",
    defaultLabel: "Overview",
    icon: LayoutDashboard,
    perm: "platform.dashboard.view",
  },
  {
    id: "reports",
    labelKey: "reports",
    defaultLabel: "Reports",
    icon: BarChart3,
    perm: "platform.reports.view",
  },
  {
    id: "businesses",
    labelKey: "businesses",
    defaultLabel: "Businesses",
    icon: Building2,
    perm: "platform.tenants.view",
  },
  {
    id: "plans",
    labelKey: "plans",
    defaultLabel: "Plans",
    icon: Layers3,
    perm: "platform.plans.view",
  },
  {
    id: "subscriptions",
    labelKey: "subscriptions",
    defaultLabel: "Subscriptions",
    icon: CreditCard,
    perm: "platform.subscriptions.manage",
  },
  {
    id: "access",
    labelKey: "access",
    defaultLabel: "Access Roles",
    icon: ShieldCheck,
    perm: "platform.access.manage",
  },
  {
    id: "accounts",
    labelKey: "accounts",
    defaultLabel: "Accounts",
    icon: Users,
    perm: "platform.users.view",
  },
  {
    id: "notifications",
    labelKey: "pushNotifications",
    defaultLabel: "Push Notifications",
    icon: BellRing,
    perm: "platform.dashboard.view",
  },
];
