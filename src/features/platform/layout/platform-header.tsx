"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { LanguageDropdown, useTranslation } from "@/lib/i18n";

export function PlatformHeader({
  title,
  subtitle,
  busy,
  onRefresh,
}: {
  title: string;
  subtitle: string;
  busy: boolean;
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
