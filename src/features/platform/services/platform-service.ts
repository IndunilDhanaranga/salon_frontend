import { api } from "@/lib/api";
import type {
  AdminPlansResponse,
  AdminTenantSubscriptionResponse,
  PlatformAccessResponse,
  PlatformDashboard,
  PlatformReportsResponse,
} from "@/lib/types";
import type {
  PlanValues,
  PlatformRoleValues,
  SubscriptionUpdate,
} from "../types";

export const platformService = {
  fetchDashboard(signal?: AbortSignal) {
    return api<PlatformDashboard>("admin/dashboard", { signal });
  },

  fetchPlans(signal?: AbortSignal) {
    return api<AdminPlansResponse>("admin/plans", { signal });
  },

  fetchReports(signal?: AbortSignal) {
    return api<PlatformReportsResponse>("admin/reports", { signal });
  },

  fetchAccess(signal?: AbortSignal) {
    return api<PlatformAccessResponse>("admin/access", { signal });
  },

  toggleTenantStatus(tenantId: string, status: "active" | "suspended") {
    return api(`admin/tenants/${tenantId}`, {
      method: "PATCH",
      body: { status },
    });
  },

  savePlan(values: PlanValues, id?: string) {
    return api(id ? `admin/plans/${id}` : "admin/plans", {
      method: id ? "PATCH" : "POST",
      body: values,
    });
  },

  archivePlan(id: string, active: boolean) {
    return api(`admin/plans/${id}`, {
      method: "PATCH",
      body: { active },
    });
  },

  fetchSubscriptionDetail(tenantId: string) {
    return api<AdminTenantSubscriptionResponse>(
      `admin/tenants/${tenantId}/subscription`,
    );
  },

  saveSubscription(tenantId: string, values: SubscriptionUpdate) {
    return api(`admin/tenants/${tenantId}/subscription`, {
      method: "PATCH",
      body: values,
    });
  },

  extendTrial(tenantId: string, days = 30) {
    return api(`admin/tenants/${tenantId}/subscription`, {
      method: "PATCH",
      body: { action: "extend_trial", extend_trial_days: days },
    });
  },

  saveRole(values: PlatformRoleValues, id?: string) {
    return api(id ? `admin/access/roles/${id}` : "admin/access/roles", {
      method: id ? "PATCH" : "POST",
      body: values,
    });
  },

  deleteRole(id: string) {
    return api(`admin/access/roles/${id}`, {
      method: "DELETE",
    });
  },

  assignUserRole(userId: string, platformRoleId: string | null) {
    return api(`admin/users/${userId}/role`, {
      method: "PATCH",
      body: { platform_role_id: platformRoleId },
    });
  },
};
