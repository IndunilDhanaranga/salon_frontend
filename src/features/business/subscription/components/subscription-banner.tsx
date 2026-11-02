"use client";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { Tenant } from "@/lib/types";
import { hasBusinessAccess, subscriptionStatusLabel } from "@/lib/access";

export function SubscriptionBanner({
  tenant,
  onView,
}: {
  tenant: Tenant;
  onView: () => void;
}) {
  const subscription = tenant.subscription;
  const label = subscriptionStatusLabel(subscription);
  const ends = subscription
    ? new Intl.DateTimeFormat("en", {
        timeZone: tenant.timezone,
        dateStyle: "medium",
      }).format(new Date(subscription.current_period_end))
    : null;
  if (subscription?.status === "active" && hasBusinessAccess(tenant))
    return null;
  return (
    <aside
      className="business-subscription-banner"
      aria-label="Subscription status"
    >
      <CalendarClock size={20} />
      <div>
        <strong>
          {label === "Free trial"
            ? "Your first calendar month is free."
            : `Subscription ${label.toLowerCase()}.`}
        </strong>
        <p>
          {hasBusinessAccess(tenant)
            ? `All features are included until ${ends}.`
            : "Contact the platform administrator to activate or renew a plan."}
        </p>
      </div>
      <button className="button secondary small-button" onClick={onView}>
        View subscription
        <ArrowRight size={15} />
      </button>
    </aside>
  );
}
