import type { Tenant } from "@/lib/types";
import { canPermission, hasBusinessAccess } from "@/lib/access";

export type View =
  | "overview"
  | "reports"
  | "appointments"
  | "team"
  | "catalog"
  | "billing"
  | "deductions"
  | "payroll"
  | "access"
  | "subscription"
  | "workspace";
export const viewPermissions: Partial<Record<View, string>> = {
  overview: "dashboard.view",
  reports: "dashboard.view",
  appointments: "appointments.view",
  team: "staff.view",
  catalog: "catalog.view",
  billing: "orders.view",
  deductions: "deductions.view",
  payroll: "payroll.view",
  access: "access.manage",
};

export function canView(view: View, tenant: Tenant) {
  if (view === "subscription" || view === "workspace") return true;
  const permission = viewPermissions[view];
  return !!permission && canPermission(tenant, permission);
}

export function firstView(tenant?: Tenant): View {
  if (!tenant) return "workspace";
  if (!hasBusinessAccess(tenant)) return "subscription";
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
    description: "Detailed sales, staff performance, services, and salon financial analysis.",
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
  billing: {
    label: "A GOOD FINISH TO EVERY VISIT",
    title: "From the chair to the checkout.",
    description: "Itemized bills and a clear record of customer payments.",
  },
  deductions: {
    label: "EXPENSES & ADVANCES",
    title: "Deductions & Advances",
    description: "Daily salon deductions, operating expenses, and staff salary advances.",
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
