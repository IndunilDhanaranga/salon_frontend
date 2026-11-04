"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { Branch, TenantRole } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

type Props = {
  roles: TenantRole[];
  branches?: Branch[];
  busy: boolean;
  onClose: () => void;
  onSave: (values: Record<string, unknown>) => void;
};
export function MemberEditor({
  roles,
  branches = [],
  busy,
  onClose,
  onSave,
}: Props) {
  const { t, language } = useTranslation();
  const [allBranches, setAllBranches] = useState(true);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState("");

  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault();
        setValidationError("");
        const formData = new FormData(event.currentTarget);
        const values = Object.fromEntries(formData.entries());
        if (!values.password) delete values.password;

        const payload: Record<string, unknown> = { ...values };
        if (!allBranches) {
          if (selectedBranchIds.length === 0) {
            setValidationError(
              language === "si"
                ? "කරුණාකර අවම වශයෙන් එක් ශාඛාවක්වත් තෝරන්න."
                : "Please select at least one branch or allow all branches.",
            );
            return;
          }
          payload.branch_ids = selectedBranchIds;
        } else {
          payload.branch_ids = [];
        }

        onSave(payload);
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
      {validationError && (
        <div className="error-box" role="alert" style={{ marginBottom: 12 }}>
          {validationError}
        </div>
      )}
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

      {branches.length > 0 && (
        <div
          className="branch-access-picker"
          style={{
            marginTop: 16,
            padding: "12px 14px",
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "var(--mint)",
          }}
        >
          <span
            className="small-caps"
            style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
          >
            {t.branches.branchAccess}
          </span>
          <label className="checkbox-label" style={{ marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={allBranches}
              onChange={(e) => setAllBranches(e.target.checked)}
              disabled={busy}
            />
            <span>
              <strong>{t.branches.allBranchesAccess}</strong>
            </span>
          </label>

          {!allBranches && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                border: "1px solid var(--line)",
                borderRadius: 6,
                background: "var(--card-bg, #fff)",
                display: "grid",
                gap: 8,
              }}
            >
              <span className="field-hint" style={{ margin: 0 }}>
                {t.branches.selectBranches}:
              </span>
              {branches.map((b) => (
                <label
                  key={b.id}
                  className="checkbox-label"
                  style={{ fontSize: "0.88rem" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedBranchIds.includes(b.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBranchIds([...selectedBranchIds, b.id]);
                      } else {
                        setSelectedBranchIds(
                          selectedBranchIds.filter((id) => id !== b.id),
                        );
                      }
                    }}
                    disabled={busy}
                  />
                  <span>
                    {b.name} {b.is_main ? `(${t.branches.mainBranch})` : ""}{" "}
                    {b.code ? `[${b.code}]` : ""}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        className="button primary"
        disabled={busy}
        style={{ marginTop: 16 }}
      >
        {busy ? t.common.loading : t.forms.save}
      </button>
    </form>
  );
}
