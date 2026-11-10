"use client";

import React, { useRef } from "react";
import {
  Scissors,
  Building2,
  SlidersHorizontal,
  Compass,
  ArrowUpRight,
  LogOut,
  X,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import type { Session, Tenant } from "@/lib/types";
import { initials } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { canPermission } from "@/lib/access";
import { BUSINESS_NAV_ITEMS, type View } from "../config/navigation";

export function BusinessSidebar({
  session,
  tenant,
  view,
  busy,
  onView,
  onLogout,
  onPlatform,
  onTour,
  mobileOpen = false,
  onMobileClose,
}: {
  session: Session;
  tenant: Tenant;
  view: View;
  busy: boolean;
  onView: (view: View) => void;
  onLogout: () => void;
  onPlatform?: () => void;
  onTour: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const { t } = useTranslation();
  const drawerRef = useRef<HTMLElement>(null);

  const navLabels: Record<string, string> = {
    overview: t.nav.overview,
    branches: t.nav.branches ?? "Branches",
    appointments: t.nav.appointments,
    pos: t.nav.pos ?? "POS (New Bill)",
    team: t.nav.team,
    catalog: t.nav.catalog,
    billing: t.nav.billing,
    deductions:
      (t.nav as Record<string, string>).deductions ?? "Deductions & Advances",
    payroll: t.nav.payroll,
    reports: t.nav.reports ?? "Reports",
    access: t.nav.access,
  };

  function selectView(value: View) {
    onView(value);
    if (onMobileClose) onMobileClose();
  }

  // Filter accessible items
  const accessibleItems = BUSINESS_NAV_ITEMS.filter((item) =>
    canPermission(tenant, item.permission),
  );

  // Group into Operations and Management
  const operationIds = [
    "overview",
    "appointments",
    "pos",
    "billing",
    "catalog",
    "team",
  ];
  const operationsNav = accessibleItems.filter((i) =>
    operationIds.includes(i.id),
  );
  const managementNav = accessibleItems.filter(
    (i) => !operationIds.includes(i.id),
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "is-open" : ""}`}
        onClick={onMobileClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        ref={drawerRef}
        className={`sidebar ${mobileOpen ? "is-open" : ""}`}
        aria-label="Salon operations sidebar"
      >
        {/* Drawer Header with Close Button */}
        <div className="sidebar-header">
          <a className="brand" href="/" aria-label="Salon home">
            <Scissors size={20} strokeWidth={1.6} />
            <span>
              salon<span className="brand-dot">.</span>
            </span>
          </a>
          {onMobileClose && (
            <button
              type="button"
              className="drawer-close-button"
              onClick={onMobileClose}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Current Workspace */}
        <div className="workspace-select">
          <div className="workspace-select-value" title={tenant.name}>
            {tenant.name}
          </div>
          <span className="workspace-role">
            {tenant.role === "owner" ? t.access.owner : tenant.role}{" "}
            {t.shell.workspaceRole}
          </span>
        </div>

        {/* Scrollable Navigation Area */}
        <nav
          id="business-navigation"
          className="sidebar-scrollable-nav"
          aria-label={t.shell.businessMenu}
        >
          {/* Operations Section */}
          <div className="nav-group-section">
            <span className="nav-group-heading">
              {t.nav.overview ? "OPERATIONS" : "Operations"}
            </span>
            {operationsNav.map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`nav-item ${view === id ? "selected" : ""}`}
                aria-current={view === id ? "page" : undefined}
                onClick={() => selectView(id)}
              >
                <div className="nav-item-icon-title">
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{navLabels[id] ?? name}</span>
                </div>
                <ChevronRight size={14} className="nav-chevron" />
              </button>
            ))}
          </div>

          {/* Management Section */}
          {managementNav.length > 0 && (
            <div className="nav-group-section">
              <span className="nav-group-heading">MANAGEMENT</span>
              {managementNav.map(({ id, name, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`nav-item ${view === id ? "selected" : ""}`}
                  aria-current={view === id ? "page" : undefined}
                  onClick={() => selectView(id)}
                >
                  <div className="nav-item-icon-title">
                    <Icon size={16} strokeWidth={1.8} />
                    <span>{navLabels[id] ?? name}</span>
                  </div>
                  <ChevronRight size={14} className="nav-chevron" />
                </button>
              ))}
            </div>
          )}

          {/* Settings & System Section */}
          <div className="nav-group-section">
            <span className="nav-group-heading">SETTINGS</span>

            <button
              type="button"
              className={`nav-item ${view === "subscription" ? "selected" : ""}`}
              onClick={() => selectView("subscription")}
            >
              <div className="nav-item-icon-title">
                <CreditCard size={16} strokeWidth={1.8} />
                <span>{t.nav.subscription || "Subscription & Plans"}</span>
              </div>
              <ChevronRight size={14} className="nav-chevron" />
            </button>

            <button
              type="button"
              className="nav-item"
              disabled={busy || tenant.status !== "active"}
              onClick={() => {
                if (onMobileClose) onMobileClose();
                onTour();
              }}
            >
              <div className="nav-item-icon-title">
                <Compass size={16} strokeWidth={1.8} />
                <span>{t.nav.takeTour}</span>
              </div>
              <ChevronRight size={14} className="nav-chevron" />
            </button>

            <button
              type="button"
              className={`nav-item ${view === "workspace" ? "selected" : ""}`}
              onClick={() => selectView("workspace")}
            >
              <div className="nav-item-icon-title">
                <SlidersHorizontal size={16} strokeWidth={1.8} />
                <span>{t.nav.workspaceDetails}</span>
              </div>
              <ChevronRight size={14} className="nav-chevron" />
            </button>

            {onPlatform && (
              <button
                type="button"
                className="nav-item platform-switch-item"
                onClick={() => {
                  if (onMobileClose) onMobileClose();
                  onPlatform();
                }}
              >
                <div className="nav-item-icon-title">
                  <Building2 size={16} strokeWidth={1.8} />
                  <span>{t.nav.platformAdmin}</span>
                </div>
                <ArrowUpRight size={14} className="nav-chevron" />
              </button>
            )}
          </div>
        </nav>

        {/* Compact Bottom Profile Section */}
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">{initials(session.user.name)}</span>
            <div className="profile-text">
              <strong>{session.user.name}</strong>
              <span>
                {tenant.role === "owner" ? t.access.owner : tenant.role}
              </span>
            </div>
            <button
              aria-label={t.nav.signOut}
              title={t.nav.signOut}
              className="icon-button logout-button"
              disabled={busy}
              onClick={() => {
                if (onMobileClose) onMobileClose();
                onLogout();
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
