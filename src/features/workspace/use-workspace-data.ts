"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { message } from "@/lib/format";
import { canPermission, hasBusinessAccess } from "@/lib/access";
import type {
  Appointment,
  AppointmentOptions,
  BookingStaff,
  Dashboard,
  ListResponse,
  PayrollRun,
  Session,
  Staff,
} from "@/lib/types";
import { canView, firstView, type View } from "./navigation";

export interface WorkspaceData {
  tenantId: string;
  dashboard: Dashboard | null;
  appointments: Appointment[];
  payroll: PayrollRun[];
  staff: Staff[];
  bookingStaff: BookingStaff[];
}
export const emptyWorkspace: WorkspaceData = {
  tenantId: "",
  dashboard: null,
  appointments: [],
  payroll: [],
  staff: [],
  bookingStaff: [],
};

export function useWorkspaceData(
  slug: string,
  platform: boolean,
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
      if (!hasBusinessAccess(tenant)) {
        setData({ ...emptyWorkspace, tenantId: tenant.id });
        return;
      }
      const can = (permission: string) => canPermission(tenant, permission);
      const [dashboard, appointments, payroll, staff, options] =
        await Promise.all([
          can("dashboard.view")
            ? api<Dashboard>("dashboard", { tenant: slug })
            : Promise.resolve(null),
          can("appointments.view")
            ? api<ListResponse<Appointment>>("appointments", { tenant: slug })
            : Promise.resolve({ data: [] }),
          can("payroll.view")
            ? api<ListResponse<PayrollRun>>("payroll", { tenant: slug })
            : Promise.resolve({ data: [] }),
          can("staff.view")
            ? api<ListResponse<Staff>>("staff", { tenant: slug })
            : Promise.resolve({ data: [] }),
          can("appointments.manage")
            ? api<AppointmentOptions>("appointment-options", { tenant: slug })
            : Promise.resolve({ staff: [] }),
        ]);
      if (version === epoch.current)
        setData({
          tenantId: tenant.id,
          dashboard,
          appointments: appointments.data,
          payroll: payroll.data,
          staff: staff.data,
          bookingStaff: options.staff,
        });
    } catch (error) {
      if (version !== epoch.current) return;
      setData(emptyWorkspace);
      setError(message(error));
      if (error instanceof ApiError && error.status === 401) setSession(null);
      if (error instanceof ApiError && error.status === 403) {
        // Membership may have changed between the session and resource reads.
        const session = await api<Session>("me").catch(() => null);
        if (version === epoch.current && session) setSession(session);
      }
    } finally {
      if (version === epoch.current) setLoading(false);
    }
  }, [slug, platform, setSession, setView]);

  useEffect(() => {
    void refresh();
    return () => {
      epoch.current++;
    };
  }, [refresh]);
  return { data, loading, error, setError, refresh, clear };
}
