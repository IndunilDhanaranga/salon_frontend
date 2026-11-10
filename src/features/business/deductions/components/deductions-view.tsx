"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Coins,
  Receipt,
  Wallet,
  CalendarDays,
  Plus,
  RefreshCw,
  Trash2,
  X,
  ArrowRight,
  Package,
  Coffee,
  Zap,
  Wrench,
  Home,
  Truck,
  Megaphone,
  HelpCircle,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  Send,
} from "lucide-react";
import { useBranchApi } from "@/features/business/branches/branch-context";
import { initials, message, money } from "@/lib/format";
import type {
  Deduction,
  DeductionListResponse,
  DeductionOptionsResponse,
  Tenant,
} from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import { canPermission } from "@/lib/access";

type RangeOption = "today" | "7d" | "30d" | "month" | "last_month" | "all";
type FilterType = "all" | "business" | "staff_advance";
type ComposerType = "business" | "staff_advance" | null;

const CATEGORY_ICONS: Record<string, typeof Package> = {
  supplies: Package,
  refreshments: Coffee,
  utilities: Zap,
  maintenance: Wrench,
  rent: Home,
  transport: Truck,
  marketing: Megaphone,
  salary_advance: Wallet,
  other: HelpCircle,
};

export function DeductionsView({ tenant }: { tenant: Tenant }) {
  const api = useBranchApi();
  const { t, language } = useTranslation();
  const canManage =
    canPermission(tenant, "deductions.manage") ||
    canPermission(tenant, "payroll.manage");

  const [data, setData] = useState<DeductionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState<RangeOption>("30d");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Options for staff selector and categories
  const [options, setOptions] = useState<DeductionOptionsResponse | null>(null);

  // Composer state
  const [composer, setComposer] = useState<ComposerType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Business deduction form state
  const [bAmount, setBAmount] = useState("");
  const [bCategory, setBCategory] = useState("supplies");
  const [bDate, setBDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [bPaymentMethod, setBPaymentMethod] = useState("cash");
  const [bNotes, setBNotes] = useState("");

  // Staff advance form state
  const [sStaffId, setSStaffId] = useState("");
  const [sAmount, setSAmount] = useState("");
  const [sDate, setSDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [sPaymentMethod, setSPaymentMethod] = useState("cash");
  const [sNotes, setSNotes] = useState("");

  const loadData = useCallback(
    async (
      selectedRange: RangeOption,
      selectedType: FilterType,
      signal?: AbortSignal,
    ) => {
      setLoading(true);
      setError("");
      try {
        const typeQuery = selectedType === "all" ? "" : `&type=${selectedType}`;
        const res = await api<DeductionListResponse>(
          `deductions?range=${selectedRange}${typeQuery}`,
          {
            tenant: tenant.slug,
            signal,
          },
        );
        if (!signal?.aborted) {
          setData(res);
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

  const loadOptions = useCallback(async () => {
    try {
      const res = await api<DeductionOptionsResponse>("deduction-options", {
        tenant: tenant.slug,
      });
      setOptions(res);
      if (res.staff.length > 0 && !sStaffId) {
        setSStaffId(res.staff[0].id);
      }
    } catch {
      // Non-blocking
    }
  }, [tenant.slug, sStaffId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadData(range, filterType, controller.signal);
    return () => controller.abort();
  }, [loadData, range, filterType]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const openBusinessComposer = () => {
    setBAmount("");
    setBCategory("supplies");
    setBDate(new Date().toISOString().slice(0, 10));
    setBPaymentMethod("cash");
    setBNotes("");
    setFormError("");
    setComposer("business");
  };

  const openStaffAdvanceComposer = () => {
    setSAmount("");
    setSDate(new Date().toISOString().slice(0, 10));
    setSPaymentMethod("cash");
    setSNotes("");
    setFormError("");
    if (options?.staff.length && !sStaffId) {
      setSStaffId(options.staff[0].id);
    }
    setComposer("staff_advance");
  };

  const handleCloseComposer = () => {
    if (!submitting) {
      setComposer(null);
      setFormError("");
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(bAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError(
        language === "si"
          ? "වලංගු මුදලක් ඇතුළත් කරන්න."
          : "Please enter a valid amount.",
      );
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await api<Deduction>("deductions", {
        method: "POST",
        tenant: tenant.slug,
        body: {
          type: "business",
          category: bCategory,
          amount_minor: Math.round(parsedAmount * 100),
          date: bDate,
          payment_method: bPaymentMethod,
          notes: bNotes.trim() || undefined,
        },
      });
      setComposer(null);
      await loadData(range, filterType);
    } catch (err) {
      setFormError(message(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStaffAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sStaffId) {
      setFormError(
        language === "si"
          ? "කරුණාකර කාර්ය මණ්ඩල සාමාජිකයෙකු තෝරන්න."
          : "Please select a team member.",
      );
      return;
    }
    const parsedAmount = parseFloat(sAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError(
        language === "si"
          ? "වලංගු මුදලක් ඇතුළත් කරන්න."
          : "Please enter a valid amount.",
      );
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await api<Deduction>("deductions", {
        method: "POST",
        tenant: tenant.slug,
        body: {
          type: "staff_advance",
          staff_id: sStaffId,
          amount_minor: Math.round(parsedAmount * 100),
          date: sDate,
          payment_method: sPaymentMethod,
          notes: sNotes.trim() || undefined,
        },
      });
      setComposer(null);
      await loadData(range, filterType);
    } catch (err) {
      setFormError(message(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.deductions.deleteConfirm)) return;
    setDeletingId(id);
    try {
      await api(`deductions/${id}`, {
        method: "DELETE",
        tenant: tenant.slug,
      });
      await loadData(range, filterType);
    } catch (err) {
      alert(message(err));
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    const key = category as keyof typeof t.deductions.categories;
    return t.deductions.categories[key] ?? category;
  };

  const rangeLabels: Record<RangeOption, string> = {
    today: t.businessReports.ranges.today,
    "7d": t.businessReports.ranges.sevenDays,
    "30d": t.businessReports.ranges.thirtyDays,
    month: t.businessReports.ranges.thisMonth,
    last_month: t.businessReports.ranges.lastMonth,
    all: t.businessReports.ranges.allTime,
  };

  const items = data?.data ?? [];
  const businessItemsCount = items.filter((d) => d.type === "business").length;
  const advanceItemsCount = items.filter(
    (d) => d.type === "staff_advance",
  ).length;

  return (
    <div className="deductions-content">
      {/* 4 Brand KPI Summary Cards */}
      <section className="stats-grid" aria-label={t.deductions.title}>
        <article className="stat">
          <div className="stat-top">
            <span>{t.deductions.kpis.totalDeductions}</span>
            <Coins size={18} strokeWidth={1.6} />
          </div>
          <strong style={{ color: "var(--danger)" }}>
            {money(data?.summary.total_minor ?? 0, tenant.currency)}
          </strong>
          <span className="stat-note">
            {data?.summary.count ?? 0} {t.deductions.kpis.recordedEntries}
          </span>
        </article>

        <article className="stat">
          <div className="stat-top">
            <span>{t.deductions.kpis.dailyBusinessDeductions}</span>
            <Receipt size={18} strokeWidth={1.6} />
          </div>
          <strong>
            {money(data?.summary.total_business_minor ?? 0, tenant.currency)}
          </strong>
          <span className="stat-note">{t.deductions.type.business}</span>
        </article>

        <article className="stat">
          <div className="stat-top">
            <span>{t.deductions.kpis.staffAdvances}</span>
            <Wallet size={18} strokeWidth={1.6} />
          </div>
          <strong style={{ color: "var(--pine)" }}>
            {money(
              data?.summary.total_staff_advance_minor ?? 0,
              tenant.currency,
            )}
          </strong>
          <span className="stat-note">{t.payroll.deductions}</span>
        </article>

        <article className="stat">
          <div className="stat-top">
            <span>{t.deductions.date}</span>
            <CalendarDays size={18} strokeWidth={1.6} />
          </div>
          <strong>{rangeLabels[range]}</strong>
          <span className="stat-note">
            {businessItemsCount} {t.deductions.dailyDeductions} ·{" "}
            {advanceItemsCount} {t.deductions.staffAdvances}
          </span>
        </article>
      </section>

      {/* Main Panel */}
      <section className="panel deductions-panel">
        {/* Section Heading with Primary & Secondary Actions */}
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t.deductions.title}</span>
            <h2>{t.deductions.subtitle}</h2>
          </div>
          <div className="heading-actions">
            <button
              className="button secondary small-button"
              onClick={() => void loadData(range, filterType)}
              disabled={loading}
              title={t.common.refresh}
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} />
              {t.common.refresh}
            </button>
            {canManage && (
              <>
                <button
                  className="button secondary small-button"
                  onClick={openBusinessComposer}
                  disabled={loading || composer === "business"}
                >
                  <Plus size={15} />
                  {t.deductions.addBusinessDeduction}
                </button>
                <button
                  className="button primary small-button"
                  onClick={openStaffAdvanceComposer}
                  disabled={loading || composer === "staff_advance"}
                >
                  <Wallet size={15} />
                  {t.deductions.addStaffAdvance}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="error-box inset" role="alert">
            {error}
            <button
              className="text-button"
              onClick={() => void loadData(range, filterType)}
            >
              {t.common.tryAgain}
            </button>
          </p>
        )}

        {/* Toolbar: Range Pills */}
        <div className="deductions-toolbar">
          <div className="deductions-range-group">
            {(
              [
                "today",
                "7d",
                "30d",
                "month",
                "last_month",
                "all",
              ] as RangeOption[]
            ).map((r) => (
              <button
                key={r}
                className={`range-pill ${range === r ? "selected" : ""}`}
                onClick={() => setRange(r)}
                disabled={loading}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Sub Navigation / Type Filter Tabs */}
        <div className="filter-tabs" aria-label={t.deductions.title}>
          <button
            className={filterType === "all" ? "selected" : ""}
            onClick={() => setFilterType("all")}
          >
            <Coins size={14} />
            {t.deductions.allDeductions}
            <span>{data?.summary.count ?? 0}</span>
          </button>
          <button
            className={filterType === "business" ? "selected" : ""}
            onClick={() => setFilterType("business")}
          >
            <Receipt size={14} />
            {t.deductions.dailyDeductions}
            <span>{businessItemsCount}</span>
          </button>
          <button
            className={filterType === "staff_advance" ? "selected" : ""}
            onClick={() => setFilterType("staff_advance")}
          >
            <Wallet size={14} />
            {t.deductions.staffAdvances}
            <span>{advanceItemsCount}</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* INLINE COMPOSER: ADD DAILY BUSINESS DEDUCTION                 */}
        {/* ============================================================== */}
        {composer === "business" && (
          <form className="inline-composer" onSubmit={handleSaveBusiness}>
            <div className="inline-composer-header">
              <div>
                <h3>{t.deductions.newDeduction}</h3>
                <p>{t.deductions.subtitle}</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={t.common.close}
                disabled={submitting}
                onClick={handleCloseComposer}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <p className="error-box" role="alert">
                {formError}
              </p>
            )}

            <div className="form-grid">
              <label>
                {t.deductions.category} *
                <select
                  value={bCategory}
                  onChange={(e) => setBCategory(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="supplies">
                    {t.deductions.categories.supplies}
                  </option>
                  <option value="refreshments">
                    {t.deductions.categories.refreshments}
                  </option>
                  <option value="utilities">
                    {t.deductions.categories.utilities}
                  </option>
                  <option value="maintenance">
                    {t.deductions.categories.maintenance}
                  </option>
                  <option value="rent">{t.deductions.categories.rent}</option>
                  <option value="transport">
                    {t.deductions.categories.transport}
                  </option>
                  <option value="marketing">
                    {t.deductions.categories.marketing}
                  </option>
                  <option value="other">{t.deductions.categories.other}</option>
                </select>
              </label>

              <label>
                {t.deductions.amount} ({tenant.currency}) *
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={bAmount}
                  onChange={(e) => setBAmount(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                {t.deductions.date} *
                <input
                  type="date"
                  required
                  value={bDate}
                  onChange={(e) => setBDate(e.target.value)}
                  disabled={submitting}
                />
              </label>

              <label>
                {t.deductions.paymentMethod} *
                <select
                  value={bPaymentMethod}
                  onChange={(e) => setBPaymentMethod(e.target.value)}
                  disabled={submitting}
                >
                  <option value="cash">{t.billing.cash}</option>
                  <option value="card">{t.billing.card}</option>
                  <option value="bank_transfer">
                    {language === "si"
                      ? "බැංකු හුවමාරුව (Bank Transfer)"
                      : "Bank Transfer"}
                  </option>
                  <option value="other">
                    {language === "si" ? "වෙනත් (Other)" : "Other"}
                  </option>
                </select>
              </label>
            </div>

            <label>
              {t.deductions.notes}
              <input
                type="text"
                placeholder={
                  language === "si"
                    ? "වියදම් විස්තරය හෝ රිසිට්පත් අංකය..."
                    : "Receipt number, vendor, or purpose..."
                }
                value={bNotes}
                onChange={(e) => setBNotes(e.target.value)}
                disabled={submitting}
                maxLength={255}
              />
            </label>

            <div className="inline-composer-actions">
              <button
                type="button"
                className="button secondary"
                disabled={submitting}
                onClick={handleCloseComposer}
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={submitting}
              >
                {submitting ? t.common.pleaseWait : t.forms.save}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* INLINE COMPOSER: ADD STAFF SALARY ADVANCE                     */}
        {/* ============================================================== */}
        {composer === "staff_advance" && (
          <form className="inline-composer" onSubmit={handleSaveStaffAdvance}>
            <div className="inline-composer-header">
              <div>
                <h3>{t.deductions.newStaffAdvance}</h3>
                <p>
                  {language === "si"
                    ? "සේවක වැටුප් අත්තිකාරම ලියාපදිංචි කරන්න."
                    : "Record a staff salary advance against upcoming payroll."}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={t.common.close}
                disabled={submitting}
                onClick={handleCloseComposer}
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-note">
              <strong>{t.deductions.type.staff_advance}</strong>
              <p>
                {language === "si"
                  ? "මෙම අත්තිකාරම් මුදල කාර්ය මණ්ඩල සාමාජිකයාගේ ඉදිරි මාසික වැටුපෙන් ස්වයංක්‍රීයව අඩු කරනු ලැබේ."
                  : "This advance will automatically deduct from the staff member's next monthly payroll run."}
              </p>
            </div>

            {formError && (
              <p className="error-box" role="alert">
                {formError}
              </p>
            )}

            <div className="form-grid">
              <label>
                {t.deductions.staffMember} *
                <select
                  required
                  value={sStaffId}
                  onChange={(e) => setSStaffId(e.target.value)}
                  disabled={submitting}
                  autoFocus
                >
                  <option value="" disabled>
                    {t.forms.selectTeamMember}
                  </option>
                  {options?.staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.job_title})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t.deductions.amount} ({tenant.currency}) *
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={sAmount}
                  onChange={(e) => setSAmount(e.target.value)}
                  disabled={submitting}
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                {t.deductions.date} *
                <input
                  type="date"
                  required
                  value={sDate}
                  onChange={(e) => setSDate(e.target.value)}
                  disabled={submitting}
                />
              </label>

              <label>
                {t.deductions.paymentMethod} *
                <select
                  value={sPaymentMethod}
                  onChange={(e) => setSPaymentMethod(e.target.value)}
                  disabled={submitting}
                >
                  <option value="cash">{t.billing.cash}</option>
                  <option value="bank_transfer">
                    {language === "si"
                      ? "බැංකු හුවමාරුව (Bank Transfer)"
                      : "Bank Transfer"}
                  </option>
                  <option value="card">{t.billing.card}</option>
                  <option value="other">
                    {language === "si" ? "වෙනත් (Other)" : "Other"}
                  </option>
                </select>
              </label>
            </div>

            <label>
              {t.deductions.notes}
              <input
                type="text"
                placeholder={
                  language === "si"
                    ? "අත්තිකාරම් හේතුව හෝ සටහන..."
                    : "Purpose or reason for the advance..."
                }
                value={sNotes}
                onChange={(e) => setSNotes(e.target.value)}
                disabled={submitting}
                maxLength={255}
              />
            </label>

            <div className="inline-composer-actions">
              <button
                type="button"
                className="button secondary"
                disabled={submitting}
                onClick={handleCloseComposer}
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={submitting}
              >
                {submitting ? t.common.pleaseWait : t.forms.save}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Loading line */}
        {loading && !data ? (
          <p className="loading-line" role="status">
            {t.common.loading}…
          </p>
        ) : !items.length ? (
          /* Empty State */
          <div className="empty-state">
            <Coins size={28} strokeWidth={1.3} />
            <h3>{t.deductions.noDeductionsFound}</h3>
            <p>{t.deductions.noDeductionsDesc}</p>
            {canManage && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  marginTop: 16,
                }}
              >
                <button
                  className="button secondary small-button"
                  onClick={openBusinessComposer}
                >
                  <Plus size={15} />
                  {t.deductions.addBusinessDeduction}
                </button>
                <button
                  className="button primary small-button"
                  onClick={openStaffAdvanceComposer}
                >
                  <Wallet size={15} />
                  {t.deductions.addStaffAdvance}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-scroll desktop-record-table">
              <table>
                <thead>
                  <tr>
                    <th>{t.deductions.date}</th>
                    <th>{t.deductions.category}</th>
                    <th>{t.deductions.staffMember}</th>
                    <th>{t.deductions.paymentMethod}</th>
                    <th>{t.deductions.notes}</th>
                    <th style={{ textAlign: "right" }}>
                      {t.deductions.amount}
                    </th>
                    {canManage && (
                      <th>
                        <span className="sr-only">{t.common.actions}</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isAdvance = item.type === "staff_advance";
                    const Icon = isAdvance
                      ? Wallet
                      : CATEGORY_ICONS[item.category] || Package;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Calendar size={13} className="muted" />
                            <strong className="time-label">{item.date}</strong>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`category-badge ${isAdvance ? "advance" : "business"}`}
                          >
                            <Icon size={13} />
                            {isAdvance
                              ? t.deductions.type.staff_advance
                              : getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td>
                          {isAdvance ? (
                            <div className="client-cell">
                              <span className="client-avatar">
                                {initials(item.staff_name || "S")}
                              </span>
                              <div>
                                <strong>{item.staff_name || "—"}</strong>
                                <span className="cell-sub">
                                  {t.deductions.staffMember}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="client-cell">
                              <span className="catalog-icon">
                                <Building2 size={16} />
                              </span>
                              <div>
                                <strong>{tenant.name}</strong>
                                <span className="cell-sub">
                                  {t.deductions.type.business}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="payment-tag">
                            {item.payment_method === "cash" ? (
                              <Banknote size={11} />
                            ) : item.payment_method === "card" ? (
                              <CreditCard size={11} />
                            ) : (
                              <Send size={11} />
                            )}
                            {item.payment_method === "cash"
                              ? t.billing.cash
                              : item.payment_method === "card"
                                ? t.billing.card
                                : item.payment_method === "bank_transfer"
                                  ? language === "si"
                                    ? "බැංකු හුවමාරුව"
                                    : "Bank Transfer"
                                  : item.payment_method}
                          </span>
                        </td>
                        <td
                          style={{
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.notes ? (
                            <span title={item.notes}>{item.notes}</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="deduction-amount-cell">
                          -{money(item.amount_minor, tenant.currency)}
                        </td>
                        {canManage && (
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="icon-button delete-action-btn"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              title={t.common.delete}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Records View */}
            <div className="mobile-records" aria-label={t.deductions.title}>
              {items.map((item) => {
                const isAdvance = item.type === "staff_advance";
                const Icon = isAdvance
                  ? Wallet
                  : CATEGORY_ICONS[item.category] || Package;

                return (
                  <article key={item.id} className="mobile-record">
                    <div className="mobile-record-heading">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Calendar size={13} className="muted" />
                        <strong>{item.date}</strong>
                      </div>
                      <span
                        className={`category-badge ${isAdvance ? "advance" : "business"}`}
                      >
                        <Icon size={12} />
                        {isAdvance
                          ? t.deductions.type.staff_advance
                          : getCategoryLabel(item.category)}
                      </span>
                    </div>

                    <h3>
                      {isAdvance
                        ? item.staff_name || t.deductions.staffMember
                        : getCategoryLabel(item.category)}
                    </h3>

                    <p>
                      {isAdvance ? `${tenant.name} · ` : ""}
                      {item.notes ||
                        (isAdvance
                          ? t.deductions.type.staff_advance
                          : tenant.name)}
                    </p>

                    <div className="mobile-record-meta">
                      <span className="payment-tag">
                        {item.payment_method === "cash"
                          ? t.billing.cash
                          : item.payment_method === "card"
                            ? t.billing.card
                            : item.payment_method}
                      </span>
                      <strong className="deduction-amount-cell">
                        -{money(item.amount_minor, tenant.currency)}
                      </strong>
                    </div>

                    {canManage && (
                      <div className="row-actions" style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          className="button secondary small-button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          style={{ color: "var(--danger)", width: "100%" }}
                        >
                          <Trash2 size={14} />
                          {t.common.delete}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
