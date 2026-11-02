"use client";
import { ShieldCheck, ArrowUpRight, Trash2 } from "lucide-react";
import type { AccessResponse, Tenant, TenantRole } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

type Props = {
  data: AccessResponse;
  tenant: Tenant;
  ownRoleId?: string;
  busy: boolean;
  onEdit: (role: TenantRole) => void;
  onDelete: (id: string) => void;
};
export function AccessRoles({
  data,
  tenant,
  ownRoleId,
  busy,
  onEdit,
  onDelete,
}: Props) {
  const { t, language } = useTranslation();
  return (
    <div className="role-list">
      {data.roles.map((role) => {
        const editable =
          !role.is_owner &&
          role.id !== ownRoleId &&
          role.permissions.every((key) => tenant.permissions.includes(key));
        const assigned = data.members.some(
          (member) => member.role_id === role.id,
        );
        return (
          <article className="role-row" key={role.id}>
            <span className="role-icon">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3>{role.is_owner ? t.access.owner : role.name}</h3>
              <p>
                {role.is_owner
                  ? (language === "si" ? "සම්පූර්ණ ප්‍රවේශය · ආරක්ෂිත භූමිකාව" : "Full business access · Protected role")
                  : role.id === ownRoleId
                    ? (language === "si" ? "ඔබගේ භූමිකාව · ආරක්ෂිතයි" : "Your role · Protected from self changes")
                    : `${role.permissions.length} ${language === "si" ? "අවසර" : "permissions"}`}
              </p>
            </div>
            {editable && (
              <div className="row-actions">
                <button
                  className="row-action"
                  disabled={busy}
                  aria-label={`${t.common.edit} ${role.name}`}
                  onClick={() => onEdit(role)}
                >
                  <ArrowUpRight size={18} />
                </button>
                <button
                  className="row-action"
                  disabled={busy || assigned}
                  aria-label={`${t.common.delete} ${role.name}`}
                  title={t.common.delete}
                  onClick={() => onDelete(role.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
