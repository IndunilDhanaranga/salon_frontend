"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Globe,
  Package,
  PieChart,
  Printer,
  RefreshCw,
  Scissors,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useBranchApi } from "@/features/business/branches/branch-context";
import { initials, message, money } from "@/lib/format";
import type { BusinessReportResponse, Tenant } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

type ReportTab =
  "sales" | "staff" | "catalog" | "appointments" | "financial" | "branches";
type RangeOption = "today" | "7d" | "30d" | "month" | "last_month" | "all";

export function BusinessReportsView({ tenant }: { tenant: Tenant }) {
  const api = useBranchApi();
  const { t, language } = useTranslation();
  const [data, setData] = useState<BusinessReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState<RangeOption>("30d");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  const load = useCallback(
    async (
      selectedRange: RangeOption,
      branchId: string,
      signal?: AbortSignal,
    ) => {
      setLoading(true);
      setError("");
      try {
        const query = new URLSearchParams({ range: selectedRange });
        if (branchId && branchId !== "all") {
          query.set("branch_id", branchId);
        }
        const response = await api<BusinessReportResponse>(
          `reports?${query.toString()}`,
          {
            tenant: tenant.slug,
            branch:
              branchId === "all" && tenant.has_all_branches_access === false
                ? undefined
                : branchId,
            signal,
          },
        );
        if (!signal?.aborted) {
          setData(response);
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
    void load(range, selectedBranch, controller.signal);
    return () => controller.abort();
  }, [load, range, selectedBranch]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrintingAll(false);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handlePrint = (all: boolean) => {
    setIsPrintingAll(all);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const ranges: { id: RangeOption; label: string }[] = [
    { id: "today", label: t.businessReports.ranges.today },
    { id: "7d", label: t.businessReports.ranges.sevenDays },
    { id: "30d", label: t.businessReports.ranges.thirtyDays },
    { id: "month", label: t.businessReports.ranges.thisMonth },
    { id: "last_month", label: t.businessReports.ranges.lastMonth },
    { id: "all", label: t.businessReports.ranges.allTime },
  ];

  const reportTabs: {
    id: ReportTab;
    label: string;
    icon: typeof TrendingUp;
  }[] = [
    { id: "sales", label: t.businessReports.tabs.sales, icon: TrendingUp },
    { id: "staff", label: t.businessReports.tabs.staff, icon: Users },
    { id: "catalog", label: t.businessReports.tabs.catalog, icon: Package },
    {
      id: "appointments",
      label: t.businessReports.tabs.appointments,
      icon: CalendarDays,
    },
    { id: "financial", label: t.businessReports.tabs.financial, icon: Wallet },
    ...(data?.branches_comparison && data.branches_comparison.length > 0
      ? [
          {
            id: "branches" as ReportTab,
            label: t.businessReports.tabs.branches,
            icon: Building2,
          },
        ]
      : []),
  ];

  const currency = data?.meta.currency || tenant.currency || "LKR";

  return (
    <div className="business-reports-container">
      {/* Printable Report Header (visible on paper/PDF export) */}
      <div className="print-only report-print-header">
        <h1>{tenant.name}</h1>
        <p className="eyebrow">
          {t.businessReports.title} –{" "}
          {isPrintingAll
            ? language === "si"
              ? "සම්පූර්ණ ව්‍යාපාරික වාර්තාව (සියලු අංශ)"
              : "Comprehensive Salon Report (All Sections)"
            : reportTabs.find((tab) => tab.id === activeTab)?.label}
        </p>
        <p>
          {selectedBranch === "all"
            ? t.businessReports.allBranchesCentralized
            : `${t.businessReports.branch}: ${data?.meta.branches?.find((b) => b.id === selectedBranch)?.name ?? selectedBranch}`}
        </p>
        <p>
          {t.businessReports.range}: {data?.meta.start_date} –{" "}
          {data?.meta.end_date} ({data?.meta.timezone}) · {currency}
        </p>
      </div>

      {/* Control bar: Range pills + Refresh + Print */}
      <div className="reports-control-bar no-print">
        <div
          className="reports-range-selector"
          role="group"
          aria-label={t.businessReports.range}
        >
          {ranges.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`range-pill ${range === item.id ? "selected" : ""}`}
              onClick={() => setRange(item.id)}
              disabled={loading}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="reports-actions">
          <button
            type="button"
            className="icon-button"
            aria-label={t.common.refresh}
            title={t.common.refresh}
            disabled={loading}
            onClick={() => void load(range, selectedBranch)}
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
          <button
            type="button"
            className="button secondary small-button"
            onClick={() => handlePrint(false)}
            disabled={loading || !data}
            title={
              language === "si"
                ? "මෙම අංශය මුද්‍රණය කරන්න"
                : "Print active report tab"
            }
          >
            <Printer size={16} />
            <span>{t.businessReports.printReport}</span>
          </button>
          <button
            type="button"
            className="button secondary small-button"
            onClick={() => handlePrint(true)}
            disabled={loading || !data}
            title={
              language === "si"
                ? "සියලුම අංශ මුද්‍රණය කරන්න"
                : "Print all report sections"
            }
          >
            <Printer size={16} />
            <span>
              {language === "si" ? "සම්පූර්ණ වාර්තාව" : "Full Report"}
            </span>
          </button>
        </div>
      </div>

      {/* Branch selector pills (centralized vs individual branch) */}
      {data?.meta.branches && data.meta.branches.length > 0 && (
        <div className="reports-branch-bar no-print">
          <div className="reports-branch-label">
            <Building2 size={15} />
            <span>{t.businessReports.filterByBranch}:</span>
          </div>
          <div className="reports-branch-pills">
            <button
              type="button"
              className={`branch-pill ${selectedBranch === "all" ? "selected" : ""}`}
              onClick={() => setSelectedBranch("all")}
              disabled={loading}
            >
              <Globe size={13} style={{ marginRight: 4 }} />
              {t.businessReports.allBranchesCentralized}
            </button>
            {data.meta.branches.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`branch-pill ${selectedBranch === b.id ? "selected" : ""}`}
                onClick={() => setSelectedBranch(b.id)}
                disabled={loading}
              >
                <Building2 size={13} style={{ marginRight: 4 }} />
                {b.name}
                {b.is_main && (
                  <span
                    className="branch-main-chip-xs"
                    style={{ marginLeft: 6 }}
                  >
                    {t.branches.mainBranch}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="error-box" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => void load(range, selectedBranch)}
          >
            {t.common.tryAgain}
          </button>
        </div>
      )}

      {/* Navigation tabs for separate reports */}
      <div className="reports-sub-nav no-print" role="tablist">
        {reportTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`reports-tab-btn ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="workspace-skeleton" aria-busy="true">
          <div />
          <div />
          <div />
          <section />
        </div>
      ) : data ? (
        <div className="reports-content-body">
          {/* ============================================================== */}
          {/* TAB 1: SALES & REVENUE REPORT                                  */}
          {/* ============================================================== */}
          {(activeTab === "sales" || isPrintingAll) && (
            <section className="report-section">
              {isPrintingAll && (
                <h2
                  className="print-only"
                  style={{ fontSize: 18, marginBottom: 12 }}
                >
                  1. {t.businessReports.tabs.sales}
                </h2>
              )}
              <div className="stats-grid">
                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.grossRevenue}</span>
                    <TrendingUp size={18} strokeWidth={1.6} />
                  </div>
                  <strong>
                    {money(data.sales.gross_revenue_minor, currency)}
                  </strong>
                  <span className="stat-note">
                    {data.sales.paid_orders} {t.businessReports.tables.orders}
                  </span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.avgTicket}</span>
                    <DollarSign size={18} strokeWidth={1.6} />
                  </div>
                  <strong>
                    {money(data.sales.avg_ticket_minor, currency)}
                  </strong>
                  <span className="stat-note">{t.billing.bill}</span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.totalCommissions}</span>
                    <Wallet size={18} strokeWidth={1.6} />
                  </div>
                  <strong>
                    {money(data.sales.total_commission_minor, currency)}
                  </strong>
                  <span className="stat-note">{t.team.commission}</span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.unpaidRevenue}</span>
                    <Clock size={18} strokeWidth={1.6} />
                  </div>
                  <strong>
                    {money(data.sales.unpaid_revenue_minor, currency)}
                  </strong>
                  <span className="stat-note">
                    {data.sales.unpaid_orders} {t.businessReports.tables.orders}
                  </span>
                </article>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="panel report-panel">
                <div className="section-heading">
                  <div>
                    <h3>{t.businessReports.charts.paymentMethodBreakdown}</h3>
                    <p className="muted">
                      {t.billing.cash}, {t.billing.card},{" "}
                      {t.billing.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="payment-method-grid">
                  <div className="method-card">
                    <div className="method-card-header">
                      <span className="method-badge cash">
                        {t.billing.cash}
                      </span>
                      <strong>
                        {data.sales.payment_methods.cash.percentage}%
                      </strong>
                    </div>
                    <h4>
                      {money(
                        data.sales.payment_methods.cash.total_minor,
                        currency,
                      )}
                    </h4>
                    <span className="muted small">
                      {data.sales.payment_methods.cash.count}{" "}
                      {t.businessReports.tables.orders}
                    </span>
                    <div className="progress-track">
                      <div
                        className="progress-fill cash"
                        style={{
                          width: `${data.sales.payment_methods.cash.percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="method-card">
                    <div className="method-card-header">
                      <span className="method-badge card">
                        {t.billing.card}
                      </span>
                      <strong>
                        {data.sales.payment_methods.card.percentage}%
                      </strong>
                    </div>
                    <h4>
                      {money(
                        data.sales.payment_methods.card.total_minor,
                        currency,
                      )}
                    </h4>
                    <span className="muted small">
                      {data.sales.payment_methods.card.count}{" "}
                      {t.businessReports.tables.orders}
                    </span>
                    <div className="progress-track">
                      <div
                        className="progress-fill card"
                        style={{
                          width: `${data.sales.payment_methods.card.percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="method-card">
                    <div className="method-card-header">
                      <span className="method-badge other">
                        {t.businessReports.tables.other}
                      </span>
                      <strong>
                        {data.sales.payment_methods.other.percentage}%
                      </strong>
                    </div>
                    <h4>
                      {money(
                        data.sales.payment_methods.other.total_minor,
                        currency,
                      )}
                    </h4>
                    <span className="muted small">
                      {data.sales.payment_methods.other.count}{" "}
                      {t.businessReports.tables.orders}
                    </span>
                    <div className="progress-track">
                      <div
                        className="progress-fill other"
                        style={{
                          width: `${data.sales.payment_methods.other.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Trend Table */}
              <div className="panel report-panel">
                <div className="section-heading">
                  <div>
                    <h3>{t.businessReports.tables.date}</h3>
                    <p className="muted">
                      {data.meta.start_date} – {data.meta.end_date}
                    </p>
                  </div>
                </div>

                {!data.sales.daily_trend.length ? (
                  <p className="muted small">{t.billing.emptyDesc}</p>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.businessReports.tables.date}</th>
                          <th>{t.businessReports.tables.orders}</th>
                          <th>{t.businessReports.tables.cash}</th>
                          <th>{t.businessReports.tables.card}</th>
                          <th>{t.businessReports.tables.other}</th>
                          <th style={{ textAlign: "right" }}>
                            {t.businessReports.tables.total}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.sales.daily_trend.map((row) => (
                          <tr key={row.date}>
                            <td>
                              <strong>{row.date}</strong>
                            </td>
                            <td>{row.orders_count}</td>
                            <td>{money(row.cash_minor, currency)}</td>
                            <td>{money(row.card_minor, currency)}</td>
                            <td>{money(row.other_minor, currency)}</td>
                            <td
                              className="money-label"
                              style={{ textAlign: "right" }}
                            >
                              {money(row.total_minor, currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* TAB 2: STAFF PERFORMANCE & COMMISSIONS                         */}
          {/* ============================================================== */}
          {(activeTab === "staff" || isPrintingAll) && (
            <section className="report-section">
              {isPrintingAll && (
                <h2
                  className="print-only"
                  style={{ fontSize: 18, marginBottom: 12 }}
                >
                  2. {t.businessReports.tabs.staff}
                </h2>
              )}
              <div className="stats-grid">
                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.totalCommissions}</span>
                    <Wallet size={18} strokeWidth={1.6} />
                  </div>
                  <strong>
                    {money(data.sales.total_commission_minor, currency)}
                  </strong>
                  <span className="stat-note">{t.team.yourTeam}</span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.topStylist}</span>
                    <UserCheck size={18} strokeWidth={1.6} />
                  </div>
                  <strong>{data.staff[0]?.name || "—"}</strong>
                  <span className="stat-note">
                    {data.staff[0]
                      ? money(data.staff[0].revenue_minor, currency)
                      : "—"}
                  </span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.overview.completedServices}</span>
                    <CheckCircle2 size={18} strokeWidth={1.6} />
                  </div>
                  <strong>{data.appointments.completed}</strong>
                  <span className="stat-note">
                    {t.appointments.yourSchedule}
                  </span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.overview.yourTeam}</span>
                    <Users size={18} strokeWidth={1.6} />
                  </div>
                  <strong>{data.staff.length}</strong>
                  <span className="stat-note">{t.team.activeMembersCount}</span>
                </article>
              </div>

              <div className="panel report-panel">
                <div className="section-heading">
                  <div>
                    <h3>{t.businessReports.tabs.staff}</h3>
                    <p className="muted">{t.team.peopleBehindChair}</p>
                  </div>
                </div>

                {!data.staff.length ? (
                  <p className="muted small">{t.team.emptyDesc}</p>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.businessReports.tables.staffMember}</th>
                          <th>{t.businessReports.tables.appointmentsCount}</th>
                          <th>{t.businessReports.tables.completedCount}</th>
                          <th>{t.businessReports.tables.orders}</th>
                          <th>{t.businessReports.tables.revenueGenerated}</th>
                          <th>{t.team.commission} %</th>
                          <th>{t.businessReports.tables.commissionEarned}</th>
                          <th>{t.businessReports.tables.contribution}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.staff.map((member) => (
                          <tr key={member.id}>
                            <td>
                              <div className="client-cell">
                                <span className="avatar small">
                                  {initials(member.name)}
                                </span>
                                <div>
                                  <strong>{member.name}</strong>
                                  <span className="cell-sub">
                                    {member.job_title}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{member.appointments_count}</td>
                            <td>
                              <span className="status completed">
                                {member.completed_appointments}
                              </span>
                            </td>
                            <td>{member.orders_count}</td>
                            <td className="money-label">
                              {money(member.revenue_minor, currency)}
                            </td>
                            <td>{member.commission_rate}%</td>
                            <td className="money-label">
                              <strong>
                                {money(member.commission_minor, currency)}
                              </strong>
                            </td>
                            <td style={{ minWidth: 120 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  className="progress-track"
                                  style={{ flex: 1, margin: 0 }}
                                >
                                  <div
                                    className="progress-fill card"
                                    style={{
                                      width: `${Math.min(100, member.contribution_percentage)}%`,
                                    }}
                                  />
                                </div>
                                <span className="small">
                                  {member.contribution_percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* TAB 3: SERVICES & PRODUCTS BREAKDOWN                           */}
          {/* ============================================================== */}
          {(activeTab === "catalog" || isPrintingAll) && (
            <section className="report-section">
              {isPrintingAll && (
                <h2
                  className="print-only"
                  style={{ fontSize: 18, marginBottom: 12 }}
                >
                  3. {t.businessReports.tabs.catalog}
                </h2>
              )}
              <div className="stats-grid">
                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.servicesRevenue}</span>
                    <Scissors size={18} strokeWidth={1.6} />
                  </div>
                  <strong>
                    {money(data.catalog.service_revenue_minor, currency)}
                  </strong>
                  <span className="stat-note">
                    {data.catalog.service_share}%{" "}
                    {t.businessReports.tables.salesShare}
                  </span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.productsRevenue}</span>
                    <Package size={18} strokeWidth={1.6} />
                  </div>
                  <strong>
                    {money(data.catalog.product_revenue_minor, currency)}
                  </strong>
                  <span className="stat-note">
                    {data.catalog.product_share}%{" "}
                    {t.businessReports.tables.salesShare}
                  </span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.totalItemsSold}</span>
                    <PieChart size={18} strokeWidth={1.6} />
                  </div>
                  <strong>{data.catalog.total_items_sold}</strong>
                  <span className="stat-note">
                    {t.catalog.services} & {t.catalog.products}
                  </span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.grossRevenue}</span>
                    <TrendingUp size={18} strokeWidth={1.6} />
                  </div>
                  <strong>
                    {money(data.sales.gross_revenue_minor, currency)}
                  </strong>
                  <span className="stat-note">100%</span>
                </article>
              </div>

              {/* Service vs Product split visual */}
              <div className="panel report-panel">
                <div className="section-heading">
                  <div>
                    <h3>{t.businessReports.charts.serviceVsProduct}</h3>
                    <p className="muted">
                      {t.catalog.services}: {data.catalog.service_share}% ·{" "}
                      {t.catalog.products}: {data.catalog.product_share}%
                    </p>
                  </div>
                </div>

                <div className="split-progress-bar">
                  <div
                    className="split-fill service"
                    style={{ width: `${data.catalog.service_share}%` }}
                    title={`Services: ${data.catalog.service_share}%`}
                  />
                  <div
                    className="split-fill product"
                    style={{ width: `${data.catalog.product_share}%` }}
                    title={`Products: ${data.catalog.product_share}%`}
                  />
                </div>
              </div>

              {/* Catalog Items Performance Table */}
              <div className="panel report-panel">
                <div className="section-heading">
                  <div>
                    <h3>{t.businessReports.tabs.catalog}</h3>
                    <p className="muted">{t.catalog.subtitle}</p>
                  </div>
                </div>

                {!data.catalog.items.length ? (
                  <p className="muted small">{t.catalog.subtitle}</p>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.businessReports.tables.itemName}</th>
                          <th>{t.businessReports.tables.type}</th>
                          <th>{t.businessReports.tables.unitPrice}</th>
                          <th>{t.businessReports.tables.quantitySold}</th>
                          <th>{t.businessReports.tables.revenueGenerated}</th>
                          <th>{t.businessReports.tables.salesShare}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.catalog.items.map((item, idx) => (
                          <tr key={`${item.name}-${idx}`}>
                            <td>
                              <div className="client-cell">
                                <span className="catalog-icon">
                                  {item.type === "service" ? (
                                    <Scissors size={16} />
                                  ) : (
                                    <Package size={16} />
                                  )}
                                </span>
                                <strong>{item.name}</strong>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`status ${item.type === "service" ? "booked" : "completed"}`}
                              >
                                {item.type === "service"
                                  ? t.catalog.service
                                  : t.catalog.product}
                              </span>
                            </td>
                            <td>{money(item.unit_price_minor, currency)}</td>
                            <td>
                              <strong>{item.quantity}</strong>
                            </td>
                            <td className="money-label">
                              <strong>
                                {money(item.total_minor, currency)}
                              </strong>
                            </td>
                            <td style={{ minWidth: 120 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  className="progress-track"
                                  style={{ flex: 1, margin: 0 }}
                                >
                                  <div
                                    className="progress-fill cash"
                                    style={{
                                      width: `${Math.min(100, item.share_percentage)}%`,
                                    }}
                                  />
                                </div>
                                <span className="small">
                                  {item.share_percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* TAB 4: APPOINTMENTS & CLIENT TRENDS                            */}
          {/* ============================================================== */}
          {(activeTab === "appointments" || isPrintingAll) && (
            <section className="report-section">
              {isPrintingAll && (
                <h2
                  className="print-only"
                  style={{ fontSize: 18, marginBottom: 12 }}
                >
                  4. {t.businessReports.tabs.appointments}
                </h2>
              )}
              <div className="stats-grid">
                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.totalAppointments}</span>
                    <CalendarDays size={18} strokeWidth={1.6} />
                  </div>
                  <strong>{data.appointments.total_appointments}</strong>
                  <span className="stat-note">
                    {t.appointments.yourSchedule}
                  </span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.completionRate}</span>
                    <CheckCircle2 size={18} strokeWidth={1.6} />
                  </div>
                  <strong>{data.appointments.completion_rate}%</strong>
                  <span className="stat-note">
                    {data.appointments.completed} {t.status.completed}
                  </span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.cancellationRate}</span>
                    <XCircle size={18} strokeWidth={1.6} />
                  </div>
                  <strong>{data.appointments.cancellation_rate}%</strong>
                  <span className="stat-note">
                    {data.appointments.cancelled} {t.status.cancelled}
                  </span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.uniqueClients}</span>
                    <Users size={18} strokeWidth={1.6} />
                  </div>
                  <strong>{data.appointments.unique_clients}</strong>
                  <span className="stat-note">
                    {t.appointments.clientAndService}
                  </span>
                </article>
              </div>

              {/* Time of Day Distribution */}
              <div className="panel report-panel">
                <div className="section-heading">
                  <div>
                    <h3>{t.businessReports.charts.timeOfDay}</h3>
                    <p className="muted">
                      {t.overview.allTimesIn} {data.meta.timezone}
                    </p>
                  </div>
                </div>

                <div className="payment-method-grid">
                  <div className="method-card">
                    <span className="method-badge booked">
                      {t.businessReports.charts.morning}
                    </span>
                    <h4>{data.appointments.time_distribution.morning.count}</h4>
                    <span className="muted small">
                      {data.appointments.time_distribution.morning.percentage}%{" "}
                      {t.appointments.bookTitle}
                    </span>
                    <div className="progress-track">
                      <div
                        className="progress-fill cash"
                        style={{
                          width: `${data.appointments.time_distribution.morning.percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="method-card">
                    <span className="method-badge completed">
                      {t.businessReports.charts.afternoon}
                    </span>
                    <h4>
                      {data.appointments.time_distribution.afternoon.count}
                    </h4>
                    <span className="muted small">
                      {data.appointments.time_distribution.afternoon.percentage}
                      % {t.appointments.bookTitle}
                    </span>
                    <div className="progress-track">
                      <div
                        className="progress-fill card"
                        style={{
                          width: `${data.appointments.time_distribution.afternoon.percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="method-card">
                    <span className="method-badge other">
                      {t.businessReports.charts.evening}
                    </span>
                    <h4>{data.appointments.time_distribution.evening.count}</h4>
                    <span className="muted small">
                      {data.appointments.time_distribution.evening.percentage}%{" "}
                      {t.appointments.bookTitle}
                    </span>
                    <div className="progress-track">
                      <div
                        className="progress-fill other"
                        style={{
                          width: `${data.appointments.time_distribution.evening.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Day of Week Breakdown Table */}
              <div className="panel report-panel">
                <div className="section-heading">
                  <div>
                    <h3>{t.businessReports.charts.dayOfWeek}</h3>
                    <p className="muted">{t.appointments.yourSchedule}</p>
                  </div>
                </div>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.businessReports.tables.date}</th>
                        <th>{t.businessReports.tables.appointmentsCount}</th>
                        <th>{t.businessReports.tables.salesShare}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.appointments.day_distribution).map(
                        ([day, count]) => {
                          const total =
                            data.appointments.total_appointments || 1;
                          const percentage = Math.round((count / total) * 100);
                          return (
                            <tr key={day}>
                              <td>
                                <strong>{day}</strong>
                              </td>
                              <td>{count}</td>
                              <td style={{ minWidth: 160 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <div
                                    className="progress-track"
                                    style={{ flex: 1, margin: 0 }}
                                  >
                                    <div
                                      className="progress-fill card"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="small">{percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* TAB 5: FINANCIAL P&L SUMMARY                                   */}
          {/* ============================================================== */}
          {(activeTab === "financial" || isPrintingAll) && (
            <section className="report-section">
              {isPrintingAll && (
                <h2
                  className="print-only"
                  style={{ fontSize: 18, marginBottom: 12 }}
                >
                  5. {t.businessReports.tabs.financial}
                </h2>
              )}
              <div className="stats-grid">
                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.grossRevenue}</span>
                    <TrendingUp size={18} strokeWidth={1.6} />
                  </div>
                  <strong>
                    {money(data.financial.gross_revenue_minor, currency)}
                  </strong>
                  <span className="stat-note">{t.billing.paid}</span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.totalStaffCost}</span>
                    <Wallet size={18} strokeWidth={1.6} />
                  </div>
                  <strong>
                    {money(data.financial.total_staff_cost_minor, currency)}
                  </strong>
                  <span className="stat-note">{t.payroll.noticeTitle}</span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.salonGrossMargin}</span>
                    <DollarSign size={18} strokeWidth={1.6} />
                  </div>
                  <strong
                    style={{
                      color:
                        data.financial.net_margin_minor >= 0
                          ? "var(--teal)"
                          : "var(--danger)",
                    }}
                  >
                    {money(data.financial.net_margin_minor, currency)}
                  </strong>
                  <span className="stat-note">
                    {t.workspaceDetails.builtWithRoom}
                  </span>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>{t.businessReports.kpis.marginPercentage}</span>
                    <PieChart size={18} strokeWidth={1.6} />
                  </div>
                  <strong>{data.financial.net_margin_percentage}%</strong>
                  <span className="stat-note">
                    {data.financial.net_margin_minor >= 0
                      ? t.common.success
                      : t.common.error}
                  </span>
                </article>
              </div>

              {/* Financial Ledger Breakdown */}
              <div className="panel report-panel">
                <div className="section-heading">
                  <div>
                    <h3>{t.businessReports.tabs.financial}</h3>
                    <p className="muted">
                      {data.meta.start_date} – {data.meta.end_date}
                    </p>
                  </div>
                </div>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.businessReports.tables.metric}</th>
                        <th style={{ textAlign: "right" }}>
                          {t.businessReports.tables.amount}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>{t.businessReports.kpis.grossRevenue}</strong>
                          <span className="cell-sub">{t.billing.subtitle}</span>
                        </td>
                        <td
                          className="money-label"
                          style={{ textAlign: "right", color: "var(--teal)" }}
                        >
                          +{money(data.financial.gross_revenue_minor, currency)}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>
                            {t.businessReports.kpis.totalCommissions}
                          </strong>
                          <span className="cell-sub">{t.team.commission}</span>
                        </td>
                        <td
                          className="money-label"
                          style={{ textAlign: "right", color: "var(--danger)" }}
                        >
                          -
                          {money(
                            data.financial.commissions_expense_minor,
                            currency,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>
                            {t.businessReports.kpis.estimatedBaseSalaries}
                          </strong>
                          <span className="cell-sub">
                            {t.payroll.salary} ({range})
                          </span>
                        </td>
                        <td
                          className="money-label"
                          style={{ textAlign: "right", color: "var(--danger)" }}
                        >
                          -
                          {money(
                            data.financial.estimated_base_salary_expense_minor,
                            currency,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>
                            {t.deductions.kpis.dailyBusinessDeductions}
                          </strong>
                          <span className="cell-sub">
                            {t.deductions.title} ({range})
                          </span>
                        </td>
                        <td
                          className="money-label"
                          style={{ textAlign: "right", color: "var(--danger)" }}
                        >
                          -
                          {money(
                            data.financial.daily_deductions_expense_minor ?? 0,
                            currency,
                          )}
                        </td>
                      </tr>
                      <tr
                        style={{
                          borderTop: "2px solid var(--line)",
                          background: "var(--mint)",
                        }}
                      >
                        <td>
                          <strong style={{ fontSize: "1.05rem" }}>
                            {t.businessReports.kpis.salonGrossMargin}
                          </strong>
                          <span className="cell-sub">
                            {t.businessReports.kpis.marginPercentage}:{" "}
                            {data.financial.net_margin_percentage}%
                          </span>
                        </td>
                        <td
                          className="money-label"
                          style={{
                            textAlign: "right",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            color:
                              data.financial.net_margin_minor >= 0
                                ? "var(--teal)"
                                : "var(--danger)",
                          }}
                        >
                          {money(data.financial.net_margin_minor, currency)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* TAB 6: MULTI-BRANCH PERFORMANCE COMPARISON                     */}
          {/* ============================================================== */}
          {(activeTab === "branches" || isPrintingAll) &&
            data.branches_comparison &&
            data.branches_comparison.length > 0 && (
              <section className="report-section">
                {isPrintingAll && (
                  <h2
                    className="print-only"
                    style={{ fontSize: 18, marginBottom: 12 }}
                  >
                    6. {t.businessReports.tabs.branches}
                  </h2>
                )}
                <div className="section-header">
                  <div>
                    <h3>{t.businessReports.branchesComparison}</h3>
                    <p className="section-sub">
                      {t.businessReports.branchesComparisonDesc}
                    </p>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>{t.businessReports.branch}</th>
                        <th style={{ textAlign: "right" }}>
                          {t.businessReports.tables.orders}
                        </th>
                        <th style={{ textAlign: "right" }}>
                          {t.businessReports.tables.appointmentsCount}
                        </th>
                        <th style={{ textAlign: "right" }}>
                          {t.businessReports.kpis.grossRevenue}
                        </th>
                        <th style={{ textAlign: "right" }}>
                          {t.businessReports.kpis.totalStaffCost}
                        </th>
                        <th style={{ textAlign: "right" }}>
                          {t.deductions.kpis.dailyBusinessDeductions}
                        </th>
                        <th style={{ textAlign: "right" }}>
                          {t.deductions.kpis.staffAdvances}
                        </th>
                        <th style={{ textAlign: "right" }}>
                          {t.businessReports.kpis.salonGrossMargin}
                        </th>
                        <th style={{ textAlign: "right" }}>
                          {t.businessReports.profitMargin}
                        </th>
                        <th style={{ textAlign: "right" }}>
                          {t.businessReports.contribution}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.branches_comparison.map((branch) => {
                        const isProfitable = branch.profit_minor >= 0;
                        return (
                          <tr key={branch.id}>
                            <td>
                              <div className="cell-with-avatar">
                                <span className="branch-table-icon">
                                  <Building2 size={16} />
                                </span>
                                <div>
                                  <strong>{branch.name}</strong>
                                  <div
                                    className="badges-row-inline"
                                    style={{
                                      display: "flex",
                                      gap: 4,
                                      marginTop: 2,
                                    }}
                                  >
                                    {branch.is_main && (
                                      <span className="branch-main-chip-xs">
                                        {t.branches.mainBranch}
                                      </span>
                                    )}
                                    {branch.code && (
                                      <span className="branch-code-tag-xs">
                                        {branch.code}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {branch.orders_count}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {branch.appointments_count}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>
                              {money(branch.revenue_minor, currency)}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {money(branch.staff_cost_minor, currency)}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {money(branch.deductions_minor, currency)}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {money(branch.advances_minor, currency)}
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                fontWeight: 700,
                                color: isProfitable
                                  ? "var(--teal)"
                                  : "var(--danger)",
                              }}
                            >
                              {money(branch.profit_minor, currency)}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span
                                className={`badge-pill ${isProfitable ? "success" : "danger"}`}
                              >
                                {branch.profit_margin_percentage}%
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <strong>{branch.contribution_percentage}%</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="table-total-row">
                        <td>
                          <strong>
                            {t.businessReports.centralizedSummary}
                          </strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <strong>
                            {data.branches_comparison.reduce(
                              (sum, b) => sum + b.orders_count,
                              0,
                            )}
                          </strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <strong>
                            {data.branches_comparison.reduce(
                              (sum, b) => sum + b.appointments_count,
                              0,
                            )}
                          </strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <strong>
                            {money(
                              data.branches_comparison.reduce(
                                (sum, b) => sum + b.revenue_minor,
                                0,
                              ),
                              currency,
                            )}
                          </strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <strong>
                            {money(
                              data.branches_comparison.reduce(
                                (sum, b) => sum + b.staff_cost_minor,
                                0,
                              ),
                              currency,
                            )}
                          </strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <strong>
                            {money(
                              data.branches_comparison.reduce(
                                (sum, b) => sum + b.deductions_minor,
                                0,
                              ),
                              currency,
                            )}
                          </strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <strong>
                            {money(
                              data.branches_comparison.reduce(
                                (sum, b) => sum + b.advances_minor,
                                0,
                              ),
                              currency,
                            )}
                          </strong>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            color:
                              data.branches_comparison.reduce(
                                (sum, b) => sum + b.profit_minor,
                                0,
                              ) >= 0
                                ? "var(--teal)"
                                : "var(--danger)",
                          }}
                        >
                          <strong>
                            {money(
                              data.branches_comparison.reduce(
                                (sum, b) => sum + b.profit_minor,
                                0,
                              ),
                              currency,
                            )}
                          </strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <strong>
                            {data.financial.net_margin_percentage}%
                          </strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <strong>100%</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            )}
        </div>
      ) : null}
    </div>
  );
}
