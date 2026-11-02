"use client";
import { canPermission } from "@/lib/access";
import type { Appointment, Tenant } from "@/lib/types";
import { money, time } from "@/lib/format";
import {
  AppointmentActions,
  type AppointmentStatusAction,
} from "./appointment-actions";
import { useTranslation } from "@/lib/i18n";

export function AppointmentCards({
  appointments,
  tenant,
  busy,
  onStatus,
  showDate,
}: {
  appointments: Appointment[];
  tenant: Tenant;
  busy: boolean;
  onStatus: AppointmentStatusAction;
  showDate: boolean;
}) {
  const { t, language } = useTranslation();
  return (
    <div className="mobile-records" aria-label={t.nav.appointments}>
      {appointments.map((appointment) => (
        <article className="mobile-record" key={appointment.id}>
          <div className="mobile-record-heading">
            <div>
              <strong>{time(appointment.starts_at, tenant.timezone)}</strong>
              {showDate && (
                <span className="cell-sub">
                  {new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en", {
                    timeZone: tenant.timezone,
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(appointment.starts_at))}
                </span>
              )}
            </div>
            <span className={"status " + appointment.status}>
              {appointment.status === "booked"
                ? t.status.booked
                : appointment.status === "completed"
                  ? t.status.completed
                  : t.status.cancelled}
            </span>
          </div>
          <h3>{appointment.customer_name}</h3>
          <p>{appointment.service_name}</p>
          <div className="mobile-record-meta">
            <span>{appointment.staff_name}</span>
            <strong>{money(appointment.price_minor, tenant.currency)}</strong>
          </div>
          <AppointmentActions
            appointment={appointment}
            busy={busy}
            canManage={canPermission(tenant, "appointments.manage")}
            onStatus={onStatus}
          />
        </article>
      ))}
    </div>
  );
}
