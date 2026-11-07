"use client";

import React from "react";
import {
  LayoutDashboard,
  Building2,
  Layers3,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { PlatformTab } from "../types";

export function PlatformBottomNav({
  tab,
  onTab,
  hasPerm,
  menuOpen,
  onMenuToggle,
}: {
  tab: PlatformTab;
  onTab: (tab: PlatformTab) => void;
  hasPerm: (perm: string) => boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  const { t } = useTranslation();

  const quickItems: {
    id: PlatformTab;
    label: string;
    icon: typeof LayoutDashboard;
    visible: boolean;
  }[] = [
    {
      id: "dashboard",
      label: t.platform.overview || "Overview",
      icon: LayoutDashboard,
      visible: hasPerm("platform.dashboard.view"),
    },
    {
      id: "businesses",
      label: t.platform.businesses || "Salons",
      icon: Building2,
      visible: hasPerm("platform.tenants.view"),
    },
    {
      id: "plans",
      label: t.platform.plans || "Plans",
      icon: Layers3,
      visible: hasPerm("platform.plans.view"),
    },
    {
      id: "reports",
      label: t.platform.reports || "Reports",
      icon: BarChart3,
      visible: hasPerm("platform.reports.view"),
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Quick platform navigation">
      <div className="mobile-bottom-nav-inner">
        {quickItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.id && !menuOpen;
            return (
              <button
                key={item.id}
                type="button"
                className={`mobile-bottom-nav-item ${isActive ? "is-active" : ""}`}
                onClick={() => onTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
              >
                <div className="nav-icon-wrapper">
                  <Icon size={21} strokeWidth={isActive ? 2.2 : 1.7} />
                </div>
                {isActive && <span className="active-indicator" />}
              </button>
            );
          })}

        <button
          type="button"
          className={`mobile-bottom-nav-item ${menuOpen ? "is-active" : ""}`}
          onClick={onMenuToggle}
          aria-label={menuOpen ? t.common.close || "Close" : "Menu"}
          aria-expanded={menuOpen}
          title={menuOpen ? t.common.close || "Close" : "Menu"}
        >
          <div className="nav-icon-wrapper">
            {menuOpen ? (
              <X size={21} strokeWidth={2.2} />
            ) : (
              <Menu size={21} strokeWidth={1.8} />
            )}
          </div>
          {menuOpen && <span className="active-indicator" />}
        </button>
      </div>
    </nav>
  );
}
