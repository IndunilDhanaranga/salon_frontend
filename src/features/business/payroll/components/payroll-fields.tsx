"use client";
import type { Tenant } from "@/lib/types";
import { localDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

export function PayrollFields({ tenant }: { tenant: Tenant }) {
  const { t, language } = useTranslation();
  return (
    <>
      <label>
        {t.forms.payrollPeriod}
        <input
          type="month"
          name="month"
          required
          autoFocus
          defaultValue={localDate(tenant.timezone).slice(0, 7)}
        />
      </label>
      <div className="form-note">
        <strong>
          {language === "si"
            ? "මෙම කෙටුම්පතට ඇතුළත් වන්නේ"
            : "What goes into this draft"}
        </strong>
        <p>
          {language === "si"
            ? "සක්‍රිය එක් එක් සාමාජිකයෙකුගේ මූලික වැටුප සහ මෙම මාසයේ සම්පූර්ණ කරන ලද සේවාවන්හි කොමිස් මුදල්."
            : "One full monthly base salary per active team member, plus commission from completed services in this month. Existing payroll periods cannot overlap."}
        </p>
      </div>
    </>
  );
}
