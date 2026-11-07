"use client";

import React from "react";
import {
  Calendar,
  Receipt,
  Wallet,
  Sparkles,
  Info,
  X,
  ChevronRight,
  Megaphone,
  AlertTriangle,
} from "lucide-react";
import { useNotifications } from "../context/notification-context";
import { useTranslation } from "@/lib/i18n";
import type { InAppNotification, NotificationType } from "../types";

export function NotificationToast() {
  const { activeToast, dismissToast, markAsRead, onNavigateView } =
    useNotifications();
  const { t } = useTranslation();

  if (!activeToast) return null;

  const getIcon = (item: InAppNotification) => {
    if (item.isBroadcast) {
      return <Megaphone size={18} />;
    }
    switch (item.type) {
      case "appointment":
        return <Calendar size={18} />;
      case "billing":
        return <Receipt size={18} />;
      case "payroll":
        return <Wallet size={18} />;
      case "subscription":
        return <Sparkles size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  const handleClick = () => {
    markAsRead(activeToast.id);
    if (activeToast.targetView && onNavigateView) {
      onNavigateView(activeToast.targetView);
    }
    dismissToast();
  };

  return (
    <div className="notification-toast-wrapper" role="alert" aria-live="polite">
      <div
        className={`notification-toast ${activeToast.isBroadcast ? "broadcast" : activeToast.type} ${activeToast.priority === "urgent" ? "toast-urgent" : ""}`}
        onClick={handleClick}
      >
        <div
          className={`toast-icon-badge ${activeToast.isBroadcast ? "broadcast" : activeToast.type}`}
        >
          {getIcon(activeToast)}
        </div>

        <div className="toast-content">
          <div className="toast-title-row">
            <strong className="toast-title">{activeToast.title}</strong>
            {activeToast.isBroadcast && (
              <span className="toast-tag-broadcast">
                {t.notifications.teamNotice}
              </span>
            )}
            {activeToast.priority === "urgent" && (
              <span className="toast-tag-urgent">
                <AlertTriangle size={11} />
                {t.notifications.priorityUrgent}
              </span>
            )}
          </div>
          <p className="toast-message">{activeToast.message}</p>
          {activeToast.sender && (
            <span className="toast-sender">
              {t.notifications.fromSender}: {activeToast.sender.name}
            </span>
          )}
        </div>

        {activeToast.targetView && (
          <div className="toast-action-arrow">
            <ChevronRight size={16} />
          </div>
        )}

        <button
          type="button"
          className="toast-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            dismissToast();
          }}
          aria-label={t.common.close}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
