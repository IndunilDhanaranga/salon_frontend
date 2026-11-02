"use client";

import {
  BarChart3,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  Scissors,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import type { PlatformReportsResponse, PlatformTenant } from "@/lib/types";
import { money } from "@/lib/format";
import { subscriptionDate } from "../platform-format";

export function PlatformReports({
  reports,
  tenants,
  busy,
  onManageTenant,
  onExtendTrial,
}: {
  reports: PlatformReportsResponse | null;
  tenants: PlatformTenant[];
  busy: boolean;
  onManageTenant: (tenant: PlatformTenant) => void;
  onExtendTrial: (tenantId: string) => Promise<void>;
}) {
  if (!reports) {
    return (
      <div className="empty-state">
        <BarChart3 size={28} />
        <h3>Loading reporting metrics…</h3>
      </div>
    );
  }

  const { financials, subscriptions, growth, ecosystem } = reports;
  const totalSubs = subscriptions.total || 1;
  const activeCount = subscriptions.by_status.active || 0;
  const trialingCount = subscriptions.by_status.trialing || 0;
  const expiredCount = subscriptions.by_status.expired || 0;
  const cancelledCount = subscriptions.by_status.cancelled || 0;

  const activePct = Math.round((activeCount / totalSubs) * 100);
  const trialingPct = Math.round((trialingCount / totalSubs) * 100);
  const expiredPct = Math.round((expiredCount / totalSubs) * 100);
  const cancelledPct = Math.round((cancelledCount / totalSubs) * 100);

  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  return (
    <div className="platform-reports-stack">
      {/* Financial KPIs */}
      <section
        className="stats-grid platform-stats"
        aria-label="Financial analytics"
      >
        <article className="stat highlight-stat">
          <div className="stat-top">
            Monthly Recurring Revenue (MRR)
            <DollarSign size={19} />
          </div>
          <strong>{money(financials.mrr_minor, financials.currency)}</strong>
          <span className="stat-note">
            Contracted active subscription run-rate
          </span>
        </article>

        <article className="stat">
          <div className="stat-top">
            Annual Run-Rate (ARR)
            <TrendingUp size={19} />
          </div>
          <strong>{money(financials.arr_minor, financials.currency)}</strong>
          <span className="stat-note">Projected 12-month platform value</span>
        </article>

        <article className="stat">
          <div className="stat-top">
            Ecosystem Order GMV
            <Sparkles size={19} />
          </div>
          <strong>
            {money(financials.total_gmv_minor, financials.currency)}
          </strong>
          <span className="stat-note">
            Gross retail & service checkout across salons
          </span>
        </article>

        <article className="stat">
          <div className="stat-top">
            New Salons (30 Days)
            <Building2 size={19} />
          </div>
          <strong>+{growth.new_last_30_days}</strong>
          <span className="stat-note">
            Out of {growth.total_businesses} total businesses (
            {growth.active_businesses} active)
          </span>
        </article>
      </section>

      {/* Subscription Breakdown & Package Distribution */}
      <div className="platform-grid-two">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Subscription Health Breakdown</h2>
              <p>Active paid accounts vs free trial conversions.</p>
            </div>
            <span className="small-caps">{subscriptions.total} TOTAL</span>
          </div>

          <div className="subscription-health-bars">
            <div className="health-bar-item">
              <div className="health-bar-label">
                <span>Active Paid</span>
                <strong>
                  {activeCount} ({activePct}%)
                </strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-active"
                  style={{ width: `${activePct}%` }}
                />
              </div>
            </div>

            <div className="health-bar-item">
              <div className="health-bar-label">
                <span>1-Month Free Trial</span>
                <strong>
                  {trialingCount} ({trialingPct}%)
                </strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-trialing"
                  style={{ width: `${trialingPct}%` }}
                />
              </div>
            </div>

            <div className="health-bar-item">
              <div className="health-bar-label">
                <span>Expired (Needs Renewal)</span>
                <strong>
                  {expiredCount} ({expiredPct}%)
                </strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-expired"
                  style={{ width: `${expiredPct}%` }}
                />
              </div>
            </div>

            <div className="health-bar-item">
              <div className="health-bar-label">
                <span>Cancelled</span>
                <strong>
                  {cancelledCount} ({cancelledPct}%)
                </strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-cancelled"
                  style={{ width: `${cancelledPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Subscriptions by Package</h2>
              <p>Business volume across your defined pricing packages.</p>
            </div>
            <span className="small-caps">TIER DISTRIBUTION</span>
          </div>

          <div className="plan-distribution-list">
            {Object.entries(subscriptions.by_plan).map(([planName, count]) => {
              const pct = Math.round((count / totalSubs) * 100);
              return (
                <div key={planName} className="plan-dist-item">
                  <div className="plan-dist-header">
                    <strong>{planName}</strong>
                    <span>
                      {count} salons ({pct}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill fill-plan"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Expiring Trials Alert Action Center */}
      <section className="panel expiring-trials-panel">
        <div className="section-heading">
          <div>
            <div className="heading-with-icon">
              <AlertCircle size={20} className="text-warning" />
              <h2>Expiring & Overdue Free Trials</h2>
            </div>
            <p>
              Salons whose 1-month free trial is ending within 7 days or has
              expired. Follow up or extend their access.
            </p>
          </div>
          <span className="badge warning-badge">
            {subscriptions.expiring_trials.length} ACTION REQUIRED
          </span>
        </div>

        {subscriptions.expiring_trials.length ? (
          <div className="table-scroll">
            <table className="platform-responsive-table">
              <thead>
                <tr>
                  <th>Salon Business</th>
                  <th>Trial Ends</th>
                  <th>Days Left</th>
                  <th>Access State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.expiring_trials.map((item) => {
                  const days = item.subscription?.days_remaining ?? 0;
                  const isExpired = days <= 0;
                  const fullTenant = tenantMap.get(item.id);

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <span className="cell-sub">{item.slug}</span>
                      </td>
                      <td>
                        <strong>
                          {subscriptionDate(item.subscription?.trial_ends_at)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`status ${isExpired ? "cancelled" : "booked"}`}
                        >
                          <Clock size={13} />
                          {isExpired ? "Expired" : `${days} days left`}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`subscription-status ${item.subscription?.access_allowed ? "is-allowed" : "is-ended"}`}
                        >
                          {item.subscription?.access_allowed
                            ? "Active Trial"
                            : "Access Blocked"}
                        </span>
                      </td>
                      <td>
                        <div className="subscription-row-actions">
                          <button
                            type="button"
                            className="button secondary small-button"
                            disabled={busy}
                            onClick={() => void onExtendTrial(item.id)}
                          >
                            +30 Days Free
                          </button>
                          {fullTenant && (
                            <button
                              type="button"
                              className="button primary small-button"
                              disabled={busy}
                              onClick={() => onManageTenant(fullTenant)}
                            >
                              Assign Plan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <CheckCircle2 size={28} className="text-success" />
            <h3>No trials expiring this week</h3>
            <p>
              All active free trials are comfortably within their 30-day window.
            </p>
          </div>
        )}
      </section>

      {/* Salon Ecosystem Operations Aggregates */}
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Platform Ecosystem Activity</h2>
            <p>
              Combined business operations powered across all tenant salons.
            </p>
          </div>
          <span className="small-caps">SYSTEM TOTALS</span>
        </div>

        <div className="stats-grid platform-stats">
          <article className="stat">
            <div className="stat-top">
              Orders / Invoices Processed
              <ArrowUpRight size={19} />
            </div>
            <strong>{ecosystem.total_orders}</strong>
            <span className="stat-note">Customer bills generated by POS</span>
          </article>

          <article className="stat">
            <div className="stat-top">
              Appointments Scheduled
              <Calendar size={19} />
            </div>
            <strong>{ecosystem.total_appointments}</strong>
            <span className="stat-note">
              {ecosystem.completed_appointments} completed services
            </span>
          </article>

          <article className="stat">
            <div className="stat-top">
              Stylists & Salon Staff
              <Scissors size={19} />
            </div>
            <strong>{ecosystem.total_staff}</strong>
            <span className="stat-note">Active salon team members</span>
          </article>

          <article className="stat">
            <div className="stat-top">
              Central Platform Users
              <Users size={19} />
            </div>
            <strong>{growth.total_users}</strong>
            <span className="stat-note">Registered account identities</span>
          </article>
        </div>
      </section>
    </div>
  );
}
