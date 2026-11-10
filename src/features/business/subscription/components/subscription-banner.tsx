"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Clock,
  FileCheck2,
  Lock,
  Sparkles,
} from "lucide-react";
import type { Tenant } from "@/lib/types";
import {
  getGracePeriodDaysRemaining,
  hasBusinessAccess,
  isSubscriptionInGracePeriod,
  subscriptionStatusLabel,
} from "@/lib/access";
import { useTranslation } from "@/lib/i18n";

export function SubscriptionBanner({
  tenant,
  onView,
}: {
  tenant: Tenant;
  onView: () => void;
}) {
  const { language } = useTranslation();
  const subscription = tenant.subscription;
  if (!subscription) return null;

  const inGrace = isSubscriptionInGracePeriod(subscription);
  const pendingRenewal = subscription.status === "pending_renewal";
  const hasAccess = hasBusinessAccess(tenant);
  const daysLeftInGrace = getGracePeriodDaysRemaining(subscription);

  const endsFormatted = new Intl.DateTimeFormat(
    language === "si" ? "si-LK" : "en",
    {
      timeZone: tenant.timezone,
      dateStyle: "medium",
    },
  ).format(new Date(subscription.current_period_end));

  // 1. Pending Renewal Slip under admin review
  if (pendingRenewal) {
    return (
      <aside
        className="business-subscription-banner is-pending-review"
        aria-label="Renewal pending review"
      >
        <div className="banner-icon-badge is-pending">
          <Clock size={20} className="spin-slow" />
        </div>
        <div className="banner-text">
          <strong>
            {language === "si"
              ? "ගෙවීම් තහවුරු කිරීම පරිපාලක අනුමැතිය සඳහා යවා ඇත"
              : "Payment Slip Submitted & Awaiting Admin Approval"}
          </strong>
          <p>
            {language === "si"
              ? "ඔබගේ නැවත ගෙවීම් පත්‍රිකාව පරීක්ෂා කරමින් පවතී. අනුමත වූ වහාම දායකත්ව කාලය ස්වයංක්‍රීයව දීර්ඝ කෙරේ."
              : "Your renewal payment slip is being reviewed by the platform admin. Access remains active and package will auto-renew upon approval."}
          </p>
        </div>
        <button
          type="button"
          className="button secondary small-button"
          onClick={onView}
        >
          <span>{language === "si" ? "විස්තර බලන්න" : "View Status"}</span>
          <ArrowRight size={14} />
        </button>
      </aside>
    );
  }

  // 2. 1-Week Grace Period with Urgent Warning
  if (inGrace) {
    return (
      <aside
        className="business-subscription-banner is-grace-warning"
        aria-label="Renewal grace period warning"
      >
        <div className="banner-icon-badge is-warning">
          <AlertTriangle size={20} />
        </div>
        <div className="banner-text">
          <strong>
            {language === "si"
              ? `අවවාදයයි: දායකත්වය අවසන් විය — දින ${daysLeftInGrace}ක සහන කාලය සක්‍රියයි`
              : `⚠️ Renew Warning: Subscription Expired (${daysLeftInGrace} Day${daysLeftInGrace === 1 ? "" : "s"} Grace Left)`}
          </strong>
          <p>
            {language === "si"
              ? `ඔබගේ දායකත්වය ${endsFormatted} දින අවසන් විය. දින 7ක සහන කාලය අවසන් වූ පසු සියලුම ව්‍යාපාර විකල්ප අක්‍රිය වනු ඇත. කරුණාකර දැන්ම බැංකු රිසිට්පත යොමු කරන්න.`
              : `Your package expired on ${endsFormatted}. You have 1 week grace access (${daysLeftInGrace} day${daysLeftInGrace === 1 ? "" : "s"} remaining). After this week, all business features will be strictly locked.`}
          </p>
        </div>
        <button
          type="button"
          className="button primary small-button"
          onClick={onView}
        >
          <span>
            {language === "si" ? "ගෙවීම් පත්‍රිකාව එවන්න" : "Submit Payment Slip"}
          </span>
          <ArrowRight size={14} />
        </button>
      </aside>
    );
  }

  // 3. Grace Period Ended: Access Completely Locked Out
  if (!hasAccess) {
    return (
      <aside
        className="business-subscription-banner is-locked-out"
        aria-label="Subscription locked"
      >
        <div className="banner-icon-badge is-danger">
          <Lock size={20} />
        </div>
        <div className="banner-text">
          <strong>
            {language === "si"
              ? "දායකත්වය අවලංගුයි: ව්‍යාපාරික විකල්ප අගුළු දමා ඇත"
              : "🔒 Subscription Expired — Business Options Are Locked"}
          </strong>
          <p>
            {language === "si"
              ? "දින 7ක සහන කාලයද අවසන් වී ඇති බැවින් පද්ධති මෙහෙයුම් ප්‍රවේශය අත්හිටුවා ඇත. නැවත සක්‍රිය කිරීමට ගෙවීම් පත්‍රිකාව යොමු කරන්න."
              : "Your 1-week grace period has expired. Access to salon operations is restricted. Submit your bank or online transfer payment slip to restore access."}
          </p>
        </div>
        <button
          type="button"
          className="button primary small-button"
          onClick={onView}
        >
          <span>{language === "si" ? "යළි සක්‍රිය කරන්න" : "Renew & Unlock Now"}</span>
          <ArrowRight size={14} />
        </button>
      </aside>
    );
  }

  // 4. Free trial with less than 7 days left reminder
  if (subscription.status === "trialing") {
    const trialEnd = new Date(subscription.current_period_end).getTime();
    const daysLeft = Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7 && daysLeft >= 0) {
      return (
        <aside
          className="business-subscription-banner is-trial-notice"
          aria-label="Free trial expiring soon"
        >
          <div className="banner-icon-badge is-info">
            <Sparkles size={18} />
          </div>
          <div className="banner-text">
            <strong>
              {language === "si"
                ? `නොමිලේ අත්හදා බැලීම තව දින ${daysLeft}කින් අවසන් වේ`
                : `Free Trial Ends in ${daysLeft} Day${daysLeft === 1 ? "" : "s"}`}
            </strong>
            <p>
              {language === "si"
                ? `සියලුම විශේෂාංග ${endsFormatted} දක්වා ඇතුළත්ය. සේවාව බාධාවකින් තොරව පවත්වා ගැනීමට පැකේජයක් තෝරාගන්න.`
                : `All features remain included until ${endsFormatted}. Choose a package early to ensure uninterrupted salon workflow.`}
            </p>
          </div>
          <button
            type="button"
            className="button secondary small-button"
            onClick={onView}
          >
            <span>{language === "si" ? "පැකේජ බලන්න" : "View Packages"}</span>
            <ArrowRight size={14} />
          </button>
        </aside>
      );
    }
  }

  // Active paid subscription with no alert needed
  return null;
}
