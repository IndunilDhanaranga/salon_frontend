"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../context/notification-context";
import { useTranslation } from "@/lib/i18n";

export function NotificationBell({ className = "" }: { className?: string }) {
  const { unreadCount, isOpen, setIsOpen } = useNotifications();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`notification-bell-btn ${isOpen ? "active" : ""} ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      aria-label={t.notifications.title}
      aria-expanded={isOpen}
      title={t.notifications.title}
    >
      <Bell size={18} strokeWidth={unreadCount > 0 ? 2.1 : 1.8} />
      {unreadCount > 0 && (
        <span
          className="notification-badge"
          aria-label={`${unreadCount} ${t.notifications.unread}`}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
