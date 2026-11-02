"use client";

import {
  Building2,
  ShieldCheck,
  Users,
  CreditCard,
  Sparkles,
  ArrowRight,
  Database,
  Layers3,
} from "lucide-react";
import type { PlatformDashboard, PlatformTenant } from "@/lib/types";
import { money } from "@/lib/format";
import type { PlatformTab } from "../types";
import { subscriptionDate, subscriptionLabel } from "../platform-format";

export function PlatformOverview({
  data,
  busy,
  onTab,
  onManageSubscription,
}: {
  data: PlatformDashboard;
  busy: boolean;
  onTab: (tab: PlatformTab) => void;
  onManageSubscription: (tenant: PlatformTenant) => void;
}) {
  const m = data.metrics;
  const recentTenants = [...data.tenants].slice(0, 5);

  return (
    <div className="platform-overview-stack">
      <section
        className="stats-grid platform-stats"
        aria-label="Platform metrics"
      >
        <article className="stat">
          <div className="stat-top">
            Total Businesses
            <Building2 size={19} />
          </div>
          <strong>{m.businesses}</strong>
          <span className="stat-note">
            {m.active_businesses} active ({m.businesses - m.active_businesses}{" "}
            suspended)
          </span>
        </article>

        <article className="stat">
          <div className="stat-top">
            Active Subscriptions
            <CreditCard size={19} />
          </div>
          <strong>{m.active_paid_subscriptions ?? 0}</strong>
          <span className="stat-note">
            +{m.active_trials ?? 0} in 1-month trial
          </span>
        </article>

        <article className="stat">
          <div className="stat-top">
            Estimated MRR
            <Sparkles size={19} />
          </div>
          <strong>{money(m.mrr_minor || 0, "LKR")}</strong>
          <span className="stat-note">Monthly recurring platform run-rate</span>
        </article>

        <article className="stat">
          <div className="stat-top">
            User Accounts
            <Users size={19} />
          </div>
          <strong>{m.users}</strong>
          <span className="stat-note">Central account directory</span>
        </article>
      </section>

      <section className="platform-quick-cards">
        <div className="platform-quick-card" onClick={() => onTab("reports")}>
          <div className="quick-card-icon">
            <Sparkles size={20} />
          </div>
          <div className="quick-card-body">
            <h3>Revenue & Growth Reports</h3>
            <p>Inspect recurring revenue, expiring trials, and platform GMV.</p>
          </div>
          <ArrowRight size={18} />
        </div>

        <div className="platform-quick-card" onClick={() => onTab("plans")}>
          <div className="quick-card-icon">
            <Layers3 size={20} />
          </div>
          <div className="quick-card-body">
            <h3>Package & Feature Controlling</h3>
            <p>
              Customize subscription plans, pricing tiers, and module access.
            </p>
          </div>
          <ArrowRight size={18} />
        </div>

        <div className="platform-quick-card" onClick={() => onTab("access")}>
          <div className="quick-card-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="quick-card-body">
            <h3>Platform Roles & Permissions</h3>
            <p>
              Enforce RBAC for platform admins, support agents, and auditors.
            </p>
          </div>
          <ArrowRight size={18} />
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Recent Salons & Businesses</h2>
            <p>
              Active workspaces on the platform with current package status.
            </p>
          </div>
          <button
            type="button"
            className="button secondary small-button"
            onClick={() => onTab("businesses")}
          >
            View all ({data.tenants.length})
          </button>
        </div>

        <div className="table-scroll">
          <table className="platform-responsive-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Owner</th>
                <th>Subscription</th>
                <th>Period Ends</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTenants.map((tenant) => {
                const sub = tenant.subscription;
                return (
                  <tr key={tenant.id}>
                    <td>
                      <strong>{tenant.name}</strong>
                      <span className="cell-sub">
                        {tenant.slug} · {tenant.currency}
                      </span>
                    </td>
                    <td>{tenant.owner_email || "—"}</td>
                    <td>
                      <strong>{sub?.plan_name ?? "No subscription"}</strong>
                      <span
                        className={`subscription-status ${sub?.access_allowed ? "is-allowed" : "is-ended"}`}
                      >
                        {sub ? subscriptionLabel(sub.status) : "Unset"}
                      </span>
                    </td>
                    <td>
                      {subscriptionDate(sub?.current_period_end)}
                      <span className="cell-sub">
                        {sub?.status === "trialing"
                          ? "Free trial"
                          : sub?.days_remaining
                            ? `${sub.days_remaining}d remaining`
                            : "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status ${tenant.status === "active" ? "completed" : "cancelled"}`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="button secondary small-button"
                        disabled={busy}
                        onClick={() => onManageSubscription(tenant)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="platform-info-box">
        <Database size={20} />
        <div>
          <strong>Multi-Tenancy Architecture</strong>
          <p>
            Operating on central database <code>haircut_master</code> with
            logical tenancy isolation. Dedicated database routing is fully
            architected for enterprise tiers.
          </p>
        </div>
      </div>
    </div>
  );
}
