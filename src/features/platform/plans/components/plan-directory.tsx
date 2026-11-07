"use client";

import { Archive, Layers3, Pencil, Plus } from "lucide-react";
import type { AdminPlansResponse, Plan } from "@/lib/types";
import { money } from "@/lib/format";

export function PlanDirectory({
  catalog,
  busy,
  canManagePlans,
  onEdit,
  onArchive,
}: {
  catalog: AdminPlansResponse;
  busy: boolean;
  canManagePlans: boolean;
  onEdit: (plan: Plan | null) => void;
  onArchive: (plan: Plan) => void;
}) {
  const labels = Object.fromEntries(
    catalog.features.map((feature) => [feature.key, feature.label]),
  );

  return (
    <section
      className="panel subscription-plans-panel"
      aria-label="Subscription packages"
    >
      <div className="section-heading">
        <div>
          <h2>Subscription Packages & Plans</h2>
          <p>
            Configure pricing tiers, billing cycles, and included operational
            modules.
          </p>
        </div>
        {canManagePlans && (
          <button
            type="button"
            className="button primary"
            disabled={busy}
            onClick={() => onEdit(null)}
          >
            <Plus size={16} />
            Create Package
          </button>
        )}
      </div>

      {catalog.data.length ? (
        <div className="subscription-plan-grid">
          {catalog.data.map((plan) => (
            <article
              className={`subscription-plan-card ${plan.active ? "" : "is-archived"}`}
              key={plan.id}
            >
              <div className="subscription-plan-heading">
                <div>
                  <h3>{plan.name}</h3>
                  <p className="subscription-plan-description">
                    {plan.description || "No description provided."}
                  </p>
                </div>
                <span
                  className={`subscription-status ${plan.active ? "is-allowed" : "is-ended"}`}
                >
                  {plan.active ? "Published" : "Archived"}
                </span>
              </div>

              <div className="subscription-plan-price">
                <strong>{money(plan.price_minor, plan.currency)}</strong>
                <span>per {plan.billing_interval}</span>
              </div>

              <div className="subscription-modules-wrap">
                <h4>Included Modules:</h4>
                <ul className="subscription-feature-list">
                  {plan.features.length ? (
                    plan.features.map((key) => (
                      <li key={key}>{labels[key] ?? key}</li>
                    ))
                  ) : (
                    <li>No operational modules included</li>
                  )}
                </ul>
              </div>

              {canManagePlans && (
                <div className="subscription-plan-actions">
                  <button
                    type="button"
                    className="button secondary small-button"
                    disabled={busy}
                    onClick={() => onEdit(plan)}
                  >
                    <Pencil size={15} />
                    Edit Plan
                  </button>
                  <button
                    type="button"
                    className="button secondary small-button"
                    disabled={busy}
                    onClick={() => onArchive(plan)}
                  >
                    <Archive size={15} />
                    {plan.active ? "Archive" : "Publish"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Layers3 size={28} />
          <h3>Create your first subscription package</h3>
          <p>
            Choose your own pricing and included modules. New businesses receive
            a one-month free trial automatically.
          </p>
          {canManagePlans && (
            <button
              type="button"
              className="button primary"
              disabled={busy}
              onClick={() => onEdit(null)}
            >
              <Plus size={16} />
              Create Package
            </button>
          )}
        </div>
      )}

      <p className="subscription-panel-note">
        Package edits apply to future assignments and renewals. Existing active
        subscriptions preserve their agreed price and modules until updated.
        Archiving prevents new assignments.
      </p>
    </section>
  );
}
