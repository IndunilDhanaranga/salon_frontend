"use client";
import type { Branch, Staff } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

export function StaffFields({
  editing,
  branches = [],
  canManageLogin = false,
}: {
  editing: Staff | null;
  branches?: Branch[];
  canManageLogin?: boolean;
}) {
  const { t, language } = useTranslation();
  return (
    <>
      <label>
        {t.forms.fullName}
        <input
          name="name"
          autoFocus
          required
          maxLength={100}
          defaultValue={editing?.name}
        />
      </label>
      <label>
        {t.forms.jobTitle}
        <input
          name="job_title"
          required
          maxLength={100}
          placeholder={t.forms.jobTitlePlaceholder}
          defaultValue={editing?.job_title}
        />
      </label>
      {branches.length > 0 && (
        <label>
          {t.branches.assignBranch}
          <select name="branch_id" defaultValue={editing?.branch_id ?? ""}>
            <option value="">{t.branches.unassigned}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.is_main ? `(${t.branches.mainBranch})` : ""}{" "}
                {b.code ? `[${b.code}]` : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="form-grid">
        <label>
          {editing?.user_id
            ? language === "si"
              ? "කාර්ය මණ්ඩල සම්බන්ධතා ඊමේල්"
              : "Staff contact email"
            : t.forms.emailLogin}
          <input
            name="email"
            type="email"
            defaultValue={editing?.email || ""}
            placeholder="staff@salon.test"
          />
        </label>
        {canManageLogin && !editing?.user_id && (
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
        )}
      </div>
      {editing?.user_id && (
        <p className="field-hint">
          {language === "si"
            ? "පිවිසුම් ගිණුම වෙනම කළමනාකරණය කෙරේ."
            : "Updating staff contact details does not change the linked login account."}
        </p>
      )}
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
      {canManageLogin && !editing?.user_id && (
        <p className="field-hint">
          {language === "si"
            ? "විද්‍යුත් තැපෑලක් සහ මුරපදයක් ලබාදීමෙන් මෙම සාමාජිකයාට සේවක (Staff) ගිණුමක් ස්වයංක්‍රීයව සෑදේ."
            : "Providing an email and password automatically creates a user account with the Staff role so this team member can sign in to the salon workspace."}
        </p>
      )}
    </>
  );
}
