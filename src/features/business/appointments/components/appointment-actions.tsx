"use client";
import { Check, X } from "lucide-react";
import type { Appointment } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

export type AppointmentStatusAction = (
  id: string,
  status: "completed" | "cancelled",
) => void;
export function AppointmentActions({
  appointment,
  busy,
  canManage,
  onStatus,
  compact = false,
}: {
  appointment: Appointment;
  busy: boolean;
  canManage: boolean;
  onStatus: AppointmentStatusAction;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  if (appointment.status !== "booked" || !canManage) return null;
  return (
    <div className="row-actions">
      <button
        className={compact ? "row-action" : "button secondary small-button"}
        disabled={busy}
        aria-label={`${t.appointments.markCompleted} ${appointment.customer_name}`}
        title={t.appointments.markCompleted}
        onClick={() => onStatus(appointment.id, "completed")}
      >
        <Check size={16} />
        {!compact && t.status.completed}
      </button>
      <button
        className={compact ? "row-action" : "button secondary small-button"}
        disabled={busy}
        aria-label={`${t.appointments.cancel} ${appointment.customer_name}`}
        title={t.appointments.cancel}
        onClick={() => onStatus(appointment.id, "cancelled")}
      >
        <X size={16} />
        {!compact && t.common.cancel}
      </button>
    </div>
  );
}
