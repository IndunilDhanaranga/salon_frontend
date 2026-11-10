"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Eye,
  X,
} from "lucide-react";
import { useBranchApi } from "@/features/workspace/branch-context";
import { money, message } from "@/lib/format";
import {
  subscriptionFeatures,
  subscriptionStatusLabel,
  isSubscriptionInGracePeriod,
  getGracePeriodDaysRemaining,
} from "@/lib/access";
import type {
  SubscriptionResponse,
  SubscriptionRenewal,
  Tenant,
} from "@/lib/types";
import { SubscriptionPlans } from "./subscription-plans";
import { SubscriptionRenewalForm } from "./subscription-renewal-form";
import { useTranslation } from "@/lib/i18n";

export function SubscriptionView({ tenant }: { tenant: Tenant }) {
  const api = useBranchApi();
  const { t, language } = useTranslation();
  const [response, setResponse] = useState<SubscriptionResponse | null>(null);
  const [renewals, setRenewals] = useState<SubscriptionRenewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSlipModal, setActiveSlipModal] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const value = await api<SubscriptionResponse>("subscription", {
          tenant: tenant.slug,
          signal,
        });
        if (!signal?.aborted) setResponse(value);

        // Fetch past submitted renewal slips
        try {
          const renewalsRes = await api<{ data: SubscriptionRenewal[] }>(
            "subscription/renewals",
            { tenant: tenant.slug, signal },
          );
          if (!signal?.aborted && Array.isArray(renewalsRes?.data)) {
            setRenewals(renewalsRes.data);
          }
        } catch {
          // Silent fallback if endpoint not populated yet
        }
      } catch (error) {
        if (!signal?.aborted) {
          setResponse(null);
          setError(message(error));
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [api, tenant.slug],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const subscription = response?.data;
  const label = subscriptionStatusLabel(subscription ?? null);
  const inGrace = isSubscriptionInGracePeriod(subscription ?? null);
  const graceDays = getGracePeriodDaysRemaining(subscription ?? null);

  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en", {
          timeZone: tenant.timezone,
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "—";

  const features =
    subscription?.status === "trialing" && subscription.access_allowed
      ? subscriptionFeatures.map((item) => item.key)
      : (subscription?.features ?? []);

  return (
    <div className="subscription-business-content">
      {error && (
        <p className="error-box" role="alert">
          {error}
          <button className="text-button" onClick={() => void load()}>
            {t.common.tryAgain}
          </button>
        </p>
      )}

      {/* Main Status Panel */}
      <section className="panel workspace-details">
        <div className="inline-form-title">
          <h2>{t.subscription.title}</h2>
          <button
            className="icon-button"
            aria-label={t.common.refresh}
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>

        {loading && !subscription ? (
          <p role="status">{t.common.loading}…</p>
        ) : (
          subscription && (
            <>
              <div className="subscription-current-heading">
                <h3>{subscription.plan_name}</h3>
                <span
                  className={`status ${
                    subscription.status === "active" ||
                    subscription.status === "trialing"
                      ? "completed"
                      : inGrace
                        ? "in-progress"
                        : "cancelled"
                  }`}
                >
                  {label}
                </span>
              </div>

              <p className="muted">
                {subscription.status === "trialing"
                  ? t.subscription.freeTrialNotice
                  : inGrace
                    ? `⚠️ You are currently in the 1-week grace period (${graceDays} day${graceDays === 1 ? "" : "s"} remaining). Submit your payment slip below to prevent full lockout.`
                    : `${money(subscription.price_minor, subscription.currency)} / ${subscription.billing_interval} · ${t.subscription.recordedPlanPrice}`}
              </p>

              <dl>
                <div>
                  <dt>{t.subscription.businessAccess}</dt>
                  <dd>
                    {inGrace
                      ? `Grace Period: ${graceDays} day${graceDays === 1 ? "" : "s"} remaining`
                      : subscription.access_allowed
                        ? `${subscription.days_remaining} ${t.subscription.daysRemaining}`
                        : t.subscription.accessEnded}
                  </dd>
                </div>
                <div>
                  <dt>
                    {language === "si"
                      ? "වත්මන් කාලසීමාව ඇරඹුම"
                      : "Current period starts"}
                  </dt>
                  <dd>{date(subscription.current_period_start)}</dd>
                </div>
                <div>
                  <dt>
                    {language === "si" ? "ප්‍රවේශය අවසන් වීම" : "Access ends"}
                  </dt>
                  <dd>{date(subscription.current_period_end)}</dd>
                </div>
                {subscription.grace_period_ends_at && (
                  <div>
                    <dt>
                      {language === "si"
                        ? "සහන කාලය අවසන් වීම"
                        : "1-Week Grace Ends"}
                    </dt>
                    <dd>{date(subscription.grace_period_ends_at)}</dd>
                  </div>
                )}
                <div>
                  <dt>
                    {language === "si"
                      ? "නොමිලේ අත්හදා බැලීම ඇරඹුම"
                      : "Free trial started"}
                  </dt>
                  <dd>{date(subscription.trial_starts_at)}</dd>
                </div>
                <div>
                  <dt>
                    {language === "si"
                      ? "නොමිලේ අත්හදා බැලීම අවසන් වීම"
                      : "Free trial ends"}
                  </dt>
                  <dd>{date(subscription.trial_ends_at)}</dd>
                </div>
              </dl>

              <h3>{t.subscription.includedFeatures}</h3>
              <ul className="subscription-feature-list">
                {features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} aria-hidden="true" />
                    {subscriptionFeatures.find((item) => item.key === feature)
                      ?.label ?? feature}
                  </li>
                ))}
              </ul>

              {/* Grace Period & Pending Warnings */}
              {inGrace && (
                <div className="form-note warning">
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <AlertTriangle size={20} />
                    <div>
                      <strong>
                        {language === "si"
                          ? `අවවාදයයි: දින ${graceDays}කින් ව්‍යාපාර විකල්ප අගුළු වැටෙනු ඇත.`
                          : `Warning: ${graceDays} day${graceDays === 1 ? "" : "s"} left in 1-week grace period.`}
                      </strong>
                      <p>
                        {language === "si"
                          ? "ඔබගේ දායකත්ව කාලය අවසන් වී ඇති නමුත් සතියක සහන කාලය ලබාදී ඇත. මෙම සතියෙන් පසු සියලුම මෙහෙයුම් සම්පූර්ණයෙන්ම අක්‍රිය වනු ඇත. කරුණාකර පහතින් ගෙවීම් පත්‍රිකාව ඉදිරිපත් කරන්න."
                          : "Every paid subscription receives a 1-week grace period with warning. After this week, business options are locked. Submit your deposit slip below to auto-renew."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {subscription.status === "pending_renewal" && (
                <div className="form-note info">
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Clock size={20} />
                    <div>
                      <strong>
                        {language === "si"
                          ? "නැවත ගෙවීම් ඉල්ලීම පරිපාලක අනුමැතිය සඳහා යවා ඇත."
                          : "Payment slip submitted and awaiting admin approval."}
                      </strong>
                      <p>
                        {language === "si"
                          ? "පරිපාලක විසින් ඔබගේ ගෙවීම් පත්‍රිකාව තහවුරු කළ වහාම දායකත්ව කාලය ස්වයංක්‍රීයව අලුත් කෙරේ."
                          : "Your payment slip is being reviewed. Upon approval, your package will auto-renew and access will be fully restored."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </section>

      {/* Payment Slip Submission Form */}
      {response && (
        <SubscriptionRenewalForm
          tenant={tenant}
          subscription={subscription ?? response.data}
          onSubmitted={() => void load()}
        />
      )}

      {/* Submitted Renewal History */}
      {renewals.length > 0 && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>
                {language === "si"
                  ? "ඉදිරිපත් කරන ලද ගෙවීම් පත්‍රිකා ඉතිහාසය"
                  : "Submitted Payment Slips & Renewal History"}
              </h3>
              <p>
                {language === "si"
                  ? "ඔබ විසින් ඉදිරිපත් කරන ලද බැංකු රිසිට්පත් සහ පරිපාලක තීරණ."
                  : "Track your uploaded bank slips, review status, and administrator feedback."}
              </p>
            </div>
          </div>

          <div className="renewals-history-list">
            {renewals.map((item) => {
              // Extract slip data url if saved in proof_url or notes
              const slipUrl =
                item.proof_url ||
                (item.notes?.includes("[SLIP_ATTACHMENT]: ")
                  ? item.notes.split("[SLIP_ATTACHMENT]: ")[1]?.trim()
                  : null);

              return (
                <div key={item.id} className="renewal-history-card">
                  <div className="renewal-history-header">
                    <div className="renewal-history-info">
                      <span className="renewal-method-tag">
                        Payment Slip
                      </span>
                      <strong>
                        {money(
                          item.amount_minor,
                          subscription?.currency || "LKR",
                        )}
                      </strong>
                      <span className="renewal-ref-code">Ref: {item.reference}</span>
                    </div>

                    <span
                      className={`status-pill ${
                        item.status === "approved"
                          ? "is-approved"
                          : item.status === "rejected"
                            ? "is-rejected"
                            : "is-pending"
                      }`}
                    >
                      {item.status === "approved" ? (
                        <>
                          <CheckCircle2 size={13} /> Approved & Renewed
                        </>
                      ) : item.status === "rejected" ? (
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

                  <div className="renewal-history-body">
                    <div className="renewal-date-sub">
                      Submitted on {new Date(item.created_at).toLocaleString()}
                    </div>

                    {item.notes && (
                      <p className="renewal-user-note">
                        {item.notes.split("[SLIP_ATTACHMENT]:")[0]?.trim()}
                      </p>
                    )}

                    {item.review_notes && (
                      <div
                        className={`admin-review-callout ${
                          item.status === "approved"
                            ? "is-success"
                            : "is-rejection"
                        }`}
                      >
                        <strong>Admin Feedback:</strong>
                        <p>{item.review_notes}</p>
                      </div>
                    )}

                    {slipUrl && (
                      <button
                        type="button"
                        className="button secondary small-button"
                        onClick={() => setActiveSlipModal(slipUrl)}
                      >
                        <Eye size={14} />
                        <span>View Attached Slip</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available Plans Catalog */}
      {response && <SubscriptionPlans plans={response.plans} />}

      {/* Slip Image Lightbox Modal */}
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
              <h3>Bank Payment Slip</h3>
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
              <img src={activeSlipModal} alt="Payment slip proof" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
