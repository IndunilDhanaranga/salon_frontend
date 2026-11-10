"use client";

import React from "react";
import type { Session } from "@/lib/types";
import type { PlatformTab } from "../types";
import { PlatformSidebar } from "./platform-sidebar";
import { PlatformHeader } from "./platform-header";
import { PlatformBottomNav } from "./platform-bottom-nav";
import { AlertCircle, Scissors } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function PlatformShell({
  session,
  tab,
  tabTitle,
  tabSubtitle,
  hasPerm,
  allowedTab,
  busy,
  error,
  mobileOpen,
  onMobileToggle,
  onTab,
  onRefresh,
  onBusiness,
  onLogout,
  pendingRenewalsCount = 0,
  children,
}: {
  session: Session;
  tab: PlatformTab;
  tabTitle: string;
  tabSubtitle: string;
  hasPerm: (perm: string) => boolean;
  allowedTab?: PlatformTab;
  busy: boolean;
  error?: string;
  mobileOpen: boolean;
  onMobileToggle: () => void;
  onTab: (tab: PlatformTab) => void;
  onRefresh: () => void;
  onBusiness?: () => void;
  onLogout: () => Promise<void>;
  pendingRenewalsCount?: number;
  children: React.ReactNode;
}) {
  const { language } = useTranslation();

  return (
    <div className="platform-layout-shell">
      {/* Mobile Top Header */}
      <header
        className="mobile-app-header platform-mobile-header"
        aria-label="Mobile platform header"
      >
        <div className="mobile-header-brand">
          <Scissors size={18} strokeWidth={1.8} />
          <span className="brand-name">
            salon<span className="brand-dot">.</span>
          </span>
          <span className="mobile-admin-tag">ADMIN</span>
        </div>

        <div className="mobile-header-tenant-pill">
          <span>{session.user.name}</span>
        </div>
      </header>

      {/* Sidebar Drawer */}
      <PlatformSidebar
        tab={tab}
        onTab={onTab}
        session={session}
        hasPerm={hasPerm}
        mobileOpen={mobileOpen}
        onMobileToggle={onMobileToggle}
        onBusiness={onBusiness}
        onLogout={onLogout}
        busy={busy}
        pendingRenewalsCount={pendingRenewalsCount}
      />

      <main className="platform-workspace-main">
        <PlatformHeader
          title={tabTitle}
          subtitle={tabSubtitle}
          busy={busy}
          pendingRenewalsCount={pendingRenewalsCount}
          onNavigateSubscriptions={() => onTab("subscriptions")}
          onRefresh={onRefresh}
        />

        {error && (
          <div className="error-box" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!allowedTab ? (
          <div className="panel empty-state" role="status">
            <h2>
              {language === "si"
                ? "ප්‍රවේශ අවසර අවශ්‍යයි"
                : "Access permissions needed"}
            </h2>
            <p>
              {language === "si"
                ? "පද්ධති පරිපාලකගෙන් ඔබගේ භූමිකාවට අවසර ලබා ගන්න."
                : "Ask a platform administrator to enable a page for your role."}
            </p>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Platform Quick Actions Footer on Mobile */}
      <PlatformBottomNav
        tab={tab}
        onTab={onTab}
        hasPerm={hasPerm}
        menuOpen={mobileOpen}
        onMenuToggle={onMobileToggle}
      />
    </div>
  );
}
