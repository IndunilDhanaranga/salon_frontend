"use client";

import { useRef, useState } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  BarChart3,
  Users,
  Wallet,
  SlidersHorizontal,
  Scissors,
  LogOut,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Package,
  Receipt,
  Menu,
  X,
  Compass,
  Coins,
} from "lucide-react";
import type { Session, Tenant } from "@/lib/types";
import { initials } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { canPermission } from "@/lib/access";

export type { View } from "@/features/workspace/navigation";
import type { View } from "@/features/workspace/navigation";
const navigation = [
  {
    id: "overview",
    name: "Overview",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    id: "branches",
    name: "Branches",
    icon: Building2,
    permission: "branches.view",
  },
  {
    id: "appointments",
    name: "Appointments",
    icon: CalendarDays,
    permission: "appointments.view",
  },
  { id: "team", name: "Team", icon: Users, permission: "staff.view" },
  {
    id: "catalog",
    name: "Services & products",
    icon: Package,
    permission: "catalog.view",
  },
  {
    id: "billing",
    name: "Customer bills",
    icon: Receipt,
    permission: "orders.view",
  },
  {
    id: "deductions",
    name: "Deductions",
    icon: Coins,
    permission: "deductions.view",
  },
  { id: "payroll", name: "Payroll", icon: Wallet, permission: "payroll.view" },
  {
    id: "reports",
    name: "Reports",
    icon: BarChart3,
    permission: "dashboard.view",
  },
  {
    id: "access",
    name: "Roles & access",
    icon: ShieldCheck,
    permission: "access.manage",
  },
] as const;

type Props = {
  session: Session;
  tenant: Tenant;
  view: View;
  busy: boolean;
  onView: (view: View) => void;
  onTenant: (slug: string) => void;
  onLogout: () => void;
  onPlatform?: () => void;
  onTour: () => void;
  children: React.ReactNode;
};

export function WorkspaceShell({
  session,
  tenant,
  view,
  busy,
  onView,
  onTenant,
  onLogout,
  onPlatform,
  onTour,
  children,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  const navLabels: Record<string, string> = {
    overview: t.nav.overview,
    branches: t.nav.branches ?? "Branches",
    appointments: t.nav.appointments,
    team: t.nav.team,
    catalog: t.nav.catalog,
    billing: t.nav.billing,
    deductions: (t.nav as Record<string, string>).deductions ?? "Deductions & Advances",
    payroll: t.nav.payroll,
    reports: t.nav.reports ?? "Reports",
    access: t.nav.access,
  };

  function selectView(value: View) {
    onView(value);
    setMenuOpen(false);
  }
  return (
    <div className="workspace-layout">
      <a className="skip-link" href="#main">
        {t.shell.skipToContent}
      </a>
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Salon home">
          <Scissors size={23} strokeWidth={1.5} />
          <span>
            salon<span className="brand-dot">.</span>
          </span>
        </a>
        <label className="workspace-select">
          <span className="eyebrow light">{t.shell.yourWorkspace}</span>
          <select
            aria-label={t.shell.yourWorkspace}
            value={tenant.slug}
            disabled={busy}
            onChange={(event) => onTenant(event.target.value)}
          >
            {session.tenants.map((item) => (
              <option value={item.slug} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="workspace-role">
            {tenant.role === "owner" ? t.access.owner : tenant.role}{" "}
            {t.shell.workspaceRole}
          </span>
        </label>
        <button
          ref={menuButton}
          className="mobile-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="business-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
          <span>{t.shell.businessMenu}</span>
        </button>
        <nav
          id="business-navigation"
          className={menuOpen ? "mobile-open" : ""}
          aria-label={t.shell.businessMenu}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setMenuOpen(false);
              menuButton.current?.focus();
            }
          }}
        >
          {navigation
            .filter((item) => canPermission(tenant, item.permission))
            .map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                className={`nav-item ${view === id ? "selected" : ""}`}
                aria-current={view === id ? "page" : undefined}
                onClick={() => selectView(id)}
              >
                <Icon size={18} strokeWidth={1.7} />
                {navLabels[id] ?? name}
                {view === id && <span className="nav-dot" />}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="small-caps">{t.nav.spaceToGrow}</span>
            <p>{t.nav.oneWorkspace}</p>
            <ArrowUpRight size={21} />
          </div>
          {onPlatform && (
            <button className="nav-item" onClick={onPlatform}>
              <Building2 size={18} />
              {t.nav.platformAdmin}
            </button>
          )}
          <button
            className="nav-item"
            disabled={busy || tenant.status !== "active"}
            onClick={() => {
              setMenuOpen(false);
              onTour();
            }}
          >
            <Compass size={18} />
            {t.nav.takeTour}
          </button>
          <button
            className={`nav-item ${view === "workspace" ? "selected" : ""}`}
            onClick={() => selectView("workspace")}
          >
            <SlidersHorizontal size={18} />
            {t.nav.workspaceDetails}
          </button>
          <div className="profile">
            <span className="avatar">{initials(session.user.name)}</span>
            <div>
              <strong>{session.user.name}</strong>
              <span>{tenant.role === "owner" ? t.access.owner : tenant.role}</span>
            </div>
            <button
              aria-label={t.nav.signOut}
              title={t.nav.signOut}
              className="icon-button"
              disabled={busy}
              onClick={onLogout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main id="main" className="main-content">
        {children}
      </main>
    </div>
  );
}
