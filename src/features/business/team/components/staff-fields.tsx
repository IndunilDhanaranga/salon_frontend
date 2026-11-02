"use client";
import type { Staff } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

export function StaffFields({ editing }: { editing: Staff | null }) {
  const { t, language } = useTranslation();
  return (
    <>
      <label>
        {t.forms.fullName}
        <input
          name="name"
          autoFocus
          required
          maxLength={120}
          defaultValue={editing?.name}
        />
      </label>
      <label>
        {t.forms.jobTitle}
        <input
          name="job_title"
          required
          maxLength={120}
          placeholder={t.forms.jobTitlePlaceholder}
          defaultValue={editing?.job_title}
        />
      </label>
      <div className="form-grid">
        <label>
          {t.forms.emailLogin}
          <input
            name="email"
            type="email"
            defaultValue={editing?.email || ""}
            placeholder="staff@salon.test"
          />
        </label>
        <label>
          {t.forms.loginPassword}
          <input
            name="password"
            type="password"
            minLength={8}
            maxLength={72}
            placeholder={
              editing
                ? t.forms.passwordPlaceholderEdit
                : t.forms.passwordPlaceholderNew
            }
          />
        </label>
      </div>
      <label>
        {t.forms.phoneOptional}
        <input
          name="phone"
          type="tel"
          maxLength={30}
          defaultValue={editing?.phone || ""}
        />
      </label>
      <div className="form-grid">
        <label>
          {t.forms.monthlyBaseSalary}
          <input
            name="salary"
            type="number"
            min="0"
            max="99999999"
            step="0.01"
            required
            defaultValue={editing ? editing.base_salary_minor / 100 : 0}
          />
        </label>
        <label>
          {t.forms.commissionPercent}
          <input
            name="commission"
            type="number"
            min="0"
            max="100"
            step="0.01"
            required
            defaultValue={editing ? editing.commission_bps / 100 : 0}
          />
        </label>
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="active"
          defaultChecked={editing?.active ?? true}
        />
        {t.forms.activeTeamMember}
      </label>
      <p className="field-hint">
        {language === "si"
          ? "විද්‍යුත් තැපෑලක් සහ මුරපදයක් ලබාදීමෙන් මෙම සාමාජිකයාට සේවක (Staff) ගිණුමක් ස්වයංක්‍රීයව සෑදේ."
          : "Providing an email and password automatically creates a user account with the Staff role so this team member can sign in to the salon workspace."}
      </p>
    </>
  );
}
