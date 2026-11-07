"use client";

import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Menu,
  X,
  Plus,
} from "lucide-react";
import type { Tenant } from "@/lib/types";
import { canPermission } from "@/lib/access";
import { useTranslation } from "@/lib/i18n";
import type { View } from "../config/navigation";

export function BusinessBottomNav({
  view,
  tenant,
  onView,
  onMenuToggle,
  menuOpen,
}: {
  view: View;
  tenant: Tenant;
  onView: (view: View) => void;
  onMenuToggle: () => void;
  menuOpen: boolean;
}) {
  const { t } = useTranslation();

  const canAppointments = canPermission(tenant, "appointments.view");
  const canOrders = canPermission(tenant, "orders.view");
  const canReports = canPermission(tenant, "reports.view");

  const isOverviewActive = view === "overview" && !menuOpen;
  const isAppointmentsActive = view === "appointments" && !menuOpen;
  const isPosActive = view === "pos" && !menuOpen;
  const isReportsActive = view === "reports" && !menuOpen;

  return (
    <nav className="mobile-bottom-nav" aria-label="Quick mobile navigation">
      <div className="mobile-bottom-nav-inner">
        {/* 1. Overview / Home */}
        <button
          type="button"
          className={`mobile-bottom-nav-item ${isOverviewActive ? "is-active" : ""}`}
          onClick={() => onView("overview")}
          aria-label={t.nav.overview || "Home"}
          aria-current={isOverviewActive ? "page" : undefined}
          title={t.nav.overview || "Home"}
        >
          <div className="nav-icon-wrapper">
            <LayoutDashboard
              size={21}
              strokeWidth={isOverviewActive ? 2.2 : 1.7}
            />
          </div>
          {isOverviewActive && <span className="active-indicator" />}
        </button>

        {/* 2. Appointments / Bookings */}
        {canAppointments && (
          <button
            type="button"
            className={`mobile-bottom-nav-item ${isAppointmentsActive ? "is-active" : ""}`}
            onClick={() => onView("appointments")}
            aria-label={t.nav.appointments || "Bookings"}
            aria-current={isAppointmentsActive ? "page" : undefined}
            title={t.nav.appointments || "Bookings"}
          >
            <div className="nav-icon-wrapper">
              <CalendarDays
                size={21}
                strokeWidth={isAppointmentsActive ? 2.2 : 1.7}
              />
            </div>
            {isAppointmentsActive && <span className="active-indicator" />}
          </button>
        )}

        {/* 3. Center Highlighted Plus Button -> POS (No label needed) */}
        {canOrders && (
          <button
            type="button"
            className={`mobile-bottom-nav-item mobile-bottom-plus-item ${isPosActive ? "is-active" : ""}`}
            onClick={() => onView("pos")}
            aria-label={t.billing.newBill || "New Bill (POS)"}
            aria-current={isPosActive ? "page" : undefined}
            title={t.billing.newBill || "New Bill (POS)"}
          >
            <div className="nav-plus-wrapper">
              <Plus size={24} strokeWidth={2.4} />
            </div>
          </button>
        )}

        {/* 4. Reports */}
        {canReports && (
          <button
            type="button"
            className={`mobile-bottom-nav-item ${isReportsActive ? "is-active" : ""}`}
            onClick={() => onView("reports")}
            aria-label={t.nav.reports || "Reports"}
            aria-current={isReportsActive ? "page" : undefined}
            title={t.nav.reports || "Reports"}
          >
            <div className="nav-icon-wrapper">
              <BarChart3 size={21} strokeWidth={isReportsActive ? 2.2 : 1.7} />
            </div>
            {isReportsActive && <span className="active-indicator" />}
          </button>
        )}

        {/* 5. Menu Drawer Toggle */}
        <button
          type="button"
          className={`mobile-bottom-nav-item ${menuOpen ? "is-active" : ""}`}
          onClick={onMenuToggle}
          aria-label={menuOpen ? t.common.close || "Close" : "Menu"}
          aria-expanded={menuOpen}
          title={menuOpen ? t.common.close || "Close" : "Menu"}
        >
          <div className="nav-icon-wrapper">
            {menuOpen ? (
              <X size={21} strokeWidth={2.2} />
            ) : (
              <Menu size={21} strokeWidth={1.8} />
            )}
          </div>
          {menuOpen && <span className="active-indicator" />}
        </button>
      </div>
    </nav>
  );
}
