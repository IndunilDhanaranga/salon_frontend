"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { PlatformTenant, Plan, Session } from "@/lib/types";
import { usePlatform } from "../hooks/use-platform";
import type { PlatformTab } from "../types";
import { availablePlatformTab } from "../platform-access";
import { PlatformShell } from "../layout/platform-shell";
import { PlatformOverview } from "../dashboard/components/platform-overview";
import { PlatformReports } from "../reports/components/platform-reports";
import { BusinessDirectory } from "../businesses/components/business-directory";
import { PlanDirectory } from "../plans/components/plan-directory";
import { PlanFormDialog } from "../plans/components/plan-form-dialog";
import { PlatformAccessManager } from "../roles/components/platform-access-manager";
import { AccountDirectory } from "../administrators/components/account-directory";
import { SubscriptionDialog } from "../subscriptions/components/subscription-dialog";
import { PlatformPushNotifications } from "../notifications/components/platform-push-notifications";
import { useTranslation } from "@/lib/i18n";

export function PlatformView({
  session,
  onBusiness,
  onLogout,
}: {
  session: Session;
  onBusiness?: () => void;
  onLogout: () => Promise<void>;
}) {
  const { language } = useTranslation();
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
          notifications: {
            title: "පුෂ් දැනුම්දීම් කේන්ද්‍රය",
            subtitle:
              "පද්ධතියට අවම වශයෙන් එක් වරක් ප්‍රවේශ වූ සියලුම උපාංග වෙත ක්ෂණික පණිවිඩ යවන්න.",
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
          notifications: {
            title: "Push Notification Center",
            subtitle:
              "Send instant push notifications to every device that has logged into the system at least once.",
          },
        };

  return (
    <PlatformShell
      session={session}
      tab={tab}
      tabTitle={tabTitles[tab].title}
      tabSubtitle={tabTitles[tab].subtitle}
      hasPerm={p.hasPerm}
      allowedTab={allowedTab}
      busy={busy}
      error={p.error}
      mobileOpen={mobileOpen}
      onMobileToggle={() => setMobileOpen(!mobileOpen)}
      onTab={setTab}
      onRefresh={() => void p.load()}
      onBusiness={onBusiness}
      onLogout={onLogout}
    >
      {p.loading && !p.data && !p.plans && !p.access && !p.reports ? (
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

          {tab === "notifications" && (
            <PlatformPushNotifications
              senderName={session.user.name}
              busy={busy}
            />
          )}
        </div>
      )}

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
    </PlatformShell>
  );
}
