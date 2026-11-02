"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { money, message } from "@/lib/format";
import { subscriptionFeatures, subscriptionStatusLabel } from "@/lib/access";
import type { SubscriptionResponse, Tenant } from "@/lib/types";
import { SubscriptionPlans } from "./subscription-plans";
import { useTranslation } from "@/lib/i18n";

export function SubscriptionView({ tenant }: { tenant: Tenant }) {
  const { t, language } = useTranslation();
  const [response, setResponse] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      } catch (error) {
        if (!signal?.aborted) {
          setResponse(null);
          setError(message(error));
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [tenant.slug],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const subscription = response?.data;
  const label = subscriptionStatusLabel(subscription ?? null);
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
                  className={`status ${subscription.access_allowed ? "completed" : "cancelled"}`}
                >
                  {label}
                </span>
              </div>
              <p className="muted">
                {subscription.status === "trialing"
                  ? t.subscription.freeTrialNotice
                  : `${money(subscription.price_minor, subscription.currency)} / ${subscription.billing_interval} · ${t.subscription.recordedPlanPrice}`}
              </p>
              <dl>
                <div>
                  <dt>{t.subscription.businessAccess}</dt>
                  <dd>
                    {subscription.access_allowed
                      ? `${subscription.days_remaining} ${t.subscription.daysRemaining}`
                      : t.subscription.accessEnded}
                  </dd>
                </div>
                <div>
                  <dt>{language === "si" ? "වත්මන් කාලසීමාව ඇරඹුම" : "Current period starts"}</dt>
                  <dd>{date(subscription.current_period_start)}</dd>
                </div>
                <div>
                  <dt>{language === "si" ? "ප්‍රවේශය අවසන් වීම" : "Access ends"}</dt>
                  <dd>{date(subscription.current_period_end)}</dd>
                </div>
                <div>
                  <dt>{language === "si" ? "නොමිලේ අත්හදා බැලීම ඇරඹුම" : "Free trial started"}</dt>
                  <dd>{date(subscription.trial_starts_at)}</dd>
                </div>
                <div>
                  <dt>{language === "si" ? "නොමිලේ අත්හදා බැලීම අවසන් වීම" : "Free trial ends"}</dt>
                  <dd>{date(subscription.trial_ends_at)}</dd>
                </div>
                {subscription.cancelled_at && (
                  <div>
                    <dt>{language === "si" ? "අවලංගු කරන ලදි" : "Cancelled"}</dt>
                    <dd>{date(subscription.cancelled_at)}</dd>
                  </div>
                )}
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
              {!subscription.access_allowed && (
                <div className="form-note">
                  <strong>{language === "si" ? "ඔබේ දත්ත සුරක්ෂිතව ඇත." : "Your business data is retained."}</strong>
                  <p>
                    {language === "si"
                      ? "ගිණුම යළි සක්‍රිය කිරීමට පරිපාලක අමතන්න."
                      : "Ask the platform administrator to activate a plan and record the next access period."}
                  </p>
                </div>
              )}
            </>
          )
        )}
      </section>
      {response && <SubscriptionPlans plans={response.plans} />}
    </div>
  );
}
