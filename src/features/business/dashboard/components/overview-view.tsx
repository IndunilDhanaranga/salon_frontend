"use client";

import { useState } from "react";
import { canPermission } from "@/lib/access";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Plus,
  Users,
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  Scale,
  HelpCircle,
  Receipt,
  DollarSign,
  Building2,
  Calendar,
} from "lucide-react";
import type { Dashboard, Tenant } from "@/lib/types";
import { initials, money } from "@/lib/format";
import { AppointmentList } from "@/features/business/appointments/components/appointment-list";
import type { View } from "@/features/workspace/navigation";
import { useTranslation } from "@/lib/i18n";

type Props = {
  dashboard: Dashboard;
  tenant: Tenant;
  busy: boolean;
  onView: (view: View) => void;
  onBook: () => void;
  onStatus: (id: string, status: "completed" | "cancelled") => void;
};

export function OverviewView({
  dashboard,
  tenant,
  busy,
  onView,
  onBook,
  onStatus,
}: Props) {
  const { t, language } = useTranslation();
  const metrics = dashboard.metrics;
  const canBook = canPermission(tenant, "appointments.manage");
  const canViewDeductions =
    canPermission(tenant, "deductions.view") ||
    canPermission(tenant, "payroll.view");

  const [positionPeriod, setPositionPeriod] = useState<"month" | "today">("month");

  const pos = dashboard.business_position;

  type StatCard = {
    label: string;
    value: string;
    note: string;
    icon: typeof CalendarDays;
    color?: string;
  };

  // Build top stats cards
  const stats: StatCard[] = [
    {
      label: t.overview.todaysAppointments,
      value: String(metrics.appointments_today),
      note: t.overview.onTheSchedule,
      icon: CalendarDays,
    },
    {
      label: t.overview.completedServices,
      value: String(metrics.completed_today),
      note: t.overview.littleProgress,
      icon: Check,
    },
    {
      label: t.overview.completedServiceValue,
      value: money(metrics.revenue_today_minor, tenant.currency),
      note: t.overview.completedAppointmentsToday,
      icon: Wallet,
    },
  ];

  if (canViewDeductions) {
    stats.push({
      label: t.overview.todayDeductions,
      value: `-${money(metrics.deductions_today_minor ?? 0, tenant.currency)}`,
      note: t.deductions.title,
      icon: Coins,
      color: "#c93b3b",
    });

    const netToday = metrics.net_today_minor ?? (metrics.revenue_today_minor - (metrics.deductions_today_minor ?? 0));
    stats.push({
      label: t.overview.netPositionToday,
      value: `${netToday >= 0 ? "+" : ""}${money(netToday, tenant.currency)}`,
      note: netToday >= 0 ? t.overview.growthStatus : t.overview.lossStatus,
      icon: netToday >= 0 ? TrendingUp : TrendingDown,
      color: netToday >= 0 ? "var(--teal)" : "#c93b3b",
    });
  } else {
    stats.push({
      label: t.overview.yourTeam,
      value: String(metrics.active_staff),
      note: t.overview.activeTeamMembers,
      icon: Users,
      color: undefined,
    });
  }

  return (
    <>
      {/* Top Stats Grid */}
      <section
        className={`stats-grid ${canViewDeductions ? "has-five" : ""}`}
        aria-label={t.overview.todaysAppointments}
      >
        {stats.map(({ label, value, note, icon: Icon, color }) => (
          <article key={label} className="stat">
            <div className="stat-top">
              <span>{label}</span>
              <Icon size={18} strokeWidth={1.6} />
            </div>
            <strong style={color ? { color } : undefined}>{value}</strong>
            <span className="stat-note">{note}</span>
          </article>
        ))}
      </section>

      {/* Main Overview Grid */}
      <div className="overview-grid">
        {/* Schedule Panel (Today's appointments) */}
        <section className="panel schedule-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.overview.theDayAhead}</span>
              <h2>{t.overview.todaysAppointments}</h2>
            </div>
            {canPermission(tenant, "appointments.view") && (
              <button
                className="text-button"
                onClick={() => onView("appointments")}
              >
                {t.overview.viewAll} <ArrowRight size={15} />
              </button>
            )}
          </div>
          <AppointmentList
            appointments={dashboard.appointments}
            tenant={tenant}
            busy={busy || !canBook}
            onStatus={onStatus}
          />
          <div className="panel-footer">
            <span>
              <span className="live-dot" />
              {t.overview.allTimesIn} {tenant.timezone}
            </span>
            {canBook && (
              <button className="text-button" onClick={onBook}>
                <Plus size={15} />
                {t.overview.addAppointment}
              </button>
            )}
          </div>
        </section>

        {/* Right Aside Column */}
        <aside className="day-aside">
          {/* Company Financial Position & Health Panel */}
          {canViewDeductions && pos && (
            <section className="panel position-panel" aria-label={t.overview.companyPosition}>
              <div className="position-header">
                <div>
                  <span className="eyebrow">{t.overview.businessSituation}</span>
                  <h2>{t.overview.companyPosition}</h2>
                </div>
                {/* Growth vs Loss Status Badge */}
                {pos.status === "growth" && (
                  <span className="position-badge growth" title={t.overview.growthMessage}>
                    <TrendingUp size={14} />
                    {t.overview.growthStatus}
                  </span>
                )}
                {pos.status === "loss" && (
                  <span className="position-badge loss" title={t.overview.lossMessage}>
                    <TrendingDown size={14} />
                    {t.overview.lossStatus}
                  </span>
                )}
                {pos.status === "break_even" && (
                  <span className="position-badge break_even" title={t.overview.breakEvenMessage}>
                    <Scale size={14} />
                    {t.overview.breakEvenStatus}
                  </span>
                )}
                {pos.status === "neutral" && (
                  <span className="position-badge neutral">
                    <HelpCircle size={14} />
                    {t.overview.neutralStatus}
                  </span>
                )}
              </div>

              {/* Explanatory subtitle based on current state */}
              <p className="position-message">
                {pos.status === "growth"
                  ? t.overview.growthMessage
                  : pos.status === "loss"
                    ? t.overview.lossMessage
                    : t.overview.breakEvenMessage}
              </p>

              {/* Period Switcher: Month vs Today */}
              <div className="position-period-switch">
                <button
                  type="button"
                  className={`position-period-btn ${positionPeriod === "month" ? "active" : ""}`}
                  onClick={() => setPositionPeriod("month")}
                >
                  {t.businessReports.ranges.thisMonth}
                </button>
                <button
                  type="button"
                  className={`position-period-btn ${positionPeriod === "today" ? "active" : ""}`}
                  onClick={() => setPositionPeriod("today")}
                >
                  {t.businessReports.ranges.today}
                </button>
              </div>

              {/* Financial Breakdown Table/Rows */}
              <div className="position-breakdown">
                {positionPeriod === "month" ? (
                  <>
                    <div className="position-row">
                      <span className="row-label">
                        <TrendingUp size={13} style={{ color: "var(--teal)" }} />
                        {t.overview.grossInflow}
                      </span>
                      <span className="row-value" style={{ color: "var(--teal)" }}>
                        +{money(pos.month_revenue_minor, tenant.currency)}
                      </span>
                    </div>

                    <div className="position-row">
                      <span className="row-label">
                        <Receipt size={13} />
                        {t.overview.operatingDeductions}
                      </span>
                      <span className="row-value" style={{ color: "#c93b3b" }}>
                        -{money(pos.month_business_expenses_minor, tenant.currency)}
                      </span>
                    </div>

                    <div className="position-row">
                      <span className="row-label">
                        <Wallet size={13} />
                        {t.overview.staffAdvances}
                      </span>
                      <span className="row-value" style={{ color: "#553299" }}>
                        {money(pos.month_staff_advances_minor, tenant.currency)}
                      </span>
                    </div>

                    <div className="position-row">
                      <span className="row-label">
                        <Users size={13} />
                        {t.businessReports.kpis.totalStaffCost}
                      </span>
                      <span className="row-value" style={{ color: "#c93b3b" }}>
                        -{money(pos.month_estimated_staff_cost_minor, tenant.currency)}
                      </span>
                    </div>

                    {/* Net Margin Highlight Row */}
                    <div className="position-row highlight">
                      <span className="row-label">
                        {t.overview.netMarginThisMonth}
                        <span className="count" style={{ marginLeft: 6 }}>
                          {pos.month_net_margin_percentage}%
                        </span>
                      </span>
                      <span
                        className="row-value"
                        style={{
                          color: pos.month_net_margin_minor >= 0 ? "var(--teal)" : "#c93b3b",
                        }}
                      >
                        {pos.month_net_margin_minor >= 0 ? "+" : ""}
                        {money(pos.month_net_margin_minor, tenant.currency)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="position-row">
                      <span className="row-label">
                        <Wallet size={13} style={{ color: "var(--teal)" }} />
                        {t.overview.completedServiceValue}
                      </span>
                      <span className="row-value" style={{ color: "var(--teal)" }}>
                        +{money(pos.today_revenue_minor, tenant.currency)}
                      </span>
                    </div>

                    <div className="position-row">
                      <span className="row-label">
                        <Receipt size={13} />
                        {t.deductions.kpis.dailyBusinessDeductions}
                      </span>
                      <span className="row-value" style={{ color: "#c93b3b" }}>
                        -{money(pos.today_business_expenses_minor, tenant.currency)}
                      </span>
                    </div>

                    <div className="position-row">
                      <span className="row-label">
                        <Coins size={13} />
                        {t.deductions.kpis.staffAdvances}
                      </span>
                      <span className="row-value" style={{ color: "#553299" }}>
                        -{money(pos.today_staff_advances_minor, tenant.currency)}
                      </span>
                    </div>

                    {/* Net Cash In Hand Today */}
                    <div className="position-row highlight">
                      <span className="row-label">{t.overview.todayCashBalance}</span>
                      <span
                        className="row-value"
                        style={{
                          color: pos.today_net_minor >= 0 ? "var(--teal)" : "#c93b3b",
                        }}
                      >
                        {pos.today_net_minor >= 0 ? "+" : ""}
                        {money(pos.today_net_minor, tenant.currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons to Deductions and Reports */}
              <div className="position-footer-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onView("deductions")}
                >
                  <Coins size={14} />
                  {t.overview.viewAllDeductions}
                  <ArrowRight size={13} />
                </button>
                {canPermission(tenant, "dashboard.view") && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onView("reports")}
                  >
                    {t.nav.reports}
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Team Summary Panel */}
          <section className="panel team-summary">
            <div className="section-heading">
              <h2>{t.overview.yourPeople}</h2>
              <span className="count">{metrics.active_staff}</span>
            </div>
            {dashboard.staff
              .filter((person) => person.active)
              .slice(0, 4)
              .map((person) => (
                <div className="mini-person" key={person.id}>
                  <span className="avatar">{initials(person.name)}</span>
                  <div>
                    <strong>{person.name}</strong>
                    <span>{person.job_title}</span>
                  </div>
                  <span className="live-dot" />
                </div>
              ))}
            {!dashboard.staff.length && (
              <p className="muted small">{t.overview.addFirstMember}</p>
            )}
            {canPermission(tenant, "staff.view") && (
              <button className="text-button" onClick={() => onView("team")}>
                {t.overview.meetTheTeam} <ArrowRight size={15} />
              </button>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
