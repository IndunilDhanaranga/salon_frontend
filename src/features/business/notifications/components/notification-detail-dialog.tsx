"use client";

import React, { useEffect, useId, useRef } from "react";
import { AlertTriangle, ArrowRight, Bell, CheckCheck, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { InAppNotification } from "../types";

export function NotificationDetailDialog({
  notification,
  onClose,
  onNavigate,
}: {
  notification: InAppNotification;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}) {
  const { t, language } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const urgent = notification.priority === "urgent";
  const date = new Date(notification.timestamp);
  const formattedDate = Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      } else {
        document
          .querySelector<HTMLElement>(
            ".notification-drawer .close-action, .notification-bell-btn",
          )
          ?.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="notification-detail-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <header className="notification-detail-header">
        <span
          className={`notification-detail-symbol ${urgent ? "is-urgent" : ""}`}
          aria-hidden="true"
        >
          {urgent ? <AlertTriangle size={22} /> : <Bell size={22} />}
        </span>
        <span className="notification-detail-kind">
          {notification.isBroadcast
            ? t.notifications.teamNotice
            : t.notifications.title}
        </span>
        <button
          type="button"
          className="notification-detail-close"
          onClick={onClose}
          aria-label={t.common.close}
          autoFocus
        >
          <X size={20} />
        </button>
      </header>
      <div className="notification-detail-content">
        <div className="notification-detail-status">
          <span>
            <CheckCheck size={15} aria-hidden="true" />
            {language === "si" ? "කියවා ඇත" : "Read"}
          </span>
          {urgent && (
            <span className="notification-detail-urgent">
              <AlertTriangle size={14} aria-hidden="true" />
              {t.notifications.priorityUrgent}
            </span>
          )}
        </div>
        <h2 id={titleId}>{notification.title}</h2>
        <div className="notification-detail-meta">
          {notification.sender?.name && (
            <span>
              {t.notifications.fromSender}:{" "}
              <strong>{notification.sender.name}</strong>
            </span>
          )}
          {formattedDate && (
            <time dateTime={notification.timestamp}>{formattedDate}</time>
          )}
        </div>
        <p className="notification-detail-message">{notification.message}</p>
      </div>
      <footer className="notification-detail-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          {t.common.close}
        </button>
        {notification.targetView && onNavigate && (
          <button
            type="button"
            className="button primary"
            onClick={() => onNavigate(notification.targetView!)}
          >
            {notification.actionLabel ||
              (language === "si"
                ? "අදාළ පිටුව විවෘත කරන්න"
                : "Open related page")}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </footer>
    </dialog>
  );
}
