"use client";
import { canPermission } from "@/lib/access";
import { ArrowRight } from "lucide-react";
import type { Tenant } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

export function WorkspaceDetails({
  tenant,
  onAccess,
}: {
  tenant: Tenant;
  onAccess: () => void;
}) {
  const { t } = useTranslation();
  const details = [
    [t.workspaceDetails.salon, tenant.name],
    [t.workspaceDetails.address, tenant.slug],
    [t.workspaceDetails.currency, tenant.currency],
    [t.workspaceDetails.timezone, tenant.timezone],
    [
      t.workspaceDetails.yourRole,
      tenant.role === "owner" ? t.access.owner : tenant.role,
    ],
    [
      t.workspaceDetails.dataStorage,
      tenant.storage_mode === "shared"
        ? t.workspaceDetails.sharedDb
        : t.workspaceDetails.dedicatedDb,
    ],
  ];
  return (
    <section className="panel workspace-details">
      <h2>{t.workspaceDetails.title}</h2>
      <dl>
        {details.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="form-note">
        <strong>{t.workspaceDetails.builtWithRoom}</strong>
        <p>{t.workspaceDetails.builtWithRoomDesc}</p>
      </div>
      {canPermission(tenant, "access.manage") && (
        <button className="button secondary" onClick={onAccess}>
          {t.workspaceDetails.manageRoles}
          <ArrowRight size={16} />
        </button>
      )}
    </section>
  );
}
