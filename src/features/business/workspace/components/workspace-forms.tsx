"use client";

import { useEffect, useRef, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import type { BookingStaff, Branch, Staff, Tenant } from "@/lib/types";
import { useBranchApi } from "@/features/business/branches/branch-context";
import { message, salonDateTime } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

import { AppointmentFields } from "@/features/business/appointments/components/appointment-fields";
import { StaffFields } from "@/features/business/team/components/staff-fields";
import { PayrollFields } from "@/features/business/payroll/components/payroll-fields";

export type FormKind = "appointment" | "staff" | "payroll";
type Props = {
  kind: FormKind;
  tenant: Tenant;
  staff: BookingStaff[];
  branches?: Branch[];
  editing: Staff | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function WorkspaceForm({
  kind,
  tenant,
  staff,
  branches = [],
  editing,
  onClose,
  onSaved,
}: Props) {
  const api = useBranchApi();
  const { t, language } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const title =
    kind === "appointment"
      ? t.actions.newAppointment
      : kind === "staff"
        ? editing
          ? t.team.editMember
          : t.actions.addTeamMember
        : t.actions.generatePayroll;

  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    try {
      if (kind === "appointment") {
        const start = salonDateTime(
          String(form.get("date")),
          String(form.get("time")),
          tenant.timezone,
        );
        const end = new Date(
          +new Date(start) + Number(form.get("duration")) * 60000,
        ).toISOString();
        await api("appointments", {
          method: "POST",
          tenant: tenant.slug,
          body: {
            staff_id: form.get("staff_id"),
            customer_name: form.get("customer_name"),
            service_name: form.get("service_name"),
            starts_at: start,
            ends_at: end,
            price_minor: Math.round(Number(form.get("price")) * 100),
          },
        });
      } else if (kind === "staff") {
        await api(editing ? `staff/${editing.id}` : "staff", {
          method: editing ? "PATCH" : "POST",
          tenant: tenant.slug,
          body: {
            name: form.get("name"),
            email: form.get("email") || null,
            phone: form.get("phone") || null,
            password: form.get("password") || undefined,
            job_title: form.get("job_title"),
            branch_id: form.get("branch_id") || null,
            base_salary_minor: Math.round(Number(form.get("salary")) * 100),
            commission_bps: Math.round(Number(form.get("commission")) * 100),
            active: form.get("active") === "on",
          },
        });
      } else {
        const month = String(form.get("month"));
        const [year, monthNumber] = month.split("-").map(Number);
        const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
        await api("payroll", {
          method: "POST",
          tenant: tenant.slug,
          body: {
            period_start: `${month}-01`,
            period_end: `${month}-${lastDay}`,
          },
        });
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="form-dialog"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-header">
        <span className="eyebrow">{tenant.name}</span>
        <button
          type="button"
          className="icon-button"
          aria-label={t.common.close}
          disabled={busy}
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      <h2 id="dialog-title">{title}</h2>
      <p className="muted dialog-intro">
        {kind === "appointment"
          ? `${language === "si" ? "වෙන්කිරීම් වේලාවන්: " : "Booking times use "} ${tenant.timezone}.`
          : kind === "staff"
            ? `${language === "si" ? "ගෙවීම් මුදල් ඒකකය: " : "Compensation is recorded in "} ${tenant.currency}.`
            : language === "si"
              ? "සමාලෝචනය සඳහා කෙටුම්පතක් සාදන්න. මෙය සෘජු ගෙවීමක් නොවේ."
              : "Create a draft for review. This does not send payments."}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(new FormData(event.currentTarget));
        }}
      >
        {kind === "appointment" && (
          <AppointmentFields tenant={tenant} staff={staff} />
        )}
        {kind === "staff" && (
          <StaffFields
            editing={editing}
            branches={branches}
            canManageLogin={tenant.permissions.includes("access.manage")}
          />
        )}
        {kind === "payroll" && <PayrollFields tenant={tenant} />}
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            {t.common.cancel}
          </button>
          <button className="button primary" disabled={busy}>
            {busy
              ? t.common.loading
              : kind === "payroll"
                ? t.forms.generateDraft
                : t.forms.save}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
