"use client";

import React, { useState } from "react";
import type { Branch, Session, Tenant } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import { BusinessSidebar } from "./business-sidebar";
import { BusinessBottomNav } from "./business-bottom-nav";
import type { View } from "../config/navigation";
import { Scissors } from "lucide-react";
import { NotificationBell } from "../notifications/components/notification-bell";
import { NotificationDrawer } from "../notifications/components/notification-drawer";
import { NotificationToast } from "../notifications/components/notification-toast";
import { BranchDropdown } from "../workspace/components/branch-dropdown";

export function BusinessShell({
  session,
  tenant,
  view,
  busy,
  onView,
  onTenant,
  onLogout,
  onPlatform,
  onTour,
  branches,
  activeBranchId,
  selectedBranchId,
  hasAllBranchesAccess,
  onSelectBranch,
  onManageBranches,
  children,
}: {
  session: Session;
  tenant: Tenant;
  view: View;
  busy: boolean;
  onView: (view: View) => void;
  onTenant: (slug: string) => void;
  onLogout: () => void;
  onPlatform?: () => void;
  onTour: () => void;
  branches?: Branch[];
  activeBranchId?: string | null;
  selectedBranchId?: string;
  hasAllBranchesAccess?: boolean;
  onSelectBranch?: (id: string) => void;
  onManageBranches?: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="workspace-layout">
      <a className="skip-link" href="#main">
        {t.shell.skipToContent}
      </a>

      {/* Modern Mobile Top Navigation Bar */}
      <header
        className="mobile-app-header"
        aria-label="Mobile navigation header"
      >
        <div className="mobile-header-brand">
          <Scissors size={18} strokeWidth={1.8} />
          <span className="brand-name">
            salon<span className="brand-dot">.</span>
          </span>
        </div>

        <div className="mobile-header-right">
          {branches && branches.length > 0 && onSelectBranch && (
            <BranchDropdown
              branches={branches}
              activeBranchId={activeBranchId ?? null}
              selectedBranchId={selectedBranchId ?? "all"}
              hasAllBranchesAccess={hasAllBranchesAccess ?? true}
              onSelectBranch={onSelectBranch}
              onManageBranches={onManageBranches}
            />
          )}
          <div className="mobile-header-tenant-pill">
            <span>{tenant.name}</span>
          </div>
          <NotificationBell />
        </div>
      </header>

      {/* Full Drawer Sidebar (Image 2 Style & Desktop Compact) */}
      <BusinessSidebar
        session={session}
        tenant={tenant}
        view={view}
        busy={busy}
        onView={onView}
        onTenant={onTenant}
        onLogout={onLogout}
        onPlatform={onPlatform}
        onTour={onTour}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main id="main" className="main-content">
        {children}
      </main>

      {/* In-App Notifications Drawer & Toasts */}
      <NotificationDrawer />
      <NotificationToast />

      {/* Quick Actions Footer (Image 1 Style Bottom Nav) */}
      <BusinessBottomNav
        view={view}
        tenant={tenant}
        onView={(targetView) => {
          onView(targetView);
          setMobileOpen(false);
        }}
        onMenuToggle={() => setMobileOpen(!mobileOpen)}
        menuOpen={mobileOpen}
      />
    </div>
  );
}
