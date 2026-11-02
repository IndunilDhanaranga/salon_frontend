"use client";
import { X } from "lucide-react";
import type { TenantRole } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

type Props = {
  roles: TenantRole[];
  busy: boolean;
  onClose: () => void;
  onSave: (values: Record<string, FormDataEntryValue>) => void;
};
export function MemberEditor({ roles, busy, onClose, onSave }: Props) {
  const { t, language } = useTranslation();
  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        if (!values.password) delete values.password;
        onSave(values);
      }}
    >
      <div className="inline-form-title">
        <h3>{t.access.assignMember}</h3>
        <button
          type="button"
          className="icon-button"
          aria-label={t.common.close}
          disabled={busy}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="form-grid">
        <label>
          {t.forms.fullName}
          <input
            name="name"
            required
            maxLength={100}
            autoFocus
            disabled={busy}
          />
        </label>
        <label>
          {t.forms.emailLogin}
          <input
            name="email"
            type="email"
            required
            maxLength={255}
            disabled={busy}
          />
        </label>
        <label>
          {t.forms.loginPassword}
          <input
            name="password"
            type="password"
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            disabled={busy}
          />
          <span className="field-hint">
            {language === "si"
              ? "නව ගිණුමක් සඳහා මුරපදය අවශ්‍ය වේ."
              : "Required for a new account. Existing accounts keep their password."}
          </span>
        </label>
        <label>
          {t.access.roleName}
          <select name="role_id" required defaultValue="" disabled={busy}>
            <option value="" disabled>
              {language === "si" ? "භූමිකාවක් තෝරන්න" : "Select role"}
            </option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <span className="field-hint">
            {language === "si"
              ? "කාර්ය මණ්ඩල සාමාජිකයින් 'කණ්ඩායම' (Team) පිටුවෙන් එක් කරන්න."
              : "Staff members must be added from the Team section."}
          </span>
        </label>
      </div>
      <button className="button primary" disabled={busy}>
        {busy ? t.common.loading : t.forms.save}
      </button>
    </form>
  );
}
