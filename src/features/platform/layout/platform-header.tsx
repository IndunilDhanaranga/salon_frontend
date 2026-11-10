"use client";

import React from "react";
import { Bell, BellRing, ReceiptText, RefreshCw } from "lucide-react";
import { LanguageDropdown, useTranslation } from "@/lib/i18n";

export function PlatformHeader({
  title,
  subtitle,
  busy,
  pendingRenewalsCount = 0,
  onNavigateSubscriptions,
  onRefresh,
}: {
  title: string;
  subtitle: string;
  busy: boolean;
  pendingRenewalsCount?: number;
  onNavigateSubscriptions?: () => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();

  return (
    <header className="page-heading platform-page-header">
      <div>
        <span className="eyebrow">{t.platform.title}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {pendingRenewalsCount > 0 && onNavigateSubscriptions && (
          <button
            type="button"
            className="pending-slips-alert-btn"
            onClick={onNavigateSubscriptions}
            title="Inspect submitted payment slips"
          >
            <BellRing size={16} className="bounce-anim" />
            <span>
              {pendingRenewalsCount} Pending Slip
              {pendingRenewalsCount > 1 ? "s" : ""}
            </span>
          </button>
        )}

        <LanguageDropdown />
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={onRefresh}
        >
          <RefreshCw size={16} className={busy ? "spin" : ""} />
          <span>{t.common.refresh}</span>
        </button>
      </div>
    </header>
  );
}
