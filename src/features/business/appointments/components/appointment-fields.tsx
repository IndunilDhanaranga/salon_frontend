"use client";
import type { BookingStaff, Tenant } from "@/lib/types";
import { localDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

export function AppointmentFields({
  tenant,
  staff,
}: {
  tenant: Tenant;
  staff: BookingStaff[];
}) {
  const { t } = useTranslation();
  return (
    <>
      <label>
        {t.forms.clientName}
        <input name="customer_name" autoFocus required maxLength={120} />
      </label>
      <div className="form-grid">
        <label>
          {t.forms.service}
          <input
            name="service_name"
            required
            placeholder={t.forms.servicePlaceholder}
            maxLength={120}
          />
        </label>
        <label>
          {t.forms.teamMember}
          <select name="staff_id" required defaultValue="">
            <option value="" disabled>
              {t.forms.selectTeamMember}
            </option>
            {staff
              .filter((person) => person.active)
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className="form-grid">
        <label>
          {t.forms.date}
          <input
            type="date"
            name="date"
            required
            defaultValue={localDate(tenant.timezone)}
          />
        </label>
        <label>
          {t.forms.time}
          <input type="time" name="time" required defaultValue="10:00" />
        </label>
      </div>
      <div className="form-grid">
        <label>
          {t.forms.durationMinutes}
          <input
            type="number"
            name="duration"
            min="5"
            max="720"
            step="5"
            required
            defaultValue="45"
          />
        </label>
        <label>
          {t.forms.price} ({tenant.currency})
          <input
            type="number"
            name="price"
            min="0"
            max="9999999"
            step="0.01"
            required
          />
        </label>
      </div>
    </>
  );
}
