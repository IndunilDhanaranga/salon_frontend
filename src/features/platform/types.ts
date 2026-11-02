import type { Plan, PlatformRole } from "@/lib/types";

export type PlatformTab =
  | "dashboard"
  | "reports"
  | "businesses"
  | "plans"
  | "subscriptions"
  | "access"
  | "accounts";

export type PlanValues = Pick<
  Plan,
  | "name"
  | "description"
  | "price_minor"
  | "currency"
  | "billing_interval"
  | "active"
  | "features"
>;

export type SubscriptionUpdate =
  | { status: "active"; plan_id: string; current_period_end: string }
  | { status: "cancelled" };

export interface PlatformRoleValues {
  name: string;
  description?: string;
  permissions: string[];
}
