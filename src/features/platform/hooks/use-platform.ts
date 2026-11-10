"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { message } from "@/lib/format";
import type {
  AdminPlansResponse,
  AdminTenantSubscriptionResponse,
  PlatformAccessResponse,
  PlatformDashboard,
  PlatformPaymentSettings,
  PlatformReportsResponse,
  SubscriptionRenewal,
  Session,
} from "@/lib/types";
import { playFacebookNotificationSound } from "@/lib/device-registry";
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
  const [paymentSettings, setPaymentSettings] =
    useState<PlatformPaymentSettings | null>(null);
  const [renewals, setRenewals] = useState<SubscriptionRenewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [newRenewalAlert, setNewRenewalAlert] = useState<string | null>(null);

  const permissions = session?.user?.platform_permissions ?? [];
  const hasPerm = useCallback(
    (perm: string) => {
      if (session?.user.is_platform_admin && perm === "platform.settings.manage") {
        return true;
      }
      return !!session?.user.is_platform_admin && permissions.includes(perm);
    },
    [session?.user.is_platform_admin, permissions],
  );

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const promises: Promise<unknown>[] = [];
        if (
          [
            "platform.dashboard.view",
            "platform.tenants.view",
            "platform.subscriptions.manage",
            "platform.users.view",
          ].some(hasPerm)
        ) {
          promises.push(
            api<PlatformDashboard>("admin/dashboard", { signal }).then(setData),
          );
        }

        if (hasPerm("platform.plans.view")) {
          promises.push(
            api<AdminPlansResponse>("admin/plans", { signal }).then(setPlans),
          );
        }

        if (hasPerm("platform.reports.view")) {
          promises.push(
            api<PlatformReportsResponse>("admin/reports", { signal }).then(
              setReports,
            ),
          );
        }

        if (hasPerm("platform.access.manage")) {
          promises.push(
            api<PlatformAccessResponse>("admin/access", { signal }).then(
              setAccess,
            ),
          );
        }

        if (hasPerm("platform.settings.manage")) {
          promises.push(
            api<PlatformPaymentSettings>("admin/payment-settings", { signal }).then(
              setPaymentSettings,
            ),
          );
        }

        if (
          hasPerm("platform.subscriptions.manage") ||
          hasPerm("platform.dashboard.view")
        ) {
          promises.push(
            api<{ data: SubscriptionRenewal[] }>("admin/renewals", { signal })
              .then((res) => {
                if (Array.isArray(res?.data)) {
                  setRenewals(res.data);
                }
              })
              .catch(() => {
                // Ignore if renewals endpoint empty
              }),
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
    [hasPerm, onLogout],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Real-time listener for incoming renewal submissions
  useEffect(() => {
    if (typeof window === "undefined") return;

    let ch: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        ch = new BroadcastChannel("salon_platform_push");
        ch.onmessage = (event) => {
          const payload = event.data;
          if (payload && payload.title) {
            playFacebookNotificationSound();
            setNewRenewalAlert(payload.title);
            void load();
          }
        };
      } catch {
        // BroadcastChannel fallback
      }
    }

    const handleCustomRenewal = () => {
      playFacebookNotificationSound();
      void load();
    };
    window.addEventListener("salon:renewal_submitted", handleCustomRenewal);

    return () => {
      if (ch) ch.close();
      window.removeEventListener("salon:renewal_submitted", handleCustomRenewal);
    };
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

  const pendingRenewalsCount = renewals.filter(
    (r) => r.status === "pending",
  ).length;

  return {
    data,
    plans,
    reports,
    access,
    paymentSettings,
    renewals,
    pendingRenewalsCount,
    newRenewalAlert,
    setNewRenewalAlert,
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
    reviewRenewal: (
      renewalId: string,
      status: "approved" | "rejected",
      review_notes?: string,
    ) =>
      mutate(`admin/renewals/${renewalId}`, { status, review_notes }, "PATCH"),
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
    savePaymentSettings: (values: PlatformPaymentSettings) =>
      mutate("admin/payment-settings", values),
  };
}
