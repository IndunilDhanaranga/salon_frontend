"use client";

import React, { useState } from "react";
import {
  Calendar,
  Receipt,
  Wallet,
  Sparkles,
  Info,
  CheckCheck,
  X,
  BellOff,
  ChevronRight,
  Trash2,
  Bell,
  Megaphone,
  BellRing,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import { useNotifications } from "../context/notification-context";
import { useTranslation } from "@/lib/i18n";
import type { InAppNotification, NotificationType } from "../types";
import { BroadcastComposerDialog } from "./broadcast-composer-dialog";

export function NotificationDrawer() {
  const {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    onNavigateView,
    setIsComposeOpen,
    pushPermission,
    requestPushPermission,
  } = useNotifications();

  const { t, language } = useTranslation();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (!isOpen) return null;

  const filtered = notifications.filter((n) =>
    filter === "unread" ? !n.read : true,
  );

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  const getSubBadgeIcon = (item: InAppNotification) => {
    if (item.isBroadcast) {
      return <Megaphone size={10} />;
    }
    switch (item.type) {
      case "appointment":
        return <Calendar size={10} />;
      case "billing":
        return <Receipt size={10} />;
      case "payroll":
        return <Wallet size={10} />;
      case "subscription":
        return <Sparkles size={10} />;
      default:
        return <Info size={10} />;
    }
  };

  const getSubBadgeColor = (item: InAppNotification) => {
    if (item.isBroadcast) return "broadcast";
    return item.type;
  };

  const getAvatarContent = (item: InAppNotification) => {
    if (item.sender?.name) {
      return item.sender.name.charAt(0).toUpperCase();
    }
    switch (item.type) {
      case "appointment":
        return "📅";
      case "billing":
        return "💳";
      case "payroll":
        return "💼";
      case "subscription":
        return "✨";
      default:
        return "🔔";
    }
  };

  const formatTime = (timestamp: string) => {
    const diffSec = Math.max(
      0,
      Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000),
    );
    if (diffSec < 60) return t.notifications.justNow;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en", {
      month: "short",
      day: "numeric",
    }).format(new Date(timestamp));
  };

  const handleItemClick = (item: InAppNotification) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    if (item.targetView && onNavigateView) {
      onNavigateView(item.targetView);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="notification-backdrop"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel (Facebook Style) */}
      <aside
        className="notification-drawer fb-notification-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t.notifications.title}
      >
        {/* Header */}
        <div className="notification-drawer-header fb-drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-bell-icon fb-bell-wrap">
              <Bell size={18} />
            </div>
            <div>
              <h3>{t.notifications.title}</h3>
              {pushPermission === "granted" && (
                <div className="push-active-indicator">
                  <span className="push-green-dot" />
                  <span>{t.notifications.pushActive}</span>
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <span className="notification-unread-pill fb-unread-badge">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="drawer-actions">
            <button
              type="button"
              className="drawer-broadcast-btn"
              onClick={() => setIsComposeOpen(true)}
              title={t.notifications.broadcastTitle}
              aria-label={t.notifications.broadcastTitle}
            >
              <Megaphone size={14} />
              <span>{t.notifications.sendNotice}</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-icon-action"
                onClick={markAllAsRead}
                title={t.notifications.markAllRead}
                aria-label={t.notifications.markAllRead}
              >
                <CheckCheck size={17} />
              </button>
            )}
            <button
              type="button"
              className="notification-icon-action close-action"
              onClick={() => setIsOpen(false)}
              aria-label={t.common.close}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Push Notification Opt-In Banner */}
        {pushPermission === "default" && (
          <div className="push-optin-card fb-push-card">
            <div className="push-card-icon">
              <BellRing size={16} />
            </div>
            <div className="push-card-text">
              <strong>{t.notifications.pushBannerTitle}</strong>
              <p>{t.notifications.pushBannerDesc}</p>
            </div>
            <button
              type="button"
              className="button primary push-enable-btn"
              onClick={() => void requestPushPermission()}
            >
              {t.notifications.enablePush}
            </button>
          </div>
        )}

        {/* iPhone PWA Hint if iOS Safari */}
        {isIOS && pushPermission !== "granted" && (
          <div className="push-optin-card ios-card">
            <div className="push-card-icon">
              <Smartphone size={16} />
            </div>
            <div className="push-card-text">
              <strong>iPhone Push Notifications</strong>
              <p>
                {language === "si"
                  ? "iPhone මත Lock Screen push ලබාගැනීමට Share (⎋) ඔබා 'Add to Home Screen' තෝරන්න."
                  : "To receive lock screen alerts on iPhone, tap Share (⎋) → 'Add to Home Screen'."}
              </p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="notification-filter-tabs fb-tabs">
          <button
            type="button"
            className={`tab-btn fb-tab-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {t.notifications.all}
            <span className="count-tag">{notifications.length}</span>
          </button>
          <button
            type="button"
            className={`tab-btn fb-tab-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            {t.notifications.unread}
            {unreadCount > 0 && (
              <span className="count-tag unread">{unreadCount}</span>
            )}
          </button>
        </div>

        {/* Notifications List (Facebook Feed Style) */}
        <div className="notification-list-body fb-feed-list">
          {filtered.length === 0 ? (
            <div className="notification-empty-state">
              <div className="empty-icon-wrap">
                <BellOff size={28} />
              </div>
              <h4>{t.notifications.emptyTitle}</h4>
              <p>{t.notifications.emptyDesc}</p>
            </div>
          ) : (
            filtered.map((item) => (
              <article
                key={item.id}
                className={`fb-notif-item ${item.read ? "is-read" : "is-unread"} ${item.priority === "urgent" ? "is-urgent" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                {/* Facebook Avatar with Mini Sub-Badge */}
                <div className="fb-avatar-wrap">
                  <div className="fb-avatar-circle">
                    {getAvatarContent(item)}
                  </div>
                  <div
                    className={`fb-subbadge ${getSubBadgeColor(item)}`}
                    aria-hidden="true"
                  >
                    {getSubBadgeIcon(item)}
                  </div>
                </div>

                {/* Content Area */}
                <div className="fb-notif-content">
                  <div className="fb-notif-text">
                    {item.sender?.name && (
                      <strong className="fb-sender-name">
                        {item.sender.name}{" "}
                      </strong>
                    )}
                    <span className="fb-notif-title-inline">{item.title}</span>
                    {item.priority === "urgent" && (
                      <span className="fb-urgent-pill">
                        <AlertTriangle size={10} />
                        {t.notifications.priorityUrgent}
                      </span>
                    )}
                  </div>

                  <p className="fb-notif-body">{item.message}</p>

                  <div className="fb-notif-bottom">
                    <span className="fb-notif-timestamp">
                      {formatTime(item.timestamp)}
                    </span>
                    {item.targetView && (
                      <span className="fb-action-hint">
                        {t.notifications.viewDetails} →
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Area: Facebook Blue Dot or Close button */}
                <div className="fb-notif-right-action">
                  {!item.read && (
                    <span className="fb-blue-unread-dot" title="Unread" />
                  )}
                  <button
                    type="button"
                    className="fb-dismiss-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(item.id);
                    }}
                    title={t.notifications.dismiss}
                    aria-label={t.notifications.dismiss}
                  >
                    <X size={14} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notification-drawer-footer fb-drawer-footer">
            <button
              type="button"
              className="text-button small-text-btn"
              onClick={clearAll}
            >
              <Trash2 size={13} />
              <span>{t.notifications.clearAll}</span>
            </button>
          </div>
        )}
      </aside>

      {/* Broadcast Composer Modal */}
      <BroadcastComposerDialog />
    </>
  );
}
