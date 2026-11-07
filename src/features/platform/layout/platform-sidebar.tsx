"use client";

import React from "react";
import {
  Scissors,
  ShieldCheck,
  ArrowRight,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";
import type { Session } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import type { PlatformTab } from "../types";
import { platformRoleLabel } from "../platform-format";
import { PLATFORM_NAV_ITEMS } from "../config/navigation";

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

  const visibleNav = PLATFORM_NAV_ITEMS.filter((item) => hasPerm(item.perm));

  const getTabLabel = (item: (typeof PLATFORM_NAV_ITEMS)[number]) => {
    switch (item.id) {
      case "dashboard":
        return t.platform.overview;
      case "reports":
        return t.platform.reports;
      case "businesses":
        return t.platform.businesses;
      case "plans":
        return t.platform.plans;
      case "subscriptions":
        return t.nav.subscription;
      case "access":
        return t.platform.access;
      case "accounts":
        return t.platform.accounts;
      case "notifications":
        return t.platform.pushNotifications;
      default:
        return item.defaultLabel;
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "is-open" : ""}`}
        onClick={onMobileToggle}
        aria-hidden={!mobileOpen}
      />

      <aside className={`platform-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="platform-sidebar-header">
          <div className="brand">
            <Scissors size={20} strokeWidth={1.6} />
            <span>salon.</span>
            <span className="platform-portal-tag">
              <ShieldCheck size={12} /> ADMIN
            </span>
          </div>
          <button
            type="button"
            className="drawer-close-button mobile-only"
            onClick={onMobileToggle}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="platform-admin-pill">
          <div className="platform-admin-info">
            <strong>{session.user.name}</strong>
            <span className="cell-sub">{session.user.email}</span>
          </div>
          <span className="role-tag">{roleName}</span>
        </div>

        <nav
          className="platform-nav sidebar-scrollable-nav"
          aria-label="Platform administration navigation"
        >
          <div className="nav-group-section">
            <span className="nav-group-heading">SAAS MANAGEMENT</span>
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
                      <div className="nav-item-icon-title">
                        <Icon size={16} strokeWidth={1.8} />
                        <span>{getTabLabel(item)}</span>
                      </div>
                      <ChevronRight size={14} className="nav-chevron" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
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
              <ArrowRight size={14} />
            </button>
          )}

          <button
            type="button"
            className="platform-logout-button"
            disabled={busy}
            onClick={() => void onLogout()}
          >
            <LogOut size={15} />
            <span>{t.nav.signOut}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
