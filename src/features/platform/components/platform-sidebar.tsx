"use client";

import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Layers3,
  CreditCard,
  ShieldCheck,
  Users,
  LogOut,
  ArrowRight,
  Menu,
  X,
  Scissors,
} from "lucide-react";
import type { Session } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import type { PlatformTab } from "../types";
import { platformRoleLabel } from "../platform-format";

export function PlatformSidebar({
  tab,
  onTab,
  session,
  hasPerm,
  mobileOpen,
  onMobileToggle,
  onBusiness,
  onLogout,
  busy,
}: {
  tab: PlatformTab;
  onTab: (tab: PlatformTab) => void;
  session: Session;
  hasPerm: (perm: string) => boolean;
  mobileOpen: boolean;
  onMobileToggle: () => void;
  onBusiness?: () => void;
  onLogout: () => Promise<void>;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const roleName = platformRoleLabel(session.user.platform_role);

  const navItems: {
    id: PlatformTab;
    label: string;
    icon: typeof LayoutDashboard;
    perm: string;
  }[] = [
    {
      id: "dashboard",
      label: t.platform.overview,
      icon: LayoutDashboard,
      perm: "platform.dashboard.view",
    },
    {
      id: "reports",
      label: t.platform.reports,
      icon: BarChart3,
      perm: "platform.reports.view",
    },
    {
      id: "businesses",
      label: t.platform.businesses,
      icon: Building2,
      perm: "platform.tenants.view",
    },
    {
      id: "plans",
      label: t.platform.plans,
      icon: Layers3,
      perm: "platform.plans.view",
    },
    {
      id: "subscriptions",
      label: t.nav.subscription,
      icon: CreditCard,
      perm: "platform.subscriptions.manage",
    },
    {
      id: "access",
      label: t.platform.access,
      icon: ShieldCheck,
      perm: "platform.access.manage",
    },
    {
      id: "accounts",
      label: t.platform.accounts,
      icon: Users,
      perm: "platform.users.view",
    },
  ];

  const visibleNav = navItems.filter((item) => hasPerm(item.perm));

  return (
    <>
      <header className="platform-mobile-bar">
        <div className="brand">
          <Scissors size={20} />
          <span>salon.</span>
          <span className="badge admin-badge">ADMIN</span>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onMobileToggle}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <aside className={`platform-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="platform-sidebar-header">
          <div className="brand">
            <Scissors size={24} />
            <span>salon.</span>
          </div>
          <span className="platform-portal-tag">
            <ShieldCheck size={14} /> SAAS ADMIN
          </span>
        </div>

        <div className="platform-admin-pill">
          <div className="platform-admin-info">
            <strong>{session.user.name}</strong>
            <span className="cell-sub">{session.user.email}</span>
          </div>
          <span className="role-tag">{roleName}</span>
        </div>

        <nav
          className="platform-nav"
          aria-label="Platform administration navigation"
        >
          <ul>
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`platform-nav-button ${isActive ? "is-active" : ""}`}
                    onClick={() => {
                      onTab(item.id);
                      if (mobileOpen) onMobileToggle();
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="platform-sidebar-footer">
          {onBusiness && (
            <button
              type="button"
              className="button secondary small-button w-full"
              disabled={busy}
              onClick={() => {
                onBusiness();
                if (mobileOpen) onMobileToggle();
              }}
            >
              <span>{t.nav.businessPortal}</span>
              <ArrowRight size={15} />
            </button>
          )}

          <button
            type="button"
            className="platform-logout-button"
            disabled={busy}
            onClick={() => void onLogout()}
          >
            <LogOut size={16} />
            <span>{t.nav.signOut}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
