export function subscriptionDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function localDateTimeValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Calendar-clamped renewal: January 31 + one month ends on February's last day. */
export function nextPeriodEnd(
  interval: "month" | "year",
  existingEnd?: string | null,
) {
  const existing = existingEnd ? new Date(existingEnd) : null;
  const base =
    existing && existing.getTime() > Date.now() ? existing : new Date();
  const day = base.getDate();
  const result = new Date(base);
  result.setDate(1);
  if (interval === "year") result.setFullYear(result.getFullYear() + 1);
  else result.setMonth(result.getMonth() + 1);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return localDateTimeValue(result);
}

export function platformRoleLabel(role?: unknown): string {
  if (!role) return "Super Administrator";
  if (typeof role === "string") return role;
  if (typeof role === "object" && role !== null && "name" in role) {
    return String((role as { name?: unknown }).name || "Super Administrator");
  }
  return "Super Administrator";
}

export function subscriptionLabel(status: string) {
  return (
    (
      {
        trialing: "Free trial",
        active: "Active plan",
        grace_period: "Grace period",
        pending_renewal: "Pending renewal",
        cancelled: "Cancelled",
        expired: "Expired",
      } as Record<string, string>
    )[status] ?? status
  );
}
