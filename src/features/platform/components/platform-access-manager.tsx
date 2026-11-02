"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Users,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import type { PlatformAccessResponse, PlatformRole, User } from "@/lib/types";
import { AdminDialog } from "./admin-dialog";
import type { PlatformRoleValues } from "../types";
import { platformRoleLabel } from "../platform-format";

export function PlatformAccessManager({
  access,
  currentUserId,
  busy,
  onSaveRole,
  onDeleteRole,
  onAssignUserRole,
}: {
  access: PlatformAccessResponse | null;
  currentUserId: string;
  busy: boolean;
  onSaveRole: (values: PlatformRoleValues, id?: string) => Promise<unknown>;
  onDeleteRole: (id: string) => Promise<unknown>;
  onAssignUserRole: (
    userId: string,
    is_admin: boolean,
    roleId?: string | null,
  ) => Promise<unknown>;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"roles" | "admins">("roles");
  const [editingRole, setEditingRole] = useState<PlatformRole | null | "new">(
    null,
  );
  const [roleForm, setRoleForm] = useState<PlatformRoleValues>({
    name: "",
    description: "",
    permissions: [],
  });
  const [assigningAdmin, setAssigningAdmin] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [formError, setFormError] = useState("");

  if (!access) {
    return (
      <div className="empty-state">
        <ShieldCheck size={28} />
        <h3>Loading platform permissions…</h3>
      </div>
    );
  }

  function startCreateRole() {
    setRoleForm({
      name: "",
      description: "",
      permissions: ["platform.dashboard.view"],
    });
    setFormError("");
    setEditingRole("new");
  }

  function startEditRole(role: PlatformRole) {
    setRoleForm({
      name: role.name,
      description: role.description || "",
      permissions: [...role.permissions],
    });
    setFormError("");
    setEditingRole(role);
  }

  function togglePermission(key: string) {
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(key);
      const updated = exists
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key];
      return { ...prev, permissions: updated };
    });
  }

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!roleForm.name.trim()) {
      setFormError("Role name is required.");
      return;
    }
    if (!roleForm.permissions.length) {
      setFormError("Select at least one permission for this role.");
      return;
    }
    try {
      const id =
        typeof editingRole === "object" && editingRole
          ? editingRole.id
          : undefined;
      await onSaveRole(roleForm, id);
      setEditingRole(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save role.");
    }
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assigningAdmin) return;
    try {
      await onAssignUserRole(assigningAdmin.id, true, selectedRoleId || null);
      setAssigningAdmin(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to assign role.",
      );
    }
  }

  return (
    <div className="platform-access-stack">
      <div className="platform-subtab-bar">
        <button
          type="button"
          className={`platform-subtab-btn ${activeSubTab === "roles" ? "is-active" : ""}`}
          onClick={() => setActiveSubTab("roles")}
        >
          <Shield size={16} />
          <span>Platform Roles & Permissions ({access.roles.length})</span>
        </button>
        <button
          type="button"
          className={`platform-subtab-btn ${activeSubTab === "admins" ? "is-active" : ""}`}
          onClick={() => setActiveSubTab("admins")}
        >
          <Users size={16} />
          <span>Platform Administrators ({access.admins.length})</span>
        </button>
      </div>

      {activeSubTab === "roles" ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Platform Roles (RBAC)</h2>
              <p>
                Define roles with specific permissions for managing the
                platform, salons, and packages.
              </p>
            </div>
            <button
              type="button"
              className="button primary"
              disabled={busy}
              onClick={startCreateRole}
            >
              <Plus size={16} />
              Create Custom Role
            </button>
          </div>

          <div className="platform-role-grid">
            {access.roles.map((role) => {
              const userCount = role.users_count ?? 0;
              return (
                <article
                  key={role.id}
                  className={`platform-role-card ${role.is_super_admin ? "is-super" : ""}`}
                >
                  <div className="role-card-header">
                    <div>
                      <div className="role-card-title-row">
                        <h3>{role.name}</h3>
                        {role.is_super_admin && (
                          <span className="badge admin-badge">SUPER ADMIN</span>
                        )}
                      </div>
                      <p className="role-card-desc">
                        {role.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="role-card-meta">
                    <span className="user-count-tag">
                      <Users size={13} />
                      {userCount}{" "}
                      {userCount === 1 ? "admin user" : "admin users"}
                    </span>
                    <span className="perm-count-tag">
                      {role.is_super_admin
                        ? "All Permissions"
                        : `${role.permissions.length} Permissions`}
                    </span>
                  </div>

                  <div className="role-card-permissions">
                    <h4>Assigned Permissions:</h4>
                    <ul>
                      {access.permissions.map((perm) => {
                        const hasIt =
                          role.is_super_admin ||
                          role.permissions.includes(perm.key);
                        return (
                          <li
                            key={perm.key}
                            className={`perm-pill ${hasIt ? "perm-enabled" : "perm-disabled"}`}
                          >
                            {hasIt ? <Check size={13} /> : <X size={13} />}
                            <span>{perm.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {!role.is_super_admin && (
                    <div className="role-card-actions">
                      <button
                        type="button"
                        className="button secondary small-button"
                        disabled={busy}
                        onClick={() => startEditRole(role)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button secondary small-button text-danger"
                        disabled={busy || userCount > 0}
                        title={
                          userCount > 0
                            ? "Cannot delete role with assigned admins"
                            : "Delete role"
                        }
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete role "${role.name}"?`,
                            )
                          ) {
                            void onDeleteRole(role.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Platform Administrator Accounts</h2>
              <p>
                Users who have access to this SaaS Admin Portal and their
                assigned roles.
              </p>
            </div>
            <span className="small-caps">{access.admins.length} ADMINS</span>
          </div>

          <div className="table-scroll">
            <table className="platform-responsive-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Email</th>
                  <th>Assigned Role</th>
                  <th>Self</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {access.admins.map((admin) => {
                  const isCurrent = admin.id === currentUserId;
                  const roleName = platformRoleLabel(admin.platform_role);

                  return (
                    <tr key={admin.id}>
                      <td data-label="Administrator">
                        <strong>{admin.name}</strong>
                      </td>
                      <td data-label="Email">{admin.email}</td>
                      <td data-label="Assigned Role">
                        <span className="role-tag">{roleName}</span>
                      </td>
                      <td data-label="Self">
                        {isCurrent ? (
                          <span className="badge current-badge">You</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td data-label="Action">
                        <div className="subscription-row-actions">
                          <button
                            type="button"
                            className="button secondary small-button"
                            disabled={busy}
                            onClick={() => {
                              setAssigningAdmin(admin);
                              setSelectedRoleId(admin.platform_role_id || "");
                              setFormError("");
                            }}
                          >
                            <Pencil size={14} />
                            Change Role
                          </button>
                          {!isCurrent && (
                            <button
                              type="button"
                              className="button secondary small-button text-danger"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Revoke platform admin privileges for ${admin.name}? They will only have standard salon access.`,
                                  )
                                ) {
                                  void onAssignUserRole(admin.id, false, null);
                                }
                              }}
                            >
                              Revoke Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Role Creation / Editing Modal Dialog */}
      {editingRole && (
        <AdminDialog
          title={
            editingRole === "new"
              ? "Create Platform Role"
              : `Edit ${editingRole.name}`
          }
          subtitle="Configure role name, description, and assigned platform permissions."
          busy={busy}
          onClose={() => setEditingRole(null)}
        >
          <form onSubmit={handleRoleSubmit} className="admin-form-stack">
            {formError && (
              <div className="error-box" role="alert">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="role-name">Role Name *</label>
              <input
                id="role-name"
                type="text"
                className="input"
                required
                placeholder="e.g. Finance & Subscriptions Manager"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, name: e.target.value })
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="role-desc">Description</label>
              <textarea
                id="role-desc"
                className="input"
                rows={2}
                placeholder="Briefly describe what responsibilities this role handles"
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, description: e.target.value })
                }
              />
            </div>

            <fieldset className="permissions-fieldset">
              <legend>Granular Platform Permissions</legend>
              <div className="permissions-checkbox-list">
                {access.permissions.map((perm) => {
                  const checked = roleForm.permissions.includes(perm.key);
                  return (
                    <label key={perm.key} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(perm.key)}
                      />
                      <div>
                        <strong>{perm.label}</strong>
                        <code>{perm.key}</code>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setEditingRole(null)}
              >
                Cancel
              </button>
              <button type="submit" className="button primary" disabled={busy}>
                {editingRole === "new" ? "Create Role" : "Save Changes"}
              </button>
            </div>
          </form>
        </AdminDialog>
      )}

      {/* Assign Role to Admin Modal Dialog */}
      {assigningAdmin && (
        <AdminDialog
          title="Assign Platform Role"
          subtitle={`Choose which platform role is assigned to ${assigningAdmin.name} (${assigningAdmin.email}).`}
          busy={busy}
          onClose={() => setAssigningAdmin(null)}
        >
          <form onSubmit={handleAssignSubmit} className="admin-form-stack">
            {formError && (
              <div className="error-box" role="alert">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="select-role">Platform Role *</label>
              <select
                id="select-role"
                className="select"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                <option value="">Default (Super Administrator)</option>
                {access.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.is_super_admin ? "(Full Permissions)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setAssigningAdmin(null)}
              >
                Cancel
              </button>
              <button type="submit" className="button primary" disabled={busy}>
                Save Assignment
              </button>
            </div>
          </form>
        </AdminDialog>
      )}
    </div>
  );
}
