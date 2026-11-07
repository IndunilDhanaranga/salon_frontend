import type { Tenant } from "@/lib/types";
import { canPermission, hasBusinessAccess } from "@/lib/access";
import {
  CalendarDays,
  LayoutDashboard,
  BarChart3,
  Users,
  Wallet,
  Building2,
  Package,
  Receipt,
  ShieldCheck,
  Coins,
  CreditCard,
} from "lucide-react";

export type View =
  | "overview"
  | "reports"
  | "branches"
  | "appointments"
  | "team"
  | "catalog"
  | "pos"
  | "billing"
  | "deductions"
  | "payroll"
  | "access"
  | "subscription"
  | "workspace";

export const viewPermissions: Partial<Record<View, string>> = {
  overview: "dashboard.view",
  reports: "reports.view",
  branches: "branches.view",
  appointments: "appointments.view",
  team: "staff.view",
  catalog: "catalog.view",
  pos: "orders.view",
  billing: "orders.view",
  deductions: "deductions.view",
  payroll: "payroll.view",
  access: "access.manage",
};

export const BUSINESS_NAV_ITEMS = [
  {
    id: "overview" as View,
    name: "Overview",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    id: "branches" as View,
    name: "Branches",
    icon: Building2,
    permission: "branches.view",
  },
  {
    id: "appointments" as View,
    name: "Appointments",
    icon: CalendarDays,
    permission: "appointments.view",
  },
  {
    id: "team" as View,
    name: "Team",
    icon: Users,
    permission: "staff.view",
  },
  {
    id: "catalog" as View,
    name: "Services & products",
    icon: Package,
    permission: "catalog.view",
  },
  {
    id: "pos" as View,
    name: "Point of Sale (POS)",
    icon: CreditCard,
    permission: "orders.view",
  },
  {
    id: "billing" as View,
    name: "Customer bills",
    icon: Receipt,
    permission: "orders.view",
  },
  {
    id: "deductions" as View,
    name: "Deductions",
    icon: Coins,
    permission: "deductions.view",
  },
  {
    id: "payroll" as View,
    name: "Payroll",
    icon: Wallet,
    permission: "payroll.view",
  },
  {
    id: "reports" as View,
    name: "Reports",
    icon: BarChart3,
    permission: "reports.view",
  },
  {
    id: "access" as View,
    name: "Roles & access",
    icon: ShieldCheck,
    permission: "access.manage",
  },
] as const;

export function canView(view: View, tenant: Tenant) {
  if (view === "subscription" || view === "workspace") return true;
  const permission = viewPermissions[view];
  return !!permission && canPermission(tenant, permission);
}

export function firstView(tenant?: Tenant): View {
  if (!tenant) return "workspace";
  if (!hasBusinessAccess(tenant)) return "subscription";
  if (tenant.needs_branch_setup) return "workspace";
  return (
    (Object.entries(viewPermissions).find(
      ([, permission]) => permission && canPermission(tenant, permission),
    )?.[0] as View | undefined) ?? "workspace"
  );
}

export const viewTitles: Record<
  View,
  { label: string; title: string; description: string }
> = {
  subscription: {
    label: "YOUR PLAN & MEMBERSHIP",
    title: "Room for your business to grow.",
    description: "Your free trial, current plan, and subscription dates.",
  },
  overview: {
    label: "YOUR DAILY EDIT",
    title: "A good day starts here.",
    description: "A little clarity for everything ahead.",
  },
  reports: {
    label: "SALON ANALYTICS & INSIGHTS",
    title: "Reports & Financials",
    description:
      "Detailed sales, staff performance, services, and salon financial analysis.",
  },
  branches: {
    label: "MULTI-BRANCH MANAGEMENT",
    title: "Branches & Locations",
    description:
      "Manage multiple salon branches, active status, and dynamic package pricing.",
  },
  appointments: {
    label: "KEEP THE DAY MOVING",
    title: "Every appointment, in order.",
    description: "From the first hello to the finishing touches.",
  },
  team: {
    label: "THE PEOPLE WHO MAKE IT",
    title: "Good people. Great work.",
    description: "Keep your team and compensation details together.",
  },
  catalog: {
    label: "YOUR BUSINESS, BEAUTIFULLY LISTED",
    title: "A place for everything you offer.",
    description: "Services, products, and prices that work for your salon.",
  },
  pos: {
    label: "POINT OF SALE",
    title: "Fast, flexible checkout.",
    description:
      "Build an itemized customer bill from your salon services and products.",
  },
  billing: {
    label: "A GOOD FINISH TO EVERY VISIT",
    title: "From the chair to the checkout.",
    description: "Itemized bills and a clear record of customer payments.",
  },
  deductions: {
    label: "EXPENSES & ADVANCES",
    title: "Deductions & Advances",
    description:
      "Daily salon deductions, operating expenses, and staff salary advances.",
  },
  payroll: {
    label: "LOOK AFTER YOUR PEOPLE",
    title: "A clearer path to payday.",
    description: "Monthly drafts, with the details in view.",
  },
  access: {
    label: "THE RIGHT ACCESS",
    title: "A role for everyone.",
    description: "Decide who can see and manage your business.",
  },
  workspace: {
    label: "YOUR SPACE TO GROW",
    title: "Made for your business.",
    description: "The essentials behind your salon workspace.",
  },
};
