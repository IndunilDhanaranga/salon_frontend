"use client";

import { useState } from "react";
import {
  ArrowRight,
  Building2,
  LogOut,
  RefreshCw,
  Scissors,
} from "lucide-react";
import { api } from "@/lib/api";
import { canSetUpFirstBranch, hasBusinessAccess } from "@/lib/access";
import { message } from "@/lib/format";
import { LanguageDropdown, useTranslation } from "@/lib/i18n";
import type { Session, Tenant } from "@/lib/types";

export function FirstBranchSetup({
  tenant,
  session,
  busy,
  notice,
  onComplete,
  onRefresh,
  onLogout,
  onTenant,
  onPlatform,
}: {
  tenant: Tenant;
  session: Session;
  busy: boolean;
  notice?: string;
  onComplete: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onLogout: () => Promise<void>;
  onTenant: (slug: string) => void;
  onPlatform?: () => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  const disabled = busy || saving;
  const canCreate = canSetUpFirstBranch(tenant);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !canCreate) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      if (!created) {
        await api("branches", {
          method: "POST",
          tenant: tenant.slug,
          body: {
            name: String(form.get("name") ?? "").trim(),
            code: String(form.get("code") ?? "").trim() || null,
            phone: String(form.get("phone") ?? "").trim() || null,
            address: String(form.get("address") ?? "").trim() || null,
            active: true,
          },
        });
        setCreated(true);
      }
      await onComplete();
    } catch (err) {
      setError(message(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="branch-setup-page">
      <header className="branch-setup-header">
        <div className="brand">
          <Scissors size={24} strokeWidth={1.5} />
          <span>salon.</span>
        </div>
        <div className="branch-setup-actions">
          <LanguageDropdown />
          {session.tenants.length > 1 && (
            <label>
              {t.branchSetup.switchWorkspace}
              <select
                value={tenant.slug}
                disabled={disabled}
                onChange={(event) => onTenant(event.target.value)}
              >
                {session.tenants.map((workspace) => (
                  <option key={workspace.id} value={workspace.slug}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {onPlatform && (
            <button
              type="button"
              className="button secondary"
              disabled={disabled}
              onClick={onPlatform}
            >
              {t.platform.title}
            </button>
          )}
          <button
            type="button"
            className="button secondary"
            disabled={disabled}
            onClick={() => void onLogout()}
          >
            <LogOut size={16} />
            {t.nav.signOut}
          </button>
        </div>
      </header>

      <section
        className="branch-setup-content"
        aria-labelledby="branch-setup-title"
      >
        <div className="branch-setup-intro">
          <span className="branch-setup-icon">
            <Building2 size={28} strokeWidth={1.5} />
          </span>
          <h1 id="branch-setup-title">{t.branchSetup.title}</h1>
          <p>{t.branchSetup.description}</p>
          <strong className="branch-setup-workspace">{tenant.name}</strong>
        </div>

        <div className="panel branch-setup-form">
          {!canCreate ? (
            <p className="form-note" role="status">
              {hasBusinessAccess(tenant)
                ? t.branchSetup.waitingForOwner
                : t.branchSetup.subscriptionRequired}
            </p>
          ) : (
            <form onSubmit={(event) => void submit(event)} aria-busy={saving}>
              <label>
                {t.branches.branchName}
                <input
                  name="name"
                  required
                  maxLength={100}
                  autoFocus
                  autoComplete="organization"
                  placeholder={t.branchSetup.namePlaceholder}
                  disabled={disabled || created}
                />
              </label>
              <div className="form-grid">
                <label>
                  {t.branches.branchCode}
                  <input
                    name="code"
                    maxLength={32}
                    placeholder={t.branches.branchCodePlaceholder}
                    disabled={disabled || created}
                  />
                </label>
                <label>
                  {t.branches.phone}
                  <input
                    name="phone"
                    type="tel"
                    maxLength={40}
                    autoComplete="tel"
                    disabled={disabled || created}
                  />
                </label>
              </div>
              <label>
                {t.branches.address}
                <input
                  name="address"
                  maxLength={255}
                  autoComplete="street-address"
                  disabled={disabled || created}
                />
              </label>
              <p className="branch-setup-note">{t.branchSetup.mainHint}</p>
              {(error || notice) && (
                <p className="error-box" role="alert">
                  {error || notice}
                </p>
              )}
              <button
                type="submit"
                className="button primary full"
                disabled={disabled}
              >
                {saving
                  ? t.common.loading
                  : created
                    ? t.branchSetup.continue
                    : t.branchSetup.submit}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
          {!canCreate && notice && (
            <p className="error-box" role="alert">
              {notice}
            </p>
          )}
          <button
            type="button"
            className="text-button branch-setup-refresh"
            disabled={disabled}
            onClick={() => void onRefresh()}
          >
            <RefreshCw size={15} />
            {t.branchSetup.refresh}
          </button>
        </div>
      </section>
    </main>
  );
}
