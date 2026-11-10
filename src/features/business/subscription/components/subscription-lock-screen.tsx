"use client";

import React, { useState } from "react";
import {
  Lock,
  ShieldAlert,
  ArrowRight,
  Clock,
  Landmark,
  FileCheck2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import type { Tenant, SubscriptionResponse } from "@/lib/types";
import { money } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { SubscriptionRenewalForm } from "./subscription-renewal-form";

export function SubscriptionLockScreen({
  tenant,
  onViewSubscription,
  onRefresh,
}: {
  tenant: Tenant;
  onViewSubscription: () => void;
  onRefresh?: () => void;
}) {
  const { language } = useTranslation();
  const sub = tenant.subscription;
  const [showSlipForm, setShowSlipForm] = useState(true);

  const formattedPeriodEnd = sub?.current_period_end
    ? new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en", {
        timeZone: tenant.timezone,
        dateStyle: "medium",
      }).format(new Date(sub.current_period_end))
    : "—";

  return (
    <section className="subscription-lock-screen" aria-label="Access Locked">
      <div className="lock-hero-card">
        <div className="lock-icon-container">
          <Lock size={36} strokeWidth={2.2} />
        </div>

        <div className="lock-content">
          <span className="lock-eyebrow">
            {language === "si"
              ? "සහන කාලය අවසන් විය · ප්‍රවේශය අත්හිටුවා ඇත"
              : "1-WEEK GRACE PERIOD ENDED · ACCESS SUSPENDED"}
          </span>
          <h1>
            {language === "si"
              ? "ව්‍යාපාර මෙහෙයුම් විකල්ප අගුළු දමා ඇත"
              : "Business Operations Access is Locked"}
          </h1>
          <p className="lock-description">
            {language === "si"
              ? `ඔබගේ සැලුන් පැකේජය ${formattedPeriodEnd} දින අවසන් වූ අතර, සති 1ක අතිරේක සහන කාලයද දැන් ගෙවී ගොස් ඇත. සැලුන් දත්ත සුරක්ෂිතව ඇති අතර, සේවාව යළි සක්‍රිය කිරීමට කරුණාකර ඔබගේ ගෙවීම් පත්‍රිකාව (Slip) ඉදිරිපත් කරන්න.`
              : `Your package expired on ${formattedPeriodEnd}, and the 1-week renewal grace window has completed. Operational tools (Appointments, POS, Catalog, Team, Payroll) are locked. Your business data is safely preserved. Submit your renewal payment slip below to instantly notify the admin team and restore full access.`}
          </p>

          <div className="lock-meta-badges">
            <div className="lock-meta-item">
              <span className="meta-label">
                {language === "si" ? "පැකේජය" : "Current Plan"}
              </span>
              <strong>{sub?.plan_name || "Salon Business Plan"}</strong>
            </div>
            <div className="lock-meta-item">
              <span className="meta-label">
                {language === "si" ? "නැවත අලුත් කිරීමේ මිල" : "Renewal Fee"}
              </span>
              <strong>
                {sub
                  ? money(sub.price_minor, sub.currency) +
                    ` / ${sub.billing_interval}`
                  : "—"}
              </strong>
            </div>
            <div className="lock-meta-item">
              <span className="meta-label">
                {language === "si" ? "තත්ත්වය" : "Status"}
              </span>
              <span className="status-pill is-expired">
                {language === "si" ? "කාලය ඉකුත් විය" : "Grace Ended · Locked"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {sub && (
        <div className="lock-renewal-section">
          <SubscriptionRenewalForm
            tenant={tenant}
            subscription={sub}
            onSubmitted={() => {
              onRefresh?.();
              onViewSubscription();
            }}
          />
        </div>
      )}
    </section>
  );
}
