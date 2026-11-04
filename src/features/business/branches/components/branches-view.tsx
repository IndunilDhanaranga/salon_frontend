"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Power,
  MapPin,
  Phone,
  Users,
  Receipt,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  X,
  RefreshCw,
  Coins,
} from "lucide-react";
import { useBranchApi } from "@/features/workspace/branch-context";
import { money, message } from "@/lib/format";
import type {
  Branch,
  BranchesResponse,
  Subscription,
  Tenant,
} from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import { canPermission } from "@/lib/access";

type Props = {
  tenant: Tenant;
  onBranchChanged?: () => void;
};

export function BranchesView({ tenant, onBranchChanged }: Props) {
  const api = useBranchApi();
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(
    tenant.subscription,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const branchDialog = useRef<HTMLDialogElement>(null);
  const branchTitleId = useId();

  useEffect(() => {
    if (!modalOpen) return;
    const dialog = branchDialog.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [modalOpen]);

  const canManage = canPermission(tenant, "branches.manage");

  const loadBranches = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const res = await api<BranchesResponse>("branches", {
          tenant: tenant.slug,
          signal,
        });
        if (!signal?.aborted) {
          setBranches(res.data);
          if (res.subscription) {
            setSubscription(res.subscription);
          }
        }
      } catch (err) {
        if (!signal?.aborted) {
          setError(message(err));
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [tenant.slug],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadBranches(controller.signal);
    return () => controller.abort();
  }, [loadBranches]);

  const activeCount = branches.filter((b) => b.active).length;
  const includedBranches = subscription?.included_branches ?? 1;
  const extraBranches = Math.max(0, activeCount - includedBranches);
  const extraBranchFeeMinor =
    subscription?.price_per_additional_branch_minor ?? 250000;
  const basePriceMinor =
    subscription?.base_price_minor ?? subscription?.price_minor ?? 0;
  const totalAdditionalFeeMinor = extraBranches * extraBranchFeeMinor;
  const totalMonthlyPriceMinor = basePriceMinor + totalAdditionalFeeMinor;

  async function handleToggleActive(branch: Branch) {
    if (branch.is_main) return;
    try {
      setLoading(true);
      await api(`branches/${branch.id}`, {
        method: "PATCH",
        tenant: tenant.slug,
        body: {
          active: !branch.active,
        },
      });
      await loadBranches();
      onBranchChanged?.();
    } catch (err) {
      setError(message(err));
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingBranch(null);
    setModalError("");
    setModalOpen(true);
  }

  function openEditModal(branch: Branch) {
    setEditingBranch(branch);
    setModalError("");
    setModalOpen(true);
  }

  async function handleModalSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalBusy(true);
    setModalError("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const code = String(form.get("code") || "").trim() || null;
    const phone = String(form.get("phone") || "").trim() || null;
    const address = String(form.get("address") || "").trim() || null;
    const active = editingBranch?.is_main ? true : form.get("active") === "on";

    if (!name) {
      setModalError("Branch name is required.");
      setModalBusy(false);
      return;
    }

    try {
      if (editingBranch) {
        await api(`branches/${editingBranch.id}`, {
          method: "PATCH",
          tenant: tenant.slug,
          body: {
            name,
            code,
            phone,
            address,
            active,
          },
        });
      } else {
        await api("branches", {
          method: "POST",
          tenant: tenant.slug,
          body: {
            name,
            code,
            phone,
            address,
            active,
          },
        });
      }
      setModalOpen(false);
      await loadBranches();
      onBranchChanged?.();
    } catch (err) {
      setModalError(message(err));
    } finally {
      setModalBusy(false);
    }
  }

  return (
    <div className="branches-view">
      {/* Dynamic Subscription Pricing Breakdown Banner */}
      <section className="dynamic-pricing-card">
        <div className="pricing-card-header">
          <div className="pricing-badge">
            <Sparkles size={16} />
            <span>{t.branches.dynamicPricingTitle}</span>
          </div>
          <div className="plan-name-tag">
            {subscription?.plan_name ?? "Business Plan"}
          </div>
        </div>

        <p className="pricing-card-description">
          {t.branches.dynamicPricingDesc}
        </p>

        <div className="pricing-metrics-grid">
          <div className="pricing-metric-box">
            <span className="metric-label">{t.branches.basePlanPrice}</span>
            <span className="metric-value">
              {money(basePriceMinor, tenant.currency)}
              <span className="metric-unit">/mo</span>
            </span>
            <span className="metric-sub">
              {t.branches.includedBranches}: <strong>{includedBranches}</strong>
            </span>
          </div>

          <div className="pricing-metric-box">
            <span className="metric-label">
              {t.branches.additionalBranchFee}
            </span>
            <span className="metric-value">
              +{money(extraBranchFeeMinor, tenant.currency)}
              <span className="metric-unit">/mo</span>
            </span>
            <span className="metric-sub">
              {t.branches.extraBranchesBilled}: <strong>{extraBranches}</strong>{" "}
              ({activeCount} {t.branches.activeBranches})
            </span>
          </div>

          <div className="pricing-metric-box highlight">
            <span className="metric-label">{t.branches.totalMonthlyPrice}</span>
            <span className="metric-value total">
              {money(totalMonthlyPriceMinor, tenant.currency)}
              <span className="metric-unit">/mo</span>
            </span>
            <span className="metric-sub highlight-text">
              {extraBranches > 0
                ? `Base + (${extraBranches} × ${money(extraBranchFeeMinor, tenant.currency)})`
                : "Base allowance active"}
            </span>
          </div>
        </div>

        <div className="pricing-note-banner">
          <Coins size={16} className="note-icon" />
          <span>
            {t.branches.dynamicPricingNote
              .replace("{included}", String(includedBranches))
              .replace("{fee}", money(extraBranchFeeMinor, tenant.currency))}
          </span>
        </div>
      </section>

      {/* View Header & Action Bar */}
      <div className="branches-action-bar">
        <div className="branches-stats-summary">
          <h2>{t.branches.title}</h2>
          <span className="branches-count-pill">
            {activeCount} / {branches.length} {t.branches.active}
          </span>
        </div>

        <div className="action-buttons-row">
          <button
            type="button"
            className="icon-button"
            aria-label="Refresh branches"
            disabled={loading}
            onClick={() => void loadBranches()}
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
          {canManage && (
            <button
              type="button"
              className="button primary"
              onClick={openCreateModal}
              disabled={loading}
            >
              <Plus size={16} />
              <span>{t.branches.addBranch}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-box" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Branches Cards Grid */}
      <div className="branches-grid">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className={`branch-card ${branch.active ? "active" : "inactive"} ${branch.is_main ? "is-main" : ""}`}
          >
            <div className="branch-card-header">
              <div className="branch-title-col">
                <div className="branch-heading-line">
                  <Building2 size={18} className="branch-card-icon" />
                  <h3>{branch.name}</h3>
                </div>
                <div className="branch-badges-line">
                  {branch.is_main && (
                    <span className="branch-chip main">
                      {t.branches.mainBranch}
                    </span>
                  )}
                  {branch.code && (
                    <span className="branch-chip code">{branch.code}</span>
                  )}
                  <span
                    className={`branch-chip status ${branch.active ? "active" : "inactive"}`}
                  >
                    {branch.active ? (
                      <>
                        <CheckCircle2 size={12} />
                        {t.branches.active}
                      </>
                    ) : (
                      <>
                        <XCircle size={12} />
                        {t.branches.inactive}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="branch-card-details">
              {branch.address ? (
                <div className="branch-detail-item">
                  <MapPin size={15} />
                  <span>{branch.address}</span>
                </div>
              ) : (
                <div className="branch-detail-item muted">
                  <MapPin size={15} />
                  <span>No address specified</span>
                </div>
              )}
              {branch.phone && (
                <div className="branch-detail-item">
                  <Phone size={15} />
                  <span>{branch.phone}</span>
                </div>
              )}
            </div>

            <div className="branch-card-stats">
              <div className="branch-stat-box">
                <Users size={15} />
                <span>
                  <strong>{branch.staff_count ?? 0}</strong>{" "}
                  {t.branches.staffCount}
                </span>
              </div>
              <div className="branch-stat-box">
                <Receipt size={15} />
                <span>
                  <strong>{branch.orders_count ?? 0}</strong>{" "}
                  {t.branches.ordersCount}
                </span>
              </div>
            </div>

            {canManage && (
              <div className="branch-card-footer">
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={() => openEditModal(branch)}
                >
                  <Edit2 size={14} />
                  <span>{t.branches.editBranch}</span>
                </button>

                {!branch.is_main && (
                  <button
                    type="button"
                    className={`button sm ${branch.active ? "danger-outline" : "primary-outline"}`}
                    onClick={() => void handleToggleActive(branch)}
                    title={t.branches.toggleActive}
                  >
                    <Power size={14} />
                    <span>
                      {branch.active ? t.branches.inactive : t.branches.active}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {branches.length === 0 && !loading && (
          <div className="empty-branches-card">
            <Building2 size={36} className="empty-icon" />
            <h3>{t.branches.noBranches}</h3>
            <p>Get started by creating your salon&apos;s branches.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Branch Dialog Modal */}
      {modalOpen && (
        <dialog
          ref={branchDialog}
          className="form-dialog branch-form-modal"
          aria-labelledby={branchTitleId}
          aria-busy={modalBusy}
          onCancel={(event) => {
            event.preventDefault();
            if (!modalBusy) setModalOpen(false);
          }}
        >
          <div className="branch-form-content">
            <div className="dialog-header">
              <div>
                <p className="branch-form-business">{tenant.name}</p>
                <h2 id={branchTitleId}>
                  {editingBranch ? t.branches.editBranch : t.branches.addBranch}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={t.common.close}
                disabled={modalBusy}
                onClick={() => setModalOpen(false)}
              >
                <X size={19} />
              </button>
            </div>

            {modalError && (
              <div className="error-box" role="alert">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label>
                  {t.branches.branchName}
                  <input
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={editingBranch?.name ?? ""}
                    placeholder="e.g. Kandy Branch, Colombo 03"
                    autoFocus
                    disabled={modalBusy}
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  {t.branches.branchCode}
                  <input
                    name="code"
                    maxLength={20}
                    defaultValue={editingBranch?.code ?? ""}
                    placeholder={t.branches.branchCodePlaceholder}
                    disabled={modalBusy}
                  />
                </label>
                <label>
                  {t.branches.phone}
                  <input
                    name="phone"
                    type="tel"
                    maxLength={30}
                    defaultValue={editingBranch?.phone ?? ""}
                    placeholder="e.g. +94 81 222 3344"
                    disabled={modalBusy}
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  {t.branches.address}
                  <input
                    name="address"
                    maxLength={255}
                    defaultValue={editingBranch?.address ?? ""}
                    placeholder="e.g. 124 Peradeniya Road, Kandy"
                    disabled={modalBusy}
                  />
                </label>
              </div>

              {!editingBranch?.is_main && (
                <label className="checkbox-label branch-active-checkbox">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={editingBranch ? editingBranch.active : true}
                    disabled={modalBusy}
                  />
                  <span>
                    <strong>{t.branches.active}</strong>
                  </span>
                </label>
              )}

              {/* Dynamic Pricing Live Preview */}
              {!editingBranch && (
                <div className="pricing-preview-box">
                  <Sparkles size={16} className="sparkle-icon" />
                  <div>
                    <strong>{t.branches.dynamicPricingTitle}: </strong>
                    <span>
                      {activeCount + 1 > includedBranches
                        ? `Adding this active branch will update your monthly package subscription to ${money(
                            basePriceMinor +
                              (activeCount + 1 - includedBranches) *
                                extraBranchFeeMinor,
                            tenant.currency,
                          )}/mo (+${money(extraBranchFeeMinor, tenant.currency)}/mo).`
                        : `Covered within your base package included branches (${includedBranches} included).`}
                    </span>
                  </div>
                </div>
              )}

              <div className="dialog-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={modalBusy}
                  onClick={() => setModalOpen(false)}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={modalBusy}
                >
                  {modalBusy ? t.common.loading : t.forms.save}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
