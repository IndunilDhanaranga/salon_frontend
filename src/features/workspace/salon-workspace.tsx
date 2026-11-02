"use client";
import { Scissors } from "lucide-react";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { PlatformView } from "@/features/platform/components/platform-view";
import { WorkspaceShell } from "@/features/business/workspace/components/workspace-shell";
import { WorkspaceHeading } from "@/features/business/workspace/components/workspace-heading";
import { WorkspaceForm } from "@/features/business/workspace/components/workspace-forms";
import { BusinessContent } from "@/features/business/workspace/components/business-content";
import { useWorkspace } from "./use-workspace";
import { DemoBanner } from "@/features/tour/demo-banner";
import { ProductTour } from "@/features/tour/product-tour";
import { I18nProvider, LanguagePreferenceModal, useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();
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
        <AuthScreen
          onAuthenticated={w.authenticate}
          notice={w.sessionNotice}
        />
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
      <WorkspaceShell
        session={session}
        tenant={tenant}
        view={w.view}
        busy={w.busy || w.loading}
        onView={w.setView}
        onTenant={w.selectTenant}
        onLogout={() => void w.logout()}
        onTour={() => w.setTourOpen(true)}
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
        <WorkspaceHeading
          tenant={tenant}
          view={w.view}
          loading={w.loading}
          busy={w.busy}
          onRefresh={() => void w.refresh()}
          onForm={w.openForm}
        />
        {w.error && (
          <div className="error-box" role="alert">
            {w.error}
            <button className="text-button" onClick={() => void w.refresh()}>
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
            key={`business:${tenant.id}:${tenant.permissions.join(",")}`}
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
            key={tenant.id + w.form + (w.editing?.id ?? "new")}
            kind={w.form}
            tenant={tenant}
            staff={w.data.bookingStaff}
            editing={w.editing}
            onClose={() => w.setForm(null)}
            onSaved={w.refresh}
          />
        )}
      {w.tourOpen &&
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
    </WorkspaceShell>
  </>
  );
}
