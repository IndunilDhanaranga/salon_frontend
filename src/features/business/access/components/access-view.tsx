"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import type { ApiOptions } from "@/lib/api";
import { useBranchApi } from "@/features/workspace/branch-context";
import type { AccessResponse, Tenant, TenantRole } from "@/lib/types";
import { message } from "@/lib/format";
import { RoleEditor } from "./role-editor";
import { MemberEditor } from "./member-editor";
import { AccessRoles } from "./access-roles";
import { AccessMembers } from "./access-members";
import { useTranslation } from "@/lib/i18n";

export function AccessView({
  tenant,
  currentUserId,
}: {
  tenant: Tenant;
  currentUserId: string;
}) {
  const api = useBranchApi();
  const { t } = useTranslation();
  const [data, setData] = useState<AccessResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [roleForm, setRoleForm] = useState<TenantRole | null | undefined>(
    undefined,
  );
  const [memberForm, setMemberForm] = useState(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setData(
        await api<AccessResponse>("access", { tenant: tenant.slug, signal }),
      );
    },
    [tenant.slug],
  );
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    void load(controller.signal).catch((error) => {
      if (!controller.signal.aborted) setError(message(error));
    });
    return () => controller.abort();
  }, [load]);
  async function mutate(
    path: string,
    body: unknown,
    method: ApiOptions["method"] = "POST",
  ) {
    setBusy(true);
    setError("");
    try {
      await api(path, { method, body, tenant: tenant.slug });
      await load();
      setRoleForm(undefined);
      setMemberForm(false);
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  const assignable =
    data?.roles.filter(
      (role) =>
        !role.is_owner &&
        role.permissions.every((key) => tenant.permissions.includes(key)),
    ) ?? [];
  const memberCreatableRoles = assignable.filter(
    (role) => role.name.toLowerCase() !== "staff",
  );
  const ownRoleId = data?.members.find(
    (member) => member.user.id === currentUserId,
  )?.role_id;
  return (
    <div className="access-content">
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{t.access.title}</h2>
            <p>{t.access.subtitle}</p>
          </div>
          <button
            className="button secondary small-button"
            disabled={busy || !data}
            onClick={() => {
              setMemberForm(false);
              setRoleForm(null);
            }}
          >
            <Plus size={16} />
            {t.access.addRole}
          </button>
        </div>
        {roleForm !== undefined && data && (
          <RoleEditor
            key={roleForm?.id ?? "new"}
            role={roleForm}
            permissions={data.permissions.filter((permission) =>
              tenant.permissions.includes(permission.key),
            )}
            busy={busy}
            onClose={() => setRoleForm(undefined)}
            onSave={(values) =>
              void mutate(
                roleForm ? "access/roles/" + roleForm.id : "access/roles",
                values,
                roleForm ? "PATCH" : "POST",
              )
            }
          />
        )}
        {!data ? (
          <p className="loading-line" role="status">
            {t.common.loading}…
          </p>
        ) : (
          <AccessRoles
            data={data}
            tenant={tenant}
            ownRoleId={ownRoleId}
            busy={busy}
            onEdit={(role) => {
              setMemberForm(false);
              setRoleForm(role);
            }}
            onDelete={(id) => void mutate("access/roles/" + id, {}, "DELETE")}
          />
        )}
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{t.access.assignedMembers}</h2>
            <p>{t.access.subtitle}</p>
          </div>
          <button
            className="button secondary small-button"
            disabled={busy || !data || !memberCreatableRoles.length}
            onClick={() => {
              setRoleForm(undefined);
              setMemberForm(true);
            }}
          >
            <UserPlus size={16} />
            {t.access.assignMember}
          </button>
        </div>
        {memberForm && (
          <MemberEditor
            roles={memberCreatableRoles}
            branches={data?.branches ?? []}
            busy={busy}
            onClose={() => setMemberForm(false)}
            onSave={(values) => void mutate("access/members", values)}
          />
        )}
        {data && (
          <AccessMembers
            data={data}
            tenant={tenant}
            currentUserId={currentUserId}
            assignable={assignable}
            busy={busy}
            onRole={(id, role_id) =>
              void mutate("access/members/" + id, { role_id }, "PATCH")
            }
            onRevoke={(id) => void mutate("access/members/" + id, {}, "DELETE")}
          />
        )}
      </section>
    </div>
  );
}
