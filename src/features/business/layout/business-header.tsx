"use client";

import React from "react";
import { Plus, RefreshCw } from "lucide-react";
import type { Branch, Tenant } from "@/lib/types";
import { canPermission } from "@/lib/access";
import { viewTitles, type View } from "../config/navigation";
import { useTranslation, LanguageDropdown } from "@/lib/i18n";
import { BranchDropdown } from "../workspace/components/branch-dropdown";
import { NotificationBell } from "../notifications/components/notification-bell";
import type { FormKind } from "../types";

export function BusinessHeader({
  tenant,
  view,
  loading,
  busy,
  onRefresh,
  onForm,
  branches,
  activeBranchId,
  selectedBranchId,
  hasAllBranchesAccess,
  onSelectBranch,
  onManageBranches,
}: {
  tenant: Tenant;
  view: View;
  loading: boolean;
  busy: boolean;
  onRefresh: () => void;
  onForm: (kind: FormKind) => void;
  branches?: Branch[];
  activeBranchId?: string | null;
  selectedBranchId?: string;
  hasAllBranchesAccess?: boolean;
  onSelectBranch?: (id: string) => void;
  onManageBranches?: () => void;
}) {
  const { t, language } = useTranslation();
  const heading = t.headings[view] ?? viewTitles[view];
  const can = (permission: string) => canPermission(tenant, permission);

  const action =
    view === "team" && can("staff.manage")
      ? { label: t.actions.addTeamMember, kind: "staff" as const }
      : view === "payroll" && can("payroll.manage")
        ? { label: t.actions.generatePayroll, kind: "payroll" as const }
        : (view === "overview" || view === "appointments") &&
            can("appointments.manage")
          ? { label: t.actions.newAppointment, kind: "appointment" as const }
          : null;

  const viewLabel =
    view === "overview"
      ? t.topbar.overview
      : view === "access"
        ? t.topbar.rolesAndAccess
        : (t.nav as Record<string, string>)[view] ||
          heading.label.toLowerCase();

  return (
    <>
      <div className="topbar">
        <span>
          {tenant.name}
          <span className="topbar-slash">/</span>
          {viewLabel}
        </span>
        <div className="topbar-right">
          <NotificationBell />
          {branches && branches.length > 0 && onSelectBranch && (
            <BranchDropdown
              branches={branches}
              activeBranchId={activeBranchId ?? null}
              selectedBranchId={selectedBranchId ?? "all"}
              hasAllBranchesAccess={hasAllBranchesAccess ?? true}
              onSelectBranch={onSelectBranch}
              onManageBranches={onManageBranches}
              disabled={loading || busy}
            />
          )}
          <LanguageDropdown />
          <span className="topbar-date">
            {new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en", {
              timeZone: tenant.timezone,
              weekday: "short",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </span>
        </div>
      </div>

      {view !== "pos" && (
        <header className="page-heading">
          <div>
            <h1>{heading.title}</h1>
            <p>{heading.description}</p>
          </div>
          <div className="heading-actions">
            <button
              className="icon-button refresh-button"
              aria-label="Refresh workspace"
              disabled={loading || busy}
              onClick={onRefresh}
            >
              <RefreshCw
                size={18}
                strokeWidth={1.7}
                className={loading || busy ? "spin" : ""}
              />
            </button>
            {action && (
              <button
                className="button primary"
                disabled={loading || busy}
                onClick={() => onForm(action.kind)}
              >
                <Plus size={16} strokeWidth={2.4} />
                <span>{action.label}</span>
              </button>
            )}
          </div>
        </header>
      )}
    </>
  );
}
