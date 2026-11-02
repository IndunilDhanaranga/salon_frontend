"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { message } from "@/lib/format";
import type {
  AdminPlansResponse,
  AdminTenantSubscriptionResponse,
  PlatformAccessResponse,
  PlatformDashboard,
  PlatformReportsResponse,
  Session,
} from "@/lib/types";
import type {
  PlanValues,
  PlatformRoleValues,
  SubscriptionUpdate,
} from "../types";

export function usePlatform(session?: Session, onLogout?: () => void) {
  const [data, setData] = useState<PlatformDashboard | null>(null);
  const [plans, setPlans] = useState<AdminPlansResponse | null>(null);
  const [reports, setReports] = useState<PlatformReportsResponse | null>(null);
  const [access, setAccess] = useState<PlatformAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const permissions = session?.user?.platform_permissions ?? [];
  const isSuperAdmin =
    !session?.user?.platform_role_id ||
    session?.user?.platform_role === "Super Administrator";

  const hasPerm = useCallback(
    (perm: string) => {
      if (isSuperAdmin) return true;
      return permissions.includes(perm);
    },
    [isSuperAdmin, permissions],
  );

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const promises: Promise<unknown>[] = [
          api<PlatformDashboard>("admin/dashboard", { signal }).then(setData),
        ];

        if (hasPerm("platform.plans.view")) {
          promises.push(
            api<AdminPlansResponse>("admin/plans", { signal })
              .then(setPlans)
              .catch(() => null),
          );
        }

        if (hasPerm("platform.reports.view")) {
          promises.push(
            api<PlatformReportsResponse>("admin/reports", { signal })
              .then(setReports)
              .catch(() => null),
          );
        }

        if (hasPerm("platform.access.manage")) {
          promises.push(
            api<PlatformAccessResponse>("admin/access", { signal })
              .then(setAccess)
              .catch(() => null),
          );
        }

        await Promise.all(promises);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          onLogout?.();
          return;
        }
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(message(err));
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [hasPerm],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function mutate(
    path: string,
    body?: unknown,
    method: "POST" | "PATCH" | "DELETE" = "PATCH",
  ) {
    setPending(true);
    setError("");
    try {
      const res = await api(path, { method, body });
      await load();
      return res;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLogout?.();
      }
      setError(message(err));
      throw err;
    } finally {
      setPending(false);
    }
  }

  return {
    data,
    plans,
    reports,
    access,
    loading,
    pending,
    error,
    setError,
    load,
    hasPerm,
    toggleBusiness: (id: string, status: "active" | "suspended") =>
      mutate(`admin/tenants/${id}`, { status }),
    savePlan: (values: PlanValues, id?: string) =>
      mutate(
        id ? `admin/plans/${id}` : "admin/plans",
        values,
        id ? "PATCH" : "POST",
      ),
    archivePlan: (id: string, active: boolean) =>
      mutate(`admin/plans/${id}`, { active }),
    saveSubscription: (id: string, values: SubscriptionUpdate) =>
      mutate(`admin/tenants/${id}/subscription`, values),
    extendTrial: (tenantId: string, days: number = 30) =>
      mutate(`admin/tenants/${tenantId}/subscription/trial`, { days }, "POST"),
    fetchSubscriptionDetail: (tenantId: string) =>
      api<AdminTenantSubscriptionResponse>(
        `admin/tenants/${tenantId}/subscription`,
      ),
    saveRole: (values: PlatformRoleValues, id?: string) =>
      mutate(
        id ? `admin/access/roles/${id}` : "admin/access/roles",
        values,
        id ? "PATCH" : "POST",
      ),
    deleteRole: (id: string) =>
      mutate(`admin/access/roles/${id}`, undefined, "DELETE"),
    assignUserRole: (
      userId: string,
      is_platform_admin: boolean,
      platform_role_id?: string | null,
    ) =>
      mutate(`admin/users/${userId}/role`, {
        is_platform_admin,
        platform_role_id,
      }),
  };
}
