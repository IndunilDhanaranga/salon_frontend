"use client";

import { useState } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import type { PlatformTenant, Plan, Session } from "@/lib/types";
import { usePlatform } from "../hooks/use-platform";
import type { PlatformTab } from "../types";
import { availablePlatformTab } from "../platform-access";
import { PlatformSidebar } from "./platform-sidebar";
import { PlatformOverview } from "./platform-overview";
import { PlatformReports } from "./platform-reports";
import { BusinessDirectory } from "./business-directory";
import { PlanDirectory } from "./plan-directory";
import { PlatformAccessManager } from "./platform-access-manager";
import { AccountDirectory } from "./account-directory";
import { PlanFormDialog } from "./plan-form-dialog";
import { SubscriptionDialog } from "./subscription-dialog";
import { useTranslation, LanguageDropdown } from "@/lib/i18n";

export function PlatformView({
  session,
  onBusiness,
  onLogout,
}: {
  session: Session;
  onBusiness?: () => void;
  onLogout: () => Promise<void>;
}) {
  const { t, language } = useTranslation();
  const p = usePlatform(session, onLogout);
  const [requestedTab, setTab] = useState<PlatformTab>("dashboard");
  const allowedTab = availablePlatformTab(requestedTab, p.hasPerm);
  const tab = allowedTab ?? "dashboard";
  const [mobileOpen, setMobileOpen] = useState(false);

  // Modal dialog states
  const [editingPlan, setEditingPlan] = useState<Plan | null | undefined>(
    undefined,
  );
  const [managingTenant, setManagingTenant] = useState<PlatformTenant | null>(
    null,
  );

  const busy = p.loading || p.pending;

  const tabTitles: Record<PlatformTab, { title: string; subtitle: string }> =
    language === "si"
      ? {
          dashboard: {
            title: "පද්ධති දළ විශ්ලේෂණය",
            subtitle: `ආයුබෝවන්, ${session.user.name}. අද දින පද්ධතියේ ක්‍රියාකාරීත්වය මෙසේය.`,
          },
          reports: {
            title: "වාර්තා සහ මූල්‍ය විශ්ලේෂණ",
            subtitle:
              "මාසික ආදායම (MRR), පැකේජ පරිවර්තනය, අත්හදා බැලීම් තත්ත්වය සහ පද්ධති GMV නිරීක්ෂණය කරන්න.",
          },
          businesses: {
            title: "සැලුන් ව්‍යාපාර නාමාවලිය",
            subtitle:
              "සැලුන් ව්‍යාපාර, සක්‍රිය දායකත්වයන් සහ ක්‍රියාකාරී තත්ත්වය පරීක්ෂා කරන්න.",
          },
          plans: {
            title: "දායකත්ව පැකේජ සහ විශේෂාංග පාලනය",
            subtitle:
              "පැකේජ සැලසුම් කිරීම, විශේෂාංග සීමා නිර්ණය කිරීම සහ පැකේජ කළමනාකරණය.",
          },
          subscriptions: {
            title: "ව්‍යාපාර දායකත්ව කළමනාකරණය",
            subtitle:
              "ව්‍යාපාර ප්‍රවේශ කාලසීමා, අත්හදා බැලීම් දීර්ඝ කිරීම සහ පැකේජ පැවරීම.",
          },
          access: {
            title: "පද්ධති භූමිකා සහ අවසර (RBAC)",
            subtitle:
              "පරිපාලක භූමිකා, සවිස්තරාත්මක අවසර සැකසුම් සහ පරිපාලක ගිණුම් කළමනාකරණය.",
          },
          accounts: {
            title: "මධ්‍යම පරිශීලක නාමාවලිය",
            subtitle:
              "පද්ධති පරිපාලකයින් සහ ව්‍යාපාර ක්‍රියාකරුවන්ගේ ඒකාබද්ධ ලේඛනය.",
          },
        }
      : {
          dashboard: {
            title: "Platform Overview",
            subtitle: `Welcome back, ${session.user.name}. Here is what's happening across the platform today.`,
          },
          reports: {
            title: "Reports & Financial Analytics",
            subtitle:
              "Track monthly recurring revenue (MRR), package conversion, trial health, and platform GMV.",
          },
          businesses: {
            title: "Salon Businesses Directory",
            subtitle:
              "Inspect salon businesses, active subscriptions, and toggle operational availability.",
          },
          plans: {
            title: "Subscription Packages & Feature Controlling",
            subtitle:
              "Design and price packages, define module capabilities, and manage package lifecycle.",
          },
          subscriptions: {
            title: "Business Subscriptions Management",
            subtitle:
              "Manage business access periods, extend free trials, and assign active tiers.",
          },
          access: {
            title: "Platform Roles & Permissions (RBAC)",
            subtitle:
              "Manage platform administration roles, configure granular permissions, and assign admin accounts.",
          },
          accounts: {
            title: "Central User Directory",
            subtitle:
              "Unified registry of platform administrators and business operators across salons.",
          },
        };

  return (
    <div className="platform-layout-shell">
      <PlatformSidebar
        tab={tab}
        onTab={setTab}
        session={session}
        hasPerm={p.hasPerm}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(!mobileOpen)}
        onBusiness={onBusiness}
        onLogout={onLogout}
        busy={busy}
      />

      <main className="platform-workspace-main">
        <header className="page-heading platform-page-header">
          <div>
            <span className="eyebrow">{t.platform.title}</span>
            <h1>{tabTitles[tab].title}</h1>
            <p>{tabTitles[tab].subtitle}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LanguageDropdown />
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => void p.load()}
            >
              <RefreshCw size={16} className={busy ? "spin" : ""} />
              <span>{t.common.refresh}</span>
            </button>
          </div>
        </header>

        {p.error && (
          <div className="error-box" role="alert">
            <AlertCircle size={16} />
            <span>{p.error}</span>
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
        ) : p.loading && !p.data && !p.plans && !p.access && !p.reports ? (
          <div className="platform-loading-box" aria-busy="true">
            <RefreshCw size={24} className="spin" />
            <p>Loading platform workspace…</p>
          </div>
        ) : (
          <div className="platform-tab-content">
            {tab === "dashboard" && p.data && (
              <PlatformOverview
                data={p.data}
                busy={busy}
                onTab={setTab}
                onManageSubscription={(tenant) => setManagingTenant(tenant)}
                hasPerm={p.hasPerm}
              />
            )}

            {tab === "reports" && (
              <PlatformReports
                reports={p.reports}
                tenants={p.data?.tenants ?? []}
                busy={busy}
                canManageSubscriptions={p.hasPerm(
                  "platform.subscriptions.manage",
                )}
                onManageTenant={(tenant) => setManagingTenant(tenant)}
                onExtendTrial={async (id) => {
                  await p.extendTrial(id, 30);
                }}
              />
            )}

            {(tab === "businesses" || tab === "subscriptions") && p.data && (
              <BusinessDirectory
                tenants={p.data.tenants}
                busy={busy}
                canManageTenants={p.hasPerm("platform.tenants.manage")}
                canManageSubscriptions={p.hasPerm(
                  "platform.subscriptions.manage",
                )}
                onToggle={(t) =>
                  void p.toggleBusiness(
                    t.id,
                    t.status === "active" ? "suspended" : "active",
                  )
                }
                onManage={(t) => setManagingTenant(t)}
              />
            )}

            {tab === "plans" && p.plans && (
              <PlanDirectory
                catalog={p.plans}
                busy={busy}
                canManagePlans={p.hasPerm("platform.plans.manage")}
                onEdit={(plan) => setEditingPlan(plan)}
                onArchive={(plan) => void p.archivePlan(plan.id, !plan.active)}
              />
            )}

            {tab === "access" && (
              <PlatformAccessManager
                access={p.access}
                currentUserId={session.user.id}
                busy={busy}
                onSaveRole={p.saveRole}
                onDeleteRole={p.deleteRole}
                onAssignUserRole={p.assignUserRole}
              />
            )}

            {tab === "accounts" && p.data && (
              <AccountDirectory users={p.data.users} />
            )}
          </div>
        )}
      </main>

      {/* Package Form Dialog */}
      {editingPlan !== undefined && p.plans && (
        <PlanFormDialog
          plan={editingPlan}
          catalog={p.plans}
          busy={busy}
          onClose={() => setEditingPlan(undefined)}
          onSave={p.savePlan}
        />
      )}

      {/* Subscription Handling Dialog */}
      {managingTenant && (
        <SubscriptionDialog
          tenant={managingTenant}
          busy={busy}
          onClose={() => setManagingTenant(null)}
          onFetchDetail={p.fetchSubscriptionDetail}
          onSaveSubscription={p.saveSubscription}
          onExtendTrial={p.extendTrial}
        />
      )}
    </div>
  );
}
