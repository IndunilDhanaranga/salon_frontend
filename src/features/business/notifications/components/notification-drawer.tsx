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

  const getIcon = (item: InAppNotification) => {
    if (item.isBroadcast) {
      return <Megaphone size={16} />;
    }
    switch (item.type) {
      case "appointment":
        return <Calendar size={16} />;
      case "billing":
        return <Receipt size={16} />;
      case "payroll":
        return <Wallet size={16} />;
      case "subscription":
        return <Sparkles size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const formatTime = (timestamp: string) => {
    const diffSec = Math.max(
      0,
      Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000),
    );
    if (diffSec < 60) return t.notifications.justNow;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} ${t.notifications.minsAgo}`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ${t.notifications.hoursAgo}`;
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

      {/* Slide-out Drawer Panel */}
      <aside
        className="notification-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t.notifications.title}
      >
        {/* Header */}
        <div className="notification-drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-bell-icon">
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
              <span className="notification-unread-pill">
                {unreadCount} {t.notifications.unread.toLowerCase()}
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
          <div className="push-optin-card">
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

        {/* Filter Tabs */}
        <div className="notification-filter-tabs">
          <button
            type="button"
            className={`tab-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {t.notifications.all}
            <span className="count-tag">{notifications.length}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            {t.notifications.unread}
            {unreadCount > 0 && (
              <span className="count-tag unread">{unreadCount}</span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        <div className="notification-list-body">
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
                className={`notification-item ${item.read ? "is-read" : "is-unread"} ${item.priority === "urgent" ? "is-urgent" : ""} ${item.isBroadcast ? "is-broadcast" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <div
                  className={`notif-icon-badge ${item.isBroadcast ? "broadcast" : item.type}`}
                >
                  {getIcon(item)}
                </div>

                <div className="notif-content">
                  <div className="notif-top">
                    <div className="notif-title-row">
                      <h4 className="notif-title">{item.title}</h4>
                      {item.isBroadcast && (
                        <span className="notif-broadcast-tag">
                          {t.notifications.teamNotice}
                        </span>
                      )}
                      {item.priority === "urgent" && (
                        <span className="notif-urgent-tag">
                          <AlertTriangle size={10} />
                          {t.notifications.priorityUrgent}
                        </span>
                      )}
                    </div>
                    <span className="notif-time">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="notif-message">{item.message}</p>

                  {item.sender && (
                    <div className="notif-sender-info">
                      <span>{t.notifications.fromSender}: </span>
                      <strong>{item.sender.name}</strong>
                      {item.sender.role && ` (${item.sender.role})`}
                    </div>
                  )}

                  {item.targetView && (
                    <div className="notif-action-hint">
                      <span>{t.notifications.viewDetails}</span>
                      <ChevronRight size={13} />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="notif-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(item.id);
                  }}
                  title={t.notifications.dismiss}
                  aria-label={t.notifications.dismiss}
                >
                  <X size={14} />
                </button>
              </article>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notification-drawer-footer">
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
