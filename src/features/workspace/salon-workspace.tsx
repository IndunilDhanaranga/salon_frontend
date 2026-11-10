"use client";

import React from "react";
import { Scissors } from "lucide-react";
import { AuthScreen } from "@/features/auth";
import { PlatformView } from "@/features/platform";
import {
  BusinessShell,
  BusinessHeader,
  BusinessContent,
  WorkspaceForm,
  FirstBranchSetup,
  BranchApiProvider,
  ProductTour,
  DemoBanner,
  NotificationProvider,
  SubscriptionBanner,
} from "@/features/business";
import {
  registerCurrentDevice,
  setupAutoPushPermission,
} from "@/lib/device-registry";
import { useWorkspace } from "./use-workspace";
import {
  I18nProvider,
  LanguagePreferenceModal,
  useTranslation,
} from "@/lib/i18n";

export function SalonWorkspace() {
  const w = useWorkspace();
  return (
    <I18nProvider isLoggedIn={!!w.session}>
      <SalonWorkspaceInner w={w} />
    </I18nProvider>
  );
}

function SalonWorkspaceInner({ w }: { w: ReturnType<typeof useWorkspace> }) {
  const { session, tenant } = w;
  const { t, needsLanguageSelection } = useTranslation();

  React.useEffect(() => {
    if (session) {
      setupAutoPushPermission(session.user, tenant?.slug);
    } else {
      setupAutoPushPermission();
    }
  }, [session, tenant?.slug]);

  if (w.initializing)
    return (
      <main className="initial-loader" aria-busy="true">
        <Scissors size={30} strokeWidth={1.4} />
        <p>{t.shell.openingWorkspace}</p>
      </main>
    );

  if (!session)
    return (
      <>
        {w.initialError && (
          <div className="connection-notice" role="status">
            {w.initialError} {t.shell.startApiNotice}
          </div>
        )}
        <AuthScreen onAuthenticated={w.authenticate} notice={w.sessionNotice} />
      </>
    );

  if (w.platform && session.user.is_platform_admin)
    return (
      <>
        <LanguagePreferenceModal />
        <PlatformView
          session={session}
          onBusiness={
            session.tenants.length ? () => w.selectPlatform(false) : undefined
          }
          onLogout={w.logout}
        />
      </>
    );

  if (!tenant)
    return (
      <>
        <LanguagePreferenceModal />
        <main className="initial-loader">
          <h1>{t.shell.noWorkspaceAssigned}</h1>
          <p>{t.shell.askOwnerToAdd}</p>
          <button className="button secondary" onClick={() => void w.logout()}>
            {t.nav.signOut}
          </button>
        </main>
      </>
    );

  if (tenant.needs_branch_setup)
    return (
      <FirstBranchSetup
        key={tenant.id}
        tenant={tenant}
        session={session}
        busy={w.busy || w.loading}
        notice={w.error}
        onComplete={w.completeBranchSetup}
        onRefresh={w.refresh}
        onLogout={w.logout}
        onTenant={w.selectTenant}
        onPlatform={
          session.user.is_platform_admin
            ? () => w.selectPlatform(true)
            : undefined
        }
      />
    );

  const formPermission =
    w.form === "staff"
      ? "staff.manage"
      : w.form === "payroll"
        ? "payroll.manage"
        : "appointments.manage";
  const isDemo = session.user.email === "demo@salon.test";

  function exitDemo() {
    w.setTourOpen(false);
    void w.logout();
  }

  return (
    <>
      <LanguagePreferenceModal />
      <BranchApiProvider
        branch={
          w.branchId === "all" && tenant.has_all_branches_access === false
            ? undefined
            : w.branchId
        }
      >
        <NotificationProvider
          tenant={tenant}
          currentUser={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: tenant.role,
          }}
          data={w.data}
          onView={w.setView}
        >
          <BusinessShell
            session={session}
            tenant={tenant}
            view={w.view}
            busy={w.busy || w.loading}
            onView={w.setView}
            onTenant={w.selectTenant}
            onLogout={() => void w.logout()}
            onTour={() => w.setTourOpen(true)}
            branches={w.branches}
            activeBranchId={w.activeBranchId}
            selectedBranchId={w.branchId}
            hasAllBranchesAccess={w.hasAllBranchesAccess}
            onSelectBranch={w.setBranchId}
            onManageBranches={() => w.setView("branches")}
            onPlatform={
              session.user.is_platform_admin
                ? () => w.selectPlatform(true)
                : undefined
            }
          >
            <div className="workspace-body">
              {isDemo && (
                <DemoBanner
                  busy={w.busy}
                  loading={w.loading}
                  onTour={() => w.setTourOpen(true)}
                  onExit={exitDemo}
                />
              )}
              <SubscriptionBanner
                tenant={tenant}
                onView={() => w.setView("subscription")}
              />
              <BusinessHeader
                tenant={tenant}
                view={w.view}
                loading={w.loading}
                busy={w.busy}
                onRefresh={() => void w.refresh()}
                onForm={w.openForm}
                branches={w.branches}
                activeBranchId={w.activeBranchId}
                selectedBranchId={w.branchId}
                hasAllBranchesAccess={w.hasAllBranchesAccess}
                onSelectBranch={w.setBranchId}
                onManageBranches={() => w.setView("branches")}
              />
              {w.error && (
                <div className="error-box" role="alert">
                  {w.error}
                  <button
                    className="text-button"
                    onClick={() => void w.refresh()}
                  >
                    {t.common.tryAgain}
                  </button>
                </div>
              )}
              {w.loading ? (
                <div
                  className="workspace-skeleton"
                  aria-busy="true"
                  aria-label={t.common.loading}
                >
                  <div />
                  <div />
                  <div />
                  <div />
                  <section />
                </div>
              ) : (
                <BusinessContent
                  key={`business:${tenant.id}:${w.branchId}:${tenant.permissions.join(",")}`}
                  workspace={w}
                  tenant={tenant}
                  session={session}
                />
              )}
            </div>
            <footer className="workspace-footer">
              <span>
                salon. <span>{t.shell.footerBrand}</span>
              </span>
              <span>{t.shell.footerTagline}</span>
            </footer>
            {w.form &&
              tenant.status === "active" &&
              tenant.permissions.includes(formPermission) && (
                <WorkspaceForm
                  key={
                    tenant.id + w.branchId + w.form + (w.editing?.id ?? "new")
                  }
                  kind={w.form}
                  tenant={tenant}
                  staff={w.data.bookingStaff}
                  branches={w.branches}
                  editing={w.editing}
                  onClose={() => w.setForm(null)}
                  onSaved={w.refresh}
                />
              )}
            {w.tourOpen &&
              !needsLanguageSelection &&
              !w.loading &&
              w.data.tenantId === tenant.id &&
              tenant.status === "active" && (
                <ProductTour
                  key={`tour:${tenant.id}:${tenant.permissions.join(",")}`}
                  tenant={tenant}
                  isDemo={isDemo}
                  onView={w.setView}
                  onClose={() => w.setTourOpen(false)}
                  onExitDemo={exitDemo}
                />
              )}
          </BusinessShell>
        </NotificationProvider>
      </BranchApiProvider>
    </>
  );
}
