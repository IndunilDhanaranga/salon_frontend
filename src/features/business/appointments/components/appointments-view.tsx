"use client";
import { canPermission } from "@/lib/access";
import type { Appointment, Tenant } from "@/lib/types";
import { AppointmentList } from "./appointment-list";
import { useTranslation } from "@/lib/i18n";

export function AppointmentsView({
  appointments,
  tenant,
  busy,
  onStatus,
}: {
  appointments: Appointment[];
  tenant: Tenant;
  busy: boolean;
  onStatus: (id: string, status: "completed" | "cancelled") => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{t.appointments.bookTitle}</h2>
          <p>
            {appointments.length} {t.appointments.appointmentsCount} · {t.appointments.allDates} · {tenant.timezone}
          </p>
        </div>
        <span className="small-caps">{t.appointments.yourSchedule}</span>
      </div>
      <AppointmentList
        appointments={appointments}
        tenant={tenant}
        busy={busy || !canPermission(tenant, "appointments.manage")}
        onStatus={onStatus}
        showDate
      />
    </section>
  );
}
