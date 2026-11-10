"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileImage,
  Filter,
  History,
  Landmark,
  Lock,
  ReceiptText,
  Search,
  Sparkles,
  User,
  X,
  XCircle,
} from "lucide-react";
import type { PlatformTenant, SubscriptionRenewal } from "@/lib/types";
import { money } from "@/lib/format";
import {
  getGracePeriodDaysRemaining,
  isSubscriptionInGracePeriod,
  subscriptionStatusLabel,
} from "@/lib/access";
import { subscriptionDate } from "@/features/platform/platform-format";

export function PlatformSubscriptionsView({
  tenants,
  renewals,
  busy,
  canManage,
  onManageSubscription,
  onExtendTrial,
  onReviewRenewal,
}: {
  tenants: PlatformTenant[];
  renewals: SubscriptionRenewal[];
  busy: boolean;
  canManage: boolean;
  onManageSubscription: (tenant: PlatformTenant) => void;
  onExtendTrial: (tenantId: string) => Promise<unknown>;
  onReviewRenewal: (
    renewalId: string,
    status: "approved" | "rejected",
    reviewNotes?: string,
  ) => Promise<unknown>;
}) {
  const [subTab, setSubTab] = useState<"renewals" | "tenants">("renewals");
  const [renewalFilter, setRenewalFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [search, setSearch] = useState("");
  const [activeSlipModal, setActiveSlipModal] = useState<string | null>(null);
  const [rejectModalRenewal, setRejectModalRenewal] =
    useState<SubscriptionRenewal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const pendingCount = renewals.filter((r) => r.status === "pending").length;

  // Filtered renewals
  const filteredRenewals = renewals.filter((r) => {
    if (renewalFilter !== "all" && r.status !== renewalFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const t = tenants.find((tenant) => tenant.id === r.tenant_id);
    return (
      r.reference.toLowerCase().includes(q) ||
      (r.tenant?.name && r.tenant.name.toLowerCase().includes(q)) ||
      (t && t.name.toLowerCase().includes(q)) ||
      (t && t.slug.toLowerCase().includes(q))
    );
  });

  // Filtered tenants
  const filteredTenants = tenants.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      (t.owner_email && t.owner_email.toLowerCase().includes(q))
    );
  });

  async function handleApprove(renewal: SubscriptionRenewal) {
    setActionError("");
    setActionSuccess("");
    try {
      await onReviewRenewal(
        renewal.id,
        "approved",
        "Payment verified and approved by platform admin. Package auto-renewed.",
      );

      // Find tenant info for notification
      const tenant =
        tenants.find((t) => t.id === renewal.tenant_id) || renewal.tenant;
      const tenantSlug = tenant?.slug || renewal.tenant_id;
      const tenantName = tenant?.name || "Your Salon";

      // Dispatch business notification
      void fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Payment Approved: Subscription Renewed!",
          message: `Great news! Your renewal payment of ${money(renewal.amount_minor, tenant?.currency || "LKR")} has been verified and approved. Your salon access is active.`,
          priority: "urgent",
          category: "subscription",
          targetAudience: tenantSlug,
          targetView: "subscription",
          sentBy: "Platform Admin",
        }),
      }).catch(() => {});

      // Cross-tab broadcast to business
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const ch = new BroadcastChannel(`salon_broadcast_${tenantSlug}`);
          ch.postMessage({
            type: "BROADCAST_MESSAGE",
            payload: {
              id: `approved-${Date.now()}`,
              type: "subscription",
              title: "Payment Approved: Subscription Renewed!",
              message: `Your payment slip was approved. Package renewed successfully.`,
              timestamp: new Date().toISOString(),
              priority: "urgent",
            },
          });
          ch.close();
        } catch {}
      }

      setActionSuccess(
        `Renewal for ${tenantName} approved! Package auto-renewed and business notified.`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to approve renewal.",
      );
    }
  }

  async function handleConfirmReject() {
    if (!rejectModalRenewal) return;
    setActionError("");
    setActionSuccess("");
    try {
      const reason =
        rejectReason.trim() ||
        "Payment slip could not be verified. Please submit a valid receipt.";
      await onReviewRenewal(rejectModalRenewal.id, "rejected", reason);

      const tenant =
        tenants.find((t) => t.id === rejectModalRenewal.tenant_id) ||
        rejectModalRenewal.tenant;
      const tenantSlug = tenant?.slug || rejectModalRenewal.tenant_id;

      // Dispatch business notification
      void fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Renewal Payment Slip Not Approved",
          message: `Your payment slip submission was rejected: "${reason}". Please submit a valid bank slip to restore access.`,
          priority: "urgent",
          category: "subscription",
          targetAudience: tenantSlug,
          targetView: "subscription",
          sentBy: "Platform Admin",
        }),
      }).catch(() => {});

      setActionSuccess("Renewal request was rejected and salon notified.");
      setRejectModalRenewal(null);
      setRejectReason("");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to reject renewal.",
      );
    }
  }

  return (
    <div className="platform-subscriptions-manager">
      {/* Subtab Navigation Bar */}
      <div className="platform-subtab-bar">
        <button
          type="button"
          className={`platform-subtab-btn ${subTab === "renewals" ? "is-active" : ""}`}
          onClick={() => setSubTab("renewals")}
        >
          <ReceiptText size={16} />
          <span>Payment Slips & Renewals</span>
          {pendingCount > 0 && (
            <span className="subtab-counter-badge">{pendingCount}</span>
          )}
        </button>

        <button
          type="button"
          className={`platform-subtab-btn ${subTab === "tenants" ? "is-active" : ""}`}
          onClick={() => setSubTab("tenants")}
        >
          <Building2 size={16} />
          <span>All Salon Subscriptions ({tenants.length})</span>
        </button>
      </div>

      {actionError && (
        <div className="error-box" role="alert">
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="success-box" role="status">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* RENEWALS & PAYMENT SLIPS TAB */}
      {subTab === "renewals" && (
        <div className="renewals-view-stack">
          {/* Controls & Filter Header */}
          <div className="table-controls-row">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="search"
                className="input search-input"
                placeholder="Search by salon name, reference code, slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-pill ${renewalFilter === "pending" ? "is-active" : ""}`}
                onClick={() => setRenewalFilter("pending")}
              >
                <span>Pending Review</span>
                {pendingCount > 0 && (
                  <span className="pill-dot-count">{pendingCount}</span>
                )}
              </button>
              <button
                type="button"
                className={`filter-pill ${renewalFilter === "approved" ? "is-active" : ""}`}
                onClick={() => setRenewalFilter("approved")}
              >
                <span>Approved</span>
              </button>
              <button
                type="button"
                className={`filter-pill ${renewalFilter === "rejected" ? "is-active" : ""}`}
                onClick={() => setRenewalFilter("rejected")}
              >
                <span>Rejected</span>
              </button>
              <button
                type="button"
                className={`filter-pill ${renewalFilter === "all" ? "is-active" : ""}`}
                onClick={() => setRenewalFilter("all")}
              >
                <span>All Submissions ({renewals.length})</span>
              </button>
            </div>
          </div>

          {filteredRenewals.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={32} />
              <h3>No renewal payment slips found</h3>
              <p>
                {renewalFilter === "pending"
                  ? "All submitted payment slips have been reviewed. Excellent work!"
                  : "No submissions matched the selected filter."}
              </p>
            </div>
          ) : (
            <div className="renewal-cards-grid">
              {filteredRenewals.map((renewal) => {
                const tenant =
                  tenants.find((t) => t.id === renewal.tenant_id) ||
                  renewal.tenant;
                const slipUrl =
                  renewal.proof_url ||
                  (renewal.notes?.includes("[SLIP_ATTACHMENT]: ")
                    ? renewal.notes.split("[SLIP_ATTACHMENT]: ")[1]?.trim()
                    : null);
                const userNotes = renewal.notes
                  ? renewal.notes.split("[SLIP_ATTACHMENT]:")[0]?.trim() || ""
                  : "";

                return (
                  <div
                    key={renewal.id}
                    className={`platform-renewal-card ${
                      renewal.status === "pending" ? "is-pending-card" : ""
                    }`}
                  >
                    <div className="card-top-row">
                      <div className="tenant-info-block">
                        <span className="eyebrow">SALON BUSINESS</span>
                        <h4>{tenant?.name || "Salon Business"}</h4>
                        <span className="cell-sub">
                          Slug: {tenant?.slug || renewal.tenant_id} ·{" "}
                          {tenant?.owner_email || "Owner account"}
                        </span>
                      </div>

                      <span
                        className={`status-pill ${
                          renewal.status === "approved"
                            ? "is-approved"
                            : renewal.status === "rejected"
                              ? "is-rejected"
                              : "is-pending"
                        }`}
                      >
                        {renewal.status === "approved" ? (
                          <>
                            <CheckCircle2 size={13} /> Approved & Renewed
                          </>
                        ) : renewal.status === "rejected" ? (
                          <>
                            <XCircle size={13} /> Rejected
                          </>
                        ) : (
                          <>
                            <Clock size={13} /> Pending Admin Review
                          </>
                        )}
                      </span>
                    </div>

                    <div className="card-payment-details">
                      <div className="detail-item">
                        <span className="detail-label">Document</span>
                        <div className="method-pill">
                          <ReceiptText size={14} /> Payment Slip
                        </div>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Renewal Amount</span>
                        <strong className="amount-highlight">
                          {money(
                            renewal.amount_minor,
                            tenant?.currency || "LKR",
                          )}
                        </strong>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">
                          Slip Reference / TXN ID
                        </span>
                        <strong className="mono-ref">
                          {renewal.reference}
                        </strong>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Submitted On</span>
                        <span>
                          {new Date(renewal.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {userNotes && (
                      <div className="user-note-quote">
                        <span className="quote-label">Salon Remark:</span>
                        <p>{userNotes}</p>
                      </div>
                    )}

                    {/* Attached Slip Preview Thumbnail */}
                    <div className="slip-inspect-container">
                      <span className="detail-label">Payment Slip Proof</span>
                      {slipUrl ? (
                        <div className="slip-inspect-row">
                          <div
                            className="slip-inspect-thumb"
                            onClick={() => setActiveSlipModal(slipUrl)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={slipUrl} alt="Bank Deposit Slip Proof" />
                            <div className="thumb-zoom-overlay">
                              <Eye size={18} />
                              <span>Zoom</span>
                            </div>
                          </div>
                          <div className="slip-inspect-hint">
                            <strong>Bank Slip Document Attached</strong>
                            <p>
                              Click thumbnail to inspect full resolution deposit
                              slip and stamp.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="no-slip-note">
                          <FileImage size={16} />
                          <span>
                            No image attached (Reference code only:{" "}
                            {renewal.reference})
                          </span>
                        </div>
                      )}
                    </div>

                    {renewal.review_notes && (
                      <div
                        className={`admin-feedback-box ${
                          renewal.status === "approved"
                            ? "is-success"
                            : "is-danger"
                        }`}
                      >
                        <strong>Review Note:</strong>
                        <p>{renewal.review_notes}</p>
                      </div>
                    )}

                    {/* Action Buttons for Pending Slips */}
                    {renewal.status === "pending" && canManage && (
                      <div className="renewal-card-actions">
                        <button
                          type="button"
                          className="button primary"
                          disabled={busy}
                          onClick={() => handleApprove(renewal)}
                        >
                          <CheckCircle2 size={16} />
                          <span>Approve & Auto-Renew Package</span>
                        </button>

                        <button
                          type="button"
                          className="button secondary text-danger"
                          disabled={busy}
                          onClick={() => {
                            setRejectModalRenewal(renewal);
                            setRejectReason("");
                          }}
                        >
                          <XCircle size={16} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ALL BUSINESS SUBSCRIPTIONS TAB */}
      {subTab === "tenants" && (
        <div className="tenants-view-stack">
          <div className="table-controls-row">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="search"
                className="input search-input"
                placeholder="Search salons by name, slug, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="platform-table-wrapper">
            <table className="platform-data-table">
              <thead>
                <tr>
                  <th>Salon Business</th>
                  <th>Current Plan</th>
                  <th>Access Validity</th>
                  <th>Subscription Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((t) => {
                  const sub = t.subscription;
                  const inGrace = isSubscriptionInGracePeriod(sub ?? null);
                  const graceDays = getGracePeriodDaysRemaining(sub ?? null);
                  const label = subscriptionStatusLabel(sub ?? null);

                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="cell-flex-stack">
                          <strong className="cell-title">{t.name}</strong>
                          <span className="cell-sub">
                            {t.slug} · {t.owner_email || "No owner email"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="cell-flex-stack">
                          <strong>{sub?.plan_name || "Free Trial"}</strong>
                          <span className="cell-sub">
                            {sub
                              ? `${money(sub.price_minor, sub.currency)} / ${sub.billing_interval}`
                              : "Free"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="cell-flex-stack">
                          <strong>
                            {subscriptionDate(sub?.current_period_end)}
                          </strong>
                          <span className="cell-sub">
                            {inGrace
                              ? `1-Week Grace: ${graceDays} day(s) left`
                              : sub?.access_allowed
                                ? `${sub.days_remaining} days remaining`
                                : "Access Expired · Locked"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status-pill ${
                            sub?.status === "active"
                              ? "is-approved"
                              : inGrace
                                ? "is-grace"
                                : sub?.status === "trialing"
                                  ? "is-trial"
                                  : "is-rejected"
                          }`}
                        >
                          {inGrace ? (
                            <>
                              <AlertTriangle size={13} /> Grace Period (1 Wk)
                            </>
                          ) : sub?.status === "active" ? (
                            <>
                              <CheckCircle2 size={13} /> Active Paid
                            </>
                          ) : sub?.status === "trialing" ? (
                            <>
                              <Sparkles size={13} /> Free Trial
                            </>
                          ) : (
                            <>
                              <Lock size={13} /> Expired · Locked
                            </>
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons-cell">
                          {canManage && (
                            <>
                              <button
                                type="button"
                                className="button secondary small-button"
                                onClick={() => onManageSubscription(t)}
                              >
                                Manage Plan
                              </button>
                              <button
                                type="button"
                                className="button tertiary small-button"
                                onClick={() => void onExtendTrial(t.id)}
                              >
                                +30d Trial
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lightbox Slip Image Viewer */}
      {activeSlipModal && (
        <div
          className="admin-dialog-backdrop"
          onClick={() => setActiveSlipModal(null)}
        >
          <div
            className="slip-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="slip-modal-header">
              <h3>Bank Slip Review Viewer</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setActiveSlipModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="slip-modal-body">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeSlipModal} alt="High resolution payment slip" />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal Dialog */}
      {rejectModalRenewal && (
        <div
          className="admin-dialog-backdrop"
          onClick={() => setRejectModalRenewal(null)}
        >
          <div
            className="admin-dialog-card modal-rejection-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <div>
                <h3>Reject Payment Slip</h3>
                <p>
                  Provide a clear reason for rejecting this payment slip. The
                  salon owner will receive an instant notification with this
                  explanation.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setRejectModalRenewal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-form-stack" style={{ padding: "1.5rem" }}>
              <label>
                Rejection Explanation *
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Bank slip image is unreadable, deposit reference not found on bank statement, or amount is incorrect."
                  rows={4}
                  required
                />
              </label>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setRejectModalRenewal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button secondary text-danger"
                  onClick={handleConfirmReject}
                >
                  Confirm Rejection & Notify Salon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
