"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Clock,
  Sparkles,
  History,
  CheckCircle2,
  Calendar,
  XCircle,
} from "lucide-react";
import type {
  AdminTenantSubscriptionResponse,
  PlatformTenant,
} from "@/lib/types";
import { money } from "@/lib/format";
import { AdminDialog } from "@/features/platform/administrators/components/admin-dialog";
import {
  subscriptionDate,
  subscriptionLabel,
} from "@/features/platform/platform-format";
import type { SubscriptionUpdate } from "@/features/platform/types";

export function SubscriptionDialog({
  tenant,
  busy,
  onClose,
  onFetchDetail,
  onSaveSubscription,
  onExtendTrial,
}: {
  tenant: PlatformTenant;
  busy: boolean;
  onClose: () => void;
  onFetchDetail: (tenantId: string) => Promise<AdminTenantSubscriptionResponse>;
  onSaveSubscription: (
    tenantId: string,
    values: SubscriptionUpdate,
  ) => Promise<unknown>;
  onExtendTrial: (tenantId: string, days?: number) => Promise<unknown>;
}) {
  const [detail, setDetail] = useState<AdminTenantSubscriptionResponse | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [activeTab, setActiveTab] = useState<"plan" | "history">("plan");

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [actionType, setActionType] = useState<"active" | "cancelled">(
    "active",
  );
  const [error, setError] = useState("");

  const sub = detail?.data ?? tenant.subscription;

  useEffect(() => {
    let mounted = true;
    setLoadingDetail(true);
    onFetchDetail(tenant.id)
      .then((res) => {
        if (!mounted) return;
        setDetail(res);
        const sub = res.data;
        if (sub) {
          setSelectedPlanId(sub.plan_id || (res.plans[0]?.id ?? ""));
          // format date for date input (YYYY-MM-DD)
          const endDate = new Date(sub.current_period_end);
          if (!isNaN(endDate.getTime())) {
            setPeriodEnd(endDate.toISOString().split("T")[0]);
          }
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load subscription.",
        );
      })
      .finally(() => {
        if (mounted) setLoadingDetail(false);
      });

    return () => {
      mounted = false;
    };
  }, [tenant.id, onFetchDetail]);

  function addMonths(months: number) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setPeriodEnd(d.toISOString().split("T")[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (actionType === "cancelled") {
      try {
        await onSaveSubscription(tenant.id, { status: "cancelled" });
        onClose();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to cancel subscription.",
        );
      }
      return;
    }

    if (!selectedPlanId) {
      setError("Please select an active plan to assign.");
      return;
    }
    if (!periodEnd) {
      setError("Please choose a future period end date.");
      return;
    }

    try {
      await onSaveSubscription(tenant.id, {
        status: "active",
        plan_id: selectedPlanId,
        current_period_end: new Date(periodEnd + "T23:59:59Z").toISOString(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save subscription.",
      );
    }
  }

  async function handleQuickExtend() {
    setError("");
    try {
      await onExtendTrial(tenant.id, 30);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extend trial.");
    }
  }

  async function handleApproveRenewal() {
    setError("");
    if (!selectedPlanId && !sub?.plan_id) {
      setError("Select a plan before approving a renewal.");
      return;
    }

    try {
      await onSaveSubscription(tenant.id, {
        status: "active",
        plan_id: selectedPlanId || sub!.plan_id!,
        current_period_end: new Date(
          (periodEnd || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)) +
            "T23:59:59Z",
        ).toISOString(),
        renewal_approved: true,
      });

      // Dispatch business notification
      void fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Payment Approved: Subscription Renewed!",
          message: `Your subscription renewal for ${tenant.name} has been approved by the platform administrator. Full salon access is restored.`,
          priority: "urgent",
          category: "subscription",
          targetAudience: tenant.slug,
          targetView: "subscription",
          sentBy: "Platform Admin",
        }),
      }).catch(() => {});

      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve renewal.",
      );
    }
  }

  const pendingRenewal =
    sub?.status === "pending_renewal" || sub?.renewal_status === "pending";

  return (
    <AdminDialog
      title={`Manage Subscription: ${tenant.name}`}
      subtitle={`Configure package, access validity, or trial duration for ${tenant.slug}.`}
      busy={busy}
      onClose={onClose}
    >
      <div className="subscription-modal-tabs">
        <button
          type="button"
          className={`platform-subtab-btn ${activeTab === "plan" ? "is-active" : ""}`}
          onClick={() => setActiveTab("plan")}
        >
          <Sparkles size={15} />
          <span>Plan & Validity</span>
        </button>
        <button
          type="button"
          className={`platform-subtab-btn ${activeTab === "history" ? "is-active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={15} />
          <span>Audit History ({detail?.history?.length ?? 0})</span>
        </button>
      </div>

      {error && (
        <div className="error-box" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loadingDetail ? (
        <div className="empty-state">
          <Clock size={24} />
          <p>Loading subscription details…</p>
        </div>
      ) : activeTab === "plan" ? (
        <div className="admin-form-stack">
          {/* Current Status Box */}
          <div className="subscription-status-card">
            <div className="status-header">
              <div>
                <span className="eyebrow">CURRENT PACKAGE</span>
                <h3>{sub?.plan_name || "Free Trial"}</h3>
              </div>
              <span
                className={`subscription-status ${sub?.access_allowed ? "is-allowed" : "is-ended"}`}
              >
                {sub ? subscriptionLabel(sub.status) : "Unset"}
              </span>
            </div>

            <div className="status-grid">
              <div>
                <span className="cell-sub">Period Ends</span>
                <strong>{subscriptionDate(sub?.current_period_end)}</strong>
              </div>
              <div>
                <span className="cell-sub">Access Remaining</span>
                <strong>
                  {sub?.access_allowed
                    ? `${sub.days_remaining} days`
                    : "Access Expired"}
                </strong>
              </div>
              <div>
                <span className="cell-sub">Currency / Price</span>
                <strong>
                  {sub
                    ? money(sub.price_minor, sub.currency) +
                      ` / ${sub.billing_interval}`
                    : "0.00"}
                </strong>
              </div>
            </div>

            {pendingRenewal && (
              <div className="warning-callout">
                <AlertCircle size={18} />
                <div>
                  <strong>Renewal request is waiting for admin review.</strong>
                  <p>
                    {sub?.renewal_payment_method === "bank_transfer"
                      ? "Bank transfer slip" 
                      : "Online transfer slip"} reference: {sub?.renewal_reference || "not provided"}
                  </p>
                </div>
                <button
                  type="button"
                  className="button primary small-button"
                  onClick={handleApproveRenewal}
                  disabled={busy}
                >
                  Approve renewal
                </button>
              </div>
            )}

            {/* Quick 1-click Free Trial Extension */}
            <div className="quick-extend-row">
              <button
                type="button"
                className="button secondary small-button"
                disabled={busy}
                onClick={handleQuickExtend}
              >
                <Sparkles size={15} />+ Grant / Extend 30 Days Free Trial
              </button>
              <span className="stat-note">
                Instantly extends trial without charging or assigning a paid
                plan.
              </span>
            </div>
          </div>

          {/* Form to Assign Plan or Cancel */}
          <form onSubmit={handleSubmit} className="admin-form-stack">
            <div className="form-field">
              <label>Subscription Action</label>
              <div className="radio-group-row">
                <label className="radio-pill">
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === "active"}
                    onChange={() => setActionType("active")}
                  />
                  <span>Assign / Renew Plan</span>
                </label>
                <label className="radio-pill">
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === "cancelled"}
                    onChange={() => setActionType("cancelled")}
                  />
                  <span>Cancel Subscription</span>
                </label>
              </div>
            </div>

            {actionType === "active" ? (
              <>
                <div className="form-field">
                  <label htmlFor="plan-select">
                    Select Subscription Package *
                  </label>
                  <select
                    id="plan-select"
                    className="select"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                  >
                    {detail?.plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {money(p.price_minor, p.currency)} /{" "}
                        {p.billing_interval} ({p.features.length} modules)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="period-end">Access Expiry Date *</label>
                  <div className="date-input-with-presets">
                    <input
                      id="period-end"
                      type="date"
                      className="input"
                      required
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                    />
                    <div className="quick-date-presets">
                      <button
                        type="button"
                        className="chip-btn"
                        onClick={() => addMonths(1)}
                      >
                        +1 Month
                      </button>
                      <button
                        type="button"
                        className="chip-btn"
                        onClick={() => addMonths(3)}
                      >
                        +3 Months
                      </button>
                      <button
                        type="button"
                        className="chip-btn"
                        onClick={() => addMonths(12)}
                      >
                        +1 Year
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="warning-callout">
                <XCircle size={18} />
                <p>
                  Cancelling the subscription immediately suspends module access
                  for this salon while preserving all past records and
                  historical data.
                </p>
              </div>
            )}

            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="submit"
                className={`button ${actionType === "cancelled" ? "secondary text-danger" : "primary"}`}
                disabled={busy}
              >
                {actionType === "cancelled"
                  ? "Confirm Cancellation"
                  : "Apply Subscription Plan"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* History & Audit Tab */
        <div className="subscription-audit-stack">
          {detail?.history && detail.history.length > 0 ? (
            <ul className="audit-timeline">
              {detail.history.map((item) => (
                <li key={item.id} className="audit-timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <strong>
                        {item.action === "trial_granted"
                          ? "Initial Free Trial Granted"
                          : item.action === "trial_extended"
                            ? "Free Trial Extended (+30 Days)"
                            : item.action === "plan_assigned"
                              ? "Plan Assigned / Renewed"
                              : item.action === "cancelled"
                                ? "Subscription Cancelled"
                                : item.action}
                      </strong>
                      <span className="stat-note">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <span className="cell-sub">
                      Triggered by:{" "}
                      {item.actor_name
                        ? `${item.actor_name} (${item.actor_email})`
                        : "System Seeder / Registration"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <CheckCircle2 size={24} />
              <p>No prior subscription adjustments recorded yet.</p>
            </div>
          )}
        </div>
      )}
    </AdminDialog>
  );
}
