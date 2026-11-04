"use client";
import { canPermission } from "@/lib/access";
import { CalendarDays } from "lucide-react";
import type { Appointment, Tenant } from "@/lib/types";
import { initials, money, time } from "@/lib/format";
import { AppointmentCards } from "./appointment-cards";
import {
  AppointmentActions,
  type AppointmentStatusAction,
} from "./appointment-actions";
import { useTranslation } from "@/lib/i18n";

type Props = {
  appointments: Appointment[];
  tenant: Tenant;
  busy: boolean;
  onStatus: AppointmentStatusAction;
  showDate?: boolean;
};

export function AppointmentList({
  appointments,
  tenant,
  busy,
  onStatus,
  showDate = false,
}: Props) {
  const { t, language } = useTranslation();
  if (!appointments.length)
    return (
      <div className="empty-state">
        <CalendarDays size={28} strokeWidth={1.3} />
        <h3>{t.appointments.emptyTitle}</h3>
        <p>{t.appointments.emptyDesc}</p>
      </div>
    );
  return (
    <>
      <AppointmentCards
        appointments={appointments}
        tenant={tenant}
        busy={busy}
        onStatus={onStatus}
        showDate={showDate}
      />
      <div className="table-scroll desktop-record-table">
        <table className="appointment-table">
          <thead>
            <tr>
              <th>{t.appointments.time}</th>
              <th>{t.appointments.clientAndService}</th>
              <th>{t.appointments.teamMember}</th>
              <th>{t.appointments.amount}</th>
              <th>{t.appointments.status}</th>
              <th>
                <span className="sr-only">{t.appointments.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>
                  <strong className="time-label">
                    {time(appointment.starts_at, tenant.timezone)}
                  </strong>
                  {showDate && (
                    <span className="cell-sub">
                      {new Intl.DateTimeFormat(
                        language === "si" ? "si-LK" : "en",
                        {
                          timeZone: tenant.timezone,
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      ).format(new Date(appointment.starts_at))}
                    </span>
                  )}
                  <span className="cell-sub">
                    {Math.round(
                      (+new Date(appointment.ends_at) -
                        +new Date(appointment.starts_at)) /
                        60000,
                    )}{" "}
                    {language === "si" ? "මිනි" : "min"}
                  </span>
                </td>
                <td>
                  <div className="client-cell">
                    <span className="client-avatar">
                      {initials(appointment.customer_name)}
                    </span>
                    <div>
                      <strong>{appointment.customer_name}</strong>
                      <span className="cell-sub">
                        {appointment.service_name}
                      </span>
                    </div>
                  </div>
                </td>
                <td>{appointment.staff_name}</td>
                <td className="money-label">
                  {money(appointment.price_minor, tenant.currency)}
                </td>
                <td>
                  <span className={"status " + appointment.status}>
                    <span />
                    {appointment.status === "booked"
                      ? t.status.booked
                      : appointment.status === "completed"
                        ? t.status.completed
                        : t.status.cancelled}
                  </span>
                </td>
                <td>
                  <AppointmentActions
                    appointment={appointment}
                    busy={busy}
                    canManage={canPermission(tenant, "appointments.manage")}
                    onStatus={onStatus}
                    compact
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
