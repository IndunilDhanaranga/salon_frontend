"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { message } from "@/lib/format";
import type { Session, Staff } from "@/lib/types";
import { canPermission } from "@/lib/access";
import type { FormKind } from "@/features/business/workspace/components/workspace-forms";
import { firstView, type View } from "./navigation";
import { emptyWorkspace, useWorkspaceData } from "./use-workspace-data";

export function useWorkspace() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [slug, setSlug] = useState("");
  const [platform, setPlatform] = useState(false);
  const [branchId, setBranchId] = useState<string>("all");
  const [view, setView] = useState<View>("workspace");
  const [busy, setBusy] = useState(false);
  const [initialError, setInitialError] = useState("");
  const [sessionNotice, setSessionNotice] = useState("");
  const [form, setForm] = useState<FormKind | null>(null);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const business = useWorkspaceData(
    slug,
    platform,
    branchId,
    setSession,
    setView,
  );
  const tenant = session?.tenants.find((item) => item.slug === slug);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const resetSession = useCallback(
    (notice?: string) => {
      business.clear();
      sessionRef.current = null;
      setSession(null);
      setSlug("");
      setPlatform(false);
      setBranchId("all");
      setView("workspace");
      setForm(null);
      setEditing(null);
      setTourOpen(false);
      setInitialError("");
      setSessionNotice(notice ?? "");
    },
    [business.clear],
  );

  const authenticate = useCallback((value: Session, startTour = false) => {
    sessionRef.current = value;
    setSession(value);
    setSlug(value.tenants[0]?.slug ?? "");
    setPlatform(value.user.is_platform_admin);
    setBranchId("all");
    setView(firstView(value.tenants[0]));
    setInitialError("");
    setSessionNotice("");
    setTourOpen(startTour);
  }, []);
  useEffect(() => {
    let active = true;
    api<Session>("me")
      .then((value) => {
        if (active) authenticate(value);
      })
      .catch((error) => {
        if (active && !(error instanceof ApiError && error.status === 401))
          setInitialError(message(error));
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, [authenticate]);

  useEffect(() => {
    if (session) return;
    setSlug("");
    setPlatform(false);
    setForm(null);
    setEditing(null);
    setTourOpen(false);
  }, [session]);
  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      if (!sessionRef.current) return;
      const customEvent = event as CustomEvent<{ message?: string }>;
      resetSession(
        customEvent.detail?.message ||
          "Your session has expired. Please sign in again.",
      );
    };
    window.addEventListener("salon:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("salon:unauthorized", handleUnauthorized);
  }, [resetSession]);

  useEffect(() => {
    if (!session?.expires_at) return;
    const remaining = Date.parse(session.expires_at) - Date.now();
    if (remaining <= 0) {
      resetSession("Your session has expired. Please sign in again.");
      return;
    }
    const timer = window.setTimeout(
      () => {
        resetSession("Your session has expired. Please sign in again.");
      },
      Math.min(remaining, 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [session?.expires_at, resetSession]);

  useEffect(() => {
    if (!session) return;
    // 60 minutes of inactivity before expiring idle sessions
    const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
    let idleTimer: number;

    const resetIdle = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (sessionRef.current) {
          void api("logout", { method: "POST" }).catch(() => null);
          resetSession(
            "Your session expired due to inactivity. Please sign in again.",
          );
        }
      }, IDLE_TIMEOUT_MS);
    };

    resetIdle();
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    for (const ev of events) {
      window.addEventListener(ev, resetIdle, { passive: true });
    }
    return () => {
      window.clearTimeout(idleTimer);
      for (const ev of events) {
        window.removeEventListener(ev, resetIdle);
      }
    };
  }, [session, resetSession]);

  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(() => {
      if (document.hidden || !sessionRef.current) return;
      void api<Session>("me")
        .then((next) => {
          const previous = sessionRef.current;
          if (!previous) return;
          if (JSON.stringify(previous) !== JSON.stringify(next)) {
            sessionRef.current = next;
            setSession(next);
            if (!next.user.is_platform_admin && platform) setPlatform(false);
          }
        })
        .catch((error) => {
          if (error instanceof ApiError && error.status === 401) {
            resetSession("Your session has expired. Please sign in again.");
          }
        });
    }, 120_000);
    return () => window.clearInterval(interval);
  }, [session, platform, resetSession]);

  useEffect(() => {
    const recheck = () => {
      if (!sessionRef.current || document.hidden) return;
      void api<Session>("me")
        .then((next) => {
          const previous = sessionRef.current;
          if (!previous) return;
          if (JSON.stringify(previous) !== JSON.stringify(next)) {
            business.clear();
            setForm(null);
            setEditing(null);
            sessionRef.current = next;
            setSession(next);
            if (!next.user.is_platform_admin) setPlatform(false);
            void business.refresh();
          }
        })
        .catch((error) => {
          if (error instanceof ApiError && error.status === 401) {
            resetSession("Your session has expired. Please sign in again.");
          }
        });
    };
    window.addEventListener("focus", recheck);
    return () => window.removeEventListener("focus", recheck);
  }, [business.clear, business.refresh, resetSession]);

  useEffect(() => {
    if (!tenant?.subscription?.access_allowed || platform) return;
    const delay =
      Date.parse(tenant.subscription.current_period_end) - Date.now();
    if (delay <= 0) {
      void business.refresh();
      return;
    }
    const timer = window.setTimeout(
      () => {
        setForm(null);
        setEditing(null);
        setTourOpen(false);
        void business.refresh();
      },
      Math.min(delay + 50, 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [
    tenant?.subscription?.current_period_end,
    tenant?.subscription?.access_allowed,
    platform,
    business.refresh,
  ]);

  function selectTenant(value: string) {
    business.clear();
    setForm(null);
    setEditing(null);
    setTourOpen(false);
    setSlug(value);
    setBranchId("all");
    setView(firstView(session?.tenants.find((item) => item.slug === value)));
  }
  function selectBranch(value: string) {
    business.clear();
    setForm(null);
    setEditing(null);
    setTourOpen(false);
    setBranchId(value);
  }
  function selectPlatform(value: boolean) {
    business.clear();
    setForm(null);
    setEditing(null);
    setTourOpen(false);
    setPlatform(value);
  }
  async function completeBranchSetup() {
    const userId = sessionRef.current?.user.id;
    const next = await api<Session>("me");
    if (!userId || sessionRef.current?.user.id !== userId) return;
    const selected = next.tenants.find((item) => item.slug === slug);
    if (!selected || selected.needs_branch_setup) {
      throw new ApiError(
        "Branch setup is not complete. Refresh your workspace and try again.",
        409,
      );
    }
    business.clear();
    sessionRef.current = next;
    setSession(next);
    setForm(null);
    setEditing(null);
    setView(firstView(selected));
    await business.refresh();
  }
  async function logout() {
    setBusy(true);
    business.setError("");
    try {
      await api<void>("logout", { method: "POST" });
      resetSession();
    } catch (error) {
      if (error instanceof ApiError && [401, 502].includes(error.status)) {
        resetSession();
      } else business.setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  async function updateStatus(id: string, status: "completed" | "cancelled") {
    setBusy(true);
    business.setError("");
    try {
      await api(`appointments/${id}`, {
        method: "PATCH",
        tenant: slug,
        body: { status },
      });
      await business.refresh();
    } catch (error) {
      business.setError(message(error));
      if (error instanceof ApiError && error.status === 403)
        await business.refresh();
    } finally {
      setBusy(false);
    }
  }
  function openForm(kind: FormKind) {
    const permission =
      kind === "staff"
        ? "staff.manage"
        : kind === "payroll"
          ? "payroll.manage"
          : "appointments.manage";
    if (!tenant || !canPermission(tenant, permission)) return;
    setEditing(null);
    setForm(kind);
  }
  function editStaff(person: Staff) {
    setEditing(person);
    setForm("staff");
  }
  const data =
    tenant && business.data.tenantId === tenant.id
      ? business.data
      : emptyWorkspace;

  useEffect(() => {
    if (
      !data.hasAllBranchesAccess &&
      data.activeBranchId &&
      branchId === "all"
    ) {
      setBranchId(data.activeBranchId);
    }
  }, [data.hasAllBranchesAccess, data.activeBranchId, branchId]);

  return {
    session,
    initializing,
    tenant,
    platform,
    branchId,
    setBranchId: selectBranch,
    branches: data.branches,
    activeBranchId: data.activeBranchId,
    hasAllBranchesAccess: data.hasAllBranchesAccess,
    view,
    setView,
    busy,
    initialError,
    sessionNotice,
    form,
    editing,
    tourOpen,
    setTourOpen,
    setForm,
    ...business,
    data,
    authenticate,
    selectTenant,
    selectPlatform,
    completeBranchSetup,
    logout,
    updateStatus,
    openForm,
    editStaff,
  };
}
