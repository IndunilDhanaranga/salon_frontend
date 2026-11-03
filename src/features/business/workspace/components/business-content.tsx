"use client";
import { canPermission } from "@/lib/access";
import type { Session, Tenant } from "@/lib/types";
import type { useWorkspace } from "@/features/workspace/use-workspace";
import { useTranslation } from "@/lib/i18n";
import { OverviewView } from "@/features/business/dashboard/components/overview-view";
import { AppointmentsView } from "@/features/business/appointments/components/appointments-view";
import { TeamView } from "@/features/business/team/components/team-view";
import { PayrollView } from "@/features/business/payroll/components/payroll-view";
import { AccessView } from "@/features/business/access/components/access-view";
import { CatalogView } from "@/features/business/catalog/components/catalog-view";
import { BillingView } from "@/features/business/billing/components/billing-view";
import { WorkspaceDetails } from "./workspace-details";
import { SubscriptionView } from "@/features/business/subscription/components/subscription-view";
import { BusinessReportsView } from "@/features/business/reports/components/business-reports-view";
import { DeductionsView } from "@/features/business/deductions/components/deductions-view";
import { BranchesView } from "@/features/business/branches/components/branches-view";

type Props = {
  workspace: ReturnType<typeof useWorkspace>;
  tenant: Tenant;
  session: Session;
};
export function BusinessContent({ workspace: w, tenant, session }: Props) {
  const { t } = useTranslation();
  const can = (permission: string) => canPermission(tenant, permission);
  if (w.view === "subscription") return <SubscriptionView tenant={tenant} />;
  if (tenant.status !== "active")
    return (
      <section className="panel empty-state">
        <h2>{t.status.suspended}</h2>
        <p>{tenant.status}</p>
      </section>
    );
  if (w.view === "overview" && can("dashboard.view") && w.data.dashboard)
    return (
      <OverviewView
        dashboard={w.data.dashboard}
        tenant={tenant}
        busy={w.busy}
        onView={w.setView}
        onBook={() => w.openForm("appointment")}
        onStatus={(id, status) => void w.updateStatus(id, status)}
      />
    );
  if (
    w.view === "branches" &&
    (can("branches.view") || can("branches.manage") || can("dashboard.view"))
  )
    return (
      <BranchesView
        tenant={tenant}
        onBranchChanged={() => void w.refresh()}
      />
    );
  if (w.view === "appointments" && can("appointments.view"))
    return (
      <AppointmentsView
        appointments={w.data.appointments}
        tenant={tenant}
        busy={w.busy}
        onStatus={(id, status) => void w.updateStatus(id, status)}
      />
    );
  if (w.view === "team" && can("staff.view"))
    return (
      <TeamView
        staff={w.data.staff}
        tenant={tenant}
        onEdit={can("staff.manage") ? w.editStaff : undefined}
      />
    );
  if (w.view === "catalog" && can("catalog.view"))
    return <CatalogView tenant={tenant} />;
  if (w.view === "billing" && can("orders.view"))
    return <BillingView tenant={tenant} />;
  if (
    w.view === "deductions" &&
    (can("deductions.view") || can("payroll.view"))
  )
    return <DeductionsView tenant={tenant} />;
  if (w.view === "payroll" && can("payroll.view"))
    return <PayrollView runs={w.data.payroll} tenant={tenant} />;
  if (w.view === "reports" && (can("reports.view") || can("dashboard.view")))
    return <BusinessReportsView tenant={tenant} />;
  if (w.view === "access" && can("access.manage"))
    return <AccessView tenant={tenant} currentUserId={session.user.id} />;
  if (w.view === "workspace")
    return (
      <WorkspaceDetails tenant={tenant} onAccess={() => w.setView("access")} />
    );
  return null;
}
