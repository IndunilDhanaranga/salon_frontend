"use client";

import { Compass, LogOut, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function DemoBanner({
  busy,
  loading,
  onTour,
  onExit,
}: {
  busy: boolean;
  loading: boolean;
  onTour: () => void;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="demo-banner" aria-label={t.shell.demoWorkspace}>
      <div className="demo-banner-copy">
        <span className="demo-banner-icon">
          <Sparkles size={18} />
        </span>
        <div>
          <strong>{t.shell.demoWorkspace}</strong>
          <p>{t.shell.demoNotice}</p>
        </div>
      </div>
      <div className="demo-banner-actions">
        <button
          type="button"
          className="button secondary small-button"
          disabled={busy || loading}
          onClick={onTour}
        >
          <Compass size={16} />
          {t.nav.takeTour}
        </button>
        <button
          type="button"
          className="button primary small-button"
          disabled={busy}
          onClick={onExit}
        >
          <LogOut size={16} />
          {busy ? t.common.loading : t.shell.exitDemo}
        </button>
      </div>
    </section>
  );
}
