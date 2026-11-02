"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { Permission, TenantRole } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

const dependencies: Record<string, string[]> = {
  "staff.manage": ["staff.view"],
  "appointments.manage": ["appointments.view"],
  "payroll.manage": ["payroll.view"],
  "catalog.manage": ["catalog.view"],
  "orders.manage": ["orders.view", "catalog.view"],
  "orders.assign_staff": ["orders.manage", "orders.view", "catalog.view"],
};

const permissionLabelsSi: Record<string, string> = {
  "dashboard.view": "ව්‍යාපාර දළ විශ්ලේෂණ පුවරුව බැලීම",
  "reports.view": "ව්‍යාපාර වාර්තා සහ විශ්ලේෂණ බැලීම",
  "staff.view": "කාර්ය මණ්ඩලය සහ වන්දි විස්තර බැලීම",
  "staff.manage": "කාර්ය මණ්ඩලය එක් කිරීම සහ යාවත්කාලීන කිරීම",
  "appointments.view": "වේලාවන් වෙන්කිරීම් බැලීම",
  "appointments.manage": "වේලාවන් එක් කිරීම සහ කළමනාකරණය",
  "payroll.view": "වැටුප් කෙටුම්පත් බැලීම",
  "payroll.manage": "වැටුප් කෙටුම්පත් සකස් කිරීම",
  "access.manage": "භූමිකාවන් සහ සාමාජිකයින් කළමනාකරණය",
  "catalog.view": "සේවා සහ නිෂ්පාදන ලැයිස්තුව බැලීම",
  "catalog.manage": "මිල ගණන් සහ සේවා/භාණ්ඩ කළමනාකරණය",
  "orders.view": "පාරිභෝගික බිල්පත් බැලීම",
  "orders.manage": "බිල්පත් සකස් කිරීම සහ ගෙවීම් සටහන් කිරීම",
  "orders.assign_staff": "බිල්පත් සඳහා කණ්ඩායම් සාමාජිකයින් නම් කිරීම",
};
type Props = {
  role: TenantRole | null;
  permissions: Permission[];
  busy: boolean;
  onClose: () => void;
  onSave: (values: {
    name: FormDataEntryValue | null;
    permissions: string[];
  }) => void;
};
export function RoleEditor({
  role,
  permissions,
  busy,
  onClose,
  onSave,
}: Props) {
  const { t, language } = useTranslation();
  const [selected, setSelected] = useState(role?.permissions ?? []);
  function toggle(key: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? Array.from(new Set([...current, key, ...(dependencies[key] ?? [])]))
        : current.filter((item) => item !== key),
    );
  }
  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          name: new FormData(event.currentTarget).get("name"),
          permissions: selected,
        });
      }}
    >
      <div className="inline-form-title">
        <h3>{role ? (language === "si" ? "භූමිකාව සංස්කරණය" : "Edit role") : t.access.addRole}</h3>
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
      <label>
        {t.access.roleName}
        <input
          name="name"
          required
          maxLength={64}
          defaultValue={role?.name}
          autoFocus
          disabled={busy}
        />
      </label>
      <fieldset
        className="permissions-fieldset"
        aria-describedby="permission-dependencies"
      >
        <legend>{t.access.permissions}</legend>
        <p className="field-hint" id="permission-dependencies">
          {language === "si"
            ? "කළමනාකරණ අවසරයන්ට ඒවා භාවිතා කිරීමට අවශ්‍ය දසුන් ඇතුළත් වේ."
            : "Manage permissions include the views needed to use them."}
        </p>
        <div className="permission-grid">
          {permissions.map((permission) => {
            const required = selected.some((key) =>
              (dependencies[key] ?? []).includes(permission.key),
            );
            return (
              <label key={permission.key} className="checkbox-label">
                <input
                  type="checkbox"
                  name="permissions"
                  value={permission.key}
                  checked={selected.includes(permission.key)}
                  disabled={busy || required}
                  onChange={(event) =>
                    toggle(permission.key, event.target.checked)
                  }
                />
                {language === "si"
                  ? (permissionLabelsSi[permission.key] ?? permission.label)
                  : permission.label}
                {required && (
                  <span className="field-hint">
                    {language === "si" ? "අවශ්‍යයි" : "Required"}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>
      <button className="button primary" disabled={busy}>
        {busy ? t.common.loading : t.forms.save}
      </button>
    </form>
  );
}
