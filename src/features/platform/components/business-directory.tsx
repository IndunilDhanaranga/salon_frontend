"use client";

import { useState } from "react";
import { Building2, Settings2, Search, Filter } from "lucide-react";
import type { PlatformTenant } from "@/lib/types";
import { subscriptionDate, subscriptionLabel } from "../platform-format";

export function BusinessDirectory({
  tenants,
  busy,
  canManageTenants,
  canManageSubscriptions,
  onToggle,
  onManage,
}: {
  tenants: PlatformTenant[];
  busy: boolean;
  canManageTenants: boolean;
  canManageSubscriptions: boolean;
  onToggle: (tenant: PlatformTenant) => void;
  onManage: (tenant: PlatformTenant) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended"
  >("all");

  const filtered = tenants.filter((t) => {
    const matchesQuery =
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.slug.toLowerCase().includes(query.toLowerCase()) ||
      (t.owner_email &&
        t.owner_email.toLowerCase().includes(query.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ? true : t.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <section
      className="panel subscription-directory"
      aria-label="Business directory"
    >
      <div className="section-heading">
        <div>
          <h2>Salon Business Directory</h2>
          <p>
            Supervise salon workspaces, subscription tiers, and platform
            availability.
          </p>
        </div>
        <span className="small-caps">
          {filtered.length} OF {tenants.length} BUSINESSES
        </span>
      </div>

      <div className="directory-filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="search"
            className="input search-input"
            placeholder="Search businesses by name, slug, or owner email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="filter-select-wrap">
          <Filter size={15} />
          <select
            className="select filter-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "suspended")
            }
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {filtered.length ? (
        <div className="table-scroll">
          <table className="platform-responsive-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Subscription</th>
                <th>Period ends</th>
                <th>Business status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => {
                const subscription = tenant.subscription;
                return (
                  <tr key={tenant.id}>
                    <td data-label="Business">
                      <strong>{tenant.name}</strong>
                      <span className="cell-sub">
                        {tenant.owner_email || tenant.slug}
                      </span>
                      <span className="cell-sub">
                        {tenant.storage_mode === "shared"
                          ? "Shared database"
                          : "Dedicated database"}{" "}
                        · {tenant.currency}
                      </span>
                    </td>
                    <td data-label="Subscription">
                      <strong>
                        {subscription?.plan_name ?? "No subscription"}
                      </strong>
                      <span
                        className={`subscription-status ${subscription?.access_allowed ? "is-allowed" : "is-ended"}`}
                      >
                        {subscription
                          ? subscriptionLabel(subscription.status)
                          : "Not configured"}
                      </span>
                    </td>
                    <td data-label="Period ends">
                      <strong>
                        {subscriptionDate(subscription?.current_period_end)}
                      </strong>
                      <span className="cell-sub">
                        {subscription?.status === "trialing"
                          ? `Trial ends ${subscriptionDate(subscription.trial_ends_at)}`
                          : subscription?.access_allowed
                            ? `${subscription.days_remaining} days remaining`
                            : "Subscription access unavailable"}
                      </span>
                    </td>
                    <td data-label="Business status">
                      <span
                        className={`status ${tenant.status === "active" ? "completed" : "cancelled"}`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="subscription-row-actions">
                        {canManageSubscriptions && (
                          <button
                            type="button"
                            className="button secondary small-button"
                            disabled={busy}
                            onClick={() => onManage(tenant)}
                          >
                            <Settings2 size={15} />
                            Manage subscription
                          </button>
                        )}
                        {canManageTenants && (
                          <button
                            type="button"
                            className="button secondary small-button"
                            disabled={busy}
                            onClick={() => onToggle(tenant)}
                          >
                            {tenant.status === "active"
                              ? "Suspend business"
                              : "Resume business"}
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
          <Building2 size={28} />
          <h3>No matching businesses found</h3>
          <p>Try adjusting your search query or status filter.</p>
        </div>
      )}
    </section>
  );
}
