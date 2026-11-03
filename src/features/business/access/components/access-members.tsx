"use client";
import type { AccessResponse, Tenant, TenantRole } from "@/lib/types";
import { initials } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

type Props = {
  data: AccessResponse;
  tenant: Tenant;
  currentUserId: string;
  assignable: TenantRole[];
  busy: boolean;
  onRole: (id: string, roleId: string) => void;
  onRevoke: (id: string) => void;
};
export function AccessMembers({
  data,
  tenant,
  currentUserId,
  assignable,
  busy,
  onRole,
  onRevoke,
}: Props) {
  const { t, language } = useTranslation();
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{t.payroll.member}</th>
            <th>{t.access.roleName}</th>
            <th>{t.branches.branchAccess}</th>
            <th>{t.access.permissions}</th>
          </tr>
        </thead>
        <tbody>
          {data.members.map((member) => {
            const role = data.roles.find((item) => item.id === member.role_id);
            const own = member.user.id === currentUserId;
            const editable =
              !own &&
              role &&
              !role.is_owner &&
              role.permissions.every((key) => tenant.permissions.includes(key));
            return (
              <tr key={member.id}>
                <td>
                  <div className="client-cell">
                    <span className="client-avatar">
                      {initials(member.user.name)}
                    </span>
                    <div>
                      <strong>{member.user.name}</strong>
                      <span className="cell-sub">{member.user.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  {editable ? (
                    <select
                      className="compact-select"
                      value={member.role_id}
                      disabled={busy}
                      aria-label={"Role for " + member.user.name}
                      onChange={(event) =>
                        onRole(member.id, event.target.value)
                      }
                    >
                      {assignable.map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    member.role === "Owner" ? t.access.owner : member.role
                  )}
                </td>
                <td>
                  {!member.branch_ids || member.branch_ids.length === 0 ? (
                    <span
                      className="branch-chip-xs"
                      style={{
                        background: "rgba(18, 53, 36, 0.08)",
                        color: "var(--teal)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: "0.78rem",
                        fontWeight: 500,
                        display: "inline-block",
                      }}
                    >
                      🌐 {t.branches.allBranches}
                    </span>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                      }}
                    >
                      {member.branch_ids.map((id) => {
                        const branch = data.branches?.find((b) => b.id === id);
                        return (
                          <span
                            key={id}
                            className="branch-chip-xs"
                            style={{
                              background: "rgba(0, 0, 0, 0.06)",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: "0.78rem",
                              display: "inline-block",
                            }}
                          >
                            🏢 {branch?.name ?? id}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td>
                  {editable ? (
                    <button
                      className="text-button danger-text"
                      disabled={busy}
                      onClick={() => onRevoke(member.id)}
                    >
                      {language === "si" ? "ප්‍රවේශය අවලංගු කරන්න" : "Revoke access"}
                    </button>
                  ) : (
                    <span className="status completed">
                      {own
                        ? (language === "si" ? "ඔබගේ ගිණුම" : "Your account")
                        : (language === "si" ? "ආරක්ෂිතයි" : "Protected")}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
