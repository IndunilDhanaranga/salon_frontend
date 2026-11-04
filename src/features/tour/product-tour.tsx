"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, LogOut, X } from "lucide-react";
import type { Tenant } from "@/lib/types";
import type { View } from "@/features/workspace/navigation";
import { tourStepsFor } from "./tour-steps";
import { useTranslation } from "@/lib/i18n";

type Props = {
  tenant: Tenant;
  isDemo: boolean;
  onView: (view: View) => void;
  onClose: () => void;
  onExitDemo: () => void;
};

export function ProductTour({
  tenant,
  isDemo,
  onView,
  onClose,
  onExitDemo,
}: Props) {
  const { t, language } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [index, setIndex] = useState(0);
  const steps = useMemo(() => tourStepsFor(tenant), [tenant]);
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index === steps.length - 1;

  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  useEffect(() => {
    onView(step.view);
    heading.current?.focus({ preventScroll: true });
  }, [step.view, onView]);

  return (
    <dialog
      ref={dialog}
      className="tour-dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="tour-header">
        <span className="tour-kicker">
          <Compass size={17} />{" "}
          {language === "si"
            ? "ඔබේ සැලූනය, පැහැදිලි කිරීම"
            : "YOUR SALON, EXPLAINED"}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label={t.common.close}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <p className="tour-counter" aria-live="polite">
        {language === "si"
          ? `පියවර ${index + 1} න් ${steps.length}`
          : `Step ${index + 1} of ${steps.length}`}
      </p>
      <h2
        ref={heading}
        tabIndex={-1}
        id="tour-title"
        aria-describedby="tour-description"
      >
        {step.title}
      </h2>
      <p id="tour-description" className="tour-description">
        {step.description}
      </p>
      <ul className="tour-tips">
        {step.tips.map((tip) => (
          <li key={tip}>
            <Check size={15} aria-hidden="true" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
      <div className="tour-progress" aria-hidden="true">
        {steps.map((item, position) => (
          <span
            key={item.view}
            className={position <= index ? "complete" : ""}
          />
        ))}
      </div>
      <div className="tour-actions">
        <button
          type="button"
          className="button secondary"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          <ArrowLeft size={16} />
          {t.common.back}
        </button>
        <button
          type="button"
          className="button primary"
          onClick={() => (isLast ? onClose() : setIndex(index + 1))}
        >
          {isLast
            ? language === "si"
              ? "ක්‍රියාකාරී වන්න"
              : "Explore workspace"
            : language === "si"
              ? "මීළඟ"
              : "Next"}
          {isLast ? <Check size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
      <div className="tour-footer">
        <button type="button" className="text-button" onClick={onClose}>
          {language === "si" ? "මඟහරින්න" : "Skip tour"}
        </button>
        {isDemo && (
          <button type="button" className="text-button" onClick={onExitDemo}>
            <LogOut size={14} />
            {t.shell.exitDemo}
          </button>
        )}
      </div>
    </dialog>
  );
}
