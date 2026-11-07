"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { message } from "@/lib/format";
import { canPermission, hasBusinessAccess } from "@/lib/access";
import type {
  Appointment,
  AppointmentOptions,
  BookingStaff,
  Branch,
  BranchesResponse,
  Dashboard,
  ListResponse,
  PayrollRun,
  Session,
  Staff,
} from "@/lib/types";
import { canView, firstView, type View } from "../config/navigation";

export interface WorkspaceData {
  tenantId: string;
  dashboard: Dashboard | null;
  appointments: Appointment[];
  payroll: PayrollRun[];
  staff: Staff[];
  bookingStaff: BookingStaff[];
  branches: Branch[];
  activeBranchId: string | null;
  hasAllBranchesAccess: boolean;
}

export const emptyWorkspace: WorkspaceData = {
  tenantId: "",
  dashboard: null,
  appointments: [],
  payroll: [],
  staff: [],
  bookingStaff: [],
  branches: [],
  activeBranchId: null,
  hasAllBranchesAccess: true,
};

export function useBusinessData(
  slug: string,
  platform: boolean,
  branchId: string,
  setSession: (session: Session | null) => void,
  setView: (update: (view: View) => View) => void,
) {
  const [data, setData] = useState(emptyWorkspace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const epoch = useRef(0);

  const clear = useCallback(() => {
    epoch.current++;
    setData(emptyWorkspace);
    setError("");
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const version = ++epoch.current;
    setData(emptyWorkspace);
    setError("");
    if (!slug || platform) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Re-read authorization before requesting sensitive business resources.
      const session = await api<Session>("me");
      if (version !== epoch.current) return;
      setSession(session);
      const tenant = session.tenants.find((item) => item.slug === slug);
      if (!tenant)
        throw new ApiError("Your access to this salon has been removed.", 403);
      if (tenant.status !== "active")
        throw new ApiError(
          "This salon is suspended. Contact the platform administrator.",
          403,
        );
      setView((current) =>
        canView(current, tenant) ? current : firstView(tenant),
      );
      if (!hasBusinessAccess(tenant) || tenant.needs_branch_setup) {
        setData({ ...emptyWorkspace, tenantId: tenant.id });
        return;
      }
      const can = (permission: string) => canPermission(tenant, permission);
      const branchParam = branchId && branchId !== "all" ? branchId : undefined;
      const [dashboard, appointments, payroll, staff, options, branchesRes] =
        await Promise.all([
          can("dashboard.view")
            ? api<Dashboard>("dashboard", { tenant: slug, branch: branchParam })
            : Promise.resolve(null),
          can("appointments.view")
            ? api<ListResponse<Appointment>>("appointments", {
                tenant: slug,
                branch: branchParam,
              })
            : Promise.resolve({ data: [] }),
          can("payroll.view")
            ? api<ListResponse<PayrollRun>>("payroll", {
                tenant: slug,
                branch: branchParam,
              })
            : Promise.resolve({ data: [] }),
          can("staff.view")
            ? api<ListResponse<Staff>>("staff", {
                tenant: slug,
                branch: branchParam,
              })
            : Promise.resolve({ data: [] }),
          can("appointments.manage")
            ? api<AppointmentOptions>("appointment-options", {
                tenant: slug,
                branch: branchParam,
              })
            : Promise.resolve({ staff: [] }),
          can("branches.view") || can("dashboard.view")
            ? api<BranchesResponse>("branches", {
                tenant: slug,
                branch: branchParam,
              }).catch(() => null)
            : Promise.resolve(null),
        ]);
      if (version === epoch.current)
        setData({
          tenantId: tenant.id,
          dashboard,
          appointments: appointments.data,
          payroll: payroll.data,
          staff: staff.data,
          bookingStaff: options.staff,
          branches: branchesRes?.data ?? dashboard?.branches ?? [],
          activeBranchId:
            branchesRes?.active_branch_id ??
            dashboard?.active_branch_id ??
            null,
          hasAllBranchesAccess: branchesRes?.has_all_access ?? true,
        });
    } catch (error) {
      if (version !== epoch.current) return;
      setData(emptyWorkspace);
      setError(message(error));
      if (error instanceof ApiError && error.status === 401) setSession(null);
      if (error instanceof ApiError && [403, 409].includes(error.status)) {
        // Membership may have changed between the session and resource reads.
        const session = await api<Session>("me").catch(() => null);
        if (version === epoch.current && session) setSession(session);
      }
    } finally {
      if (version === epoch.current) setLoading(false);
    }
  }, [slug, platform, branchId, setSession, setView]);

  useEffect(() => {
    void refresh();
    return () => {
      epoch.current++;
    };
  }, [refresh]);

  return { data, loading, error, setError, refresh, clear };
}
