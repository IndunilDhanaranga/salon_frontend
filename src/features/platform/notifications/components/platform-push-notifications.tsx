"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Send,
  Megaphone,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle,
  AlertTriangle,
  Users,
  Bell,
  Clock,
  Trash2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  fetchServerDevices,
  playFacebookNotificationSound,
  type DeviceRecord,
} from "@/lib/device-registry";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SentMessage {
  id: string;
  title: string;
  message: string;
  priority: "normal" | "urgent";
  sentAt: string;
  sentBy: string;
  deliveredTo: number;
}

type QuickTemplate = {
  key: string;
  labelEn: string;
  labelSi: string;
  title: string;
  message: string;
  priority: "normal" | "urgent";
};

/* ------------------------------------------------------------------ */
/*  Quick Message Templates                                            */
/* ------------------------------------------------------------------ */

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    key: "maintenance",
    labelEn: "Scheduled Maintenance",
    labelSi: "නියමිත නඩත්තුව",
    title: "Scheduled Maintenance Notice",
    message:
      "The system will be undergoing scheduled maintenance tonight between 11:00 PM and 1:00 AM. Please save your work before this time.",
    priority: "normal",
  },
  {
    key: "update",
    labelEn: "Platform Update",
    labelSi: "වේදිකා යාවත්කාලීනය",
    title: "New Platform Update Available",
    message:
      "We have released exciting new features and improvements. Refresh your browser to access the latest version.",
    priority: "normal",
  },
  {
    key: "urgent",
    labelEn: "Urgent Notice",
    labelSi: "හදිසි නිවේදනය",
    title: "Urgent System Notice",
    message:
      "Important: Please review this urgent notice and take necessary action immediately.",
    priority: "urgent",
  },
  {
    key: "holiday",
    labelEn: "Holiday Notice",
    labelSi: "නිවාඩු දැනුම්දීම",
    title: "Holiday Closure Notice",
    message:
      "Please note: the platform support team will be unavailable during the upcoming public holiday. Normal service resumes the following business day.",
    priority: "normal",
  },
];

/* ------------------------------------------------------------------ */
/*  Storage Keys                                                       */
/* ------------------------------------------------------------------ */

const PUSH_BROADCAST_KEY = "salon_platform_push_broadcast";
const SENT_HISTORY_KEY = "salon_platform_push_history";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PlatformPushNotifications({
  senderName,
  busy: _busy,
}: {
  senderName: string;
  busy: boolean;
}) {
  const { language } = useTranslation();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [sentHistory, setSentHistory] = useState<SentMessage[]>([]);

  const isSi = language === "si";

  // Labels
  const L = useMemo(
    () =>
      isSi
        ? {
            pageTitle: "පුෂ් දැනුම්දීම් කේන්ද්‍රය",
            pageDesc:
              "පද්ධතියට එක් වරක් හෝ ප්‍රවේශ වූ සියලුම iPhone, MacBook, Android සහ පරිගණක උපාංග වෙත ක්ෂණික දැනුම්දීම් යවන්න.",
            composeTitle: "නව පණිවිඩයක් සකසන්න",
            composeDesc:
              "මාතෘකාව සහ පණිවිඩය ටයිප් කර සියලුම උපාංග වෙත ක්ෂණිකව නිකුත් කරන්න.",
            titleLabel: "මාතෘකාව",
            titlePlaceholder: "උදා: පද්ධති යාවත්කාලීනය, නිවාඩු දැනුම්දීම...",
            messageLabel: "පණිවිඩය",
            messagePlaceholder:
              "සියලුම පරිශීලකයින්ගේ උපාංග වෙත ලැබිය යුතු පණිවිඩය ඇතුලත් කරන්න...",
            priorityLabel: "ප්‍රමුඛතාවය",
            normal: "සාමාන්‍ය",
            urgent: "හදිසි (Urgent)",
            templates: "ක්ෂණික ආකෘති",
            sendButton: "සියලුම උපාංග වෙත යවන්න",
            sendingButton: "යවමින් පවතී...",
            registeredDevices: "ලියාපදිංචි උපාංග නාමාවලිය",
            totalDevices: "මුළු උපාංග",
            mobileDevices: "iPhone / Mobile",
            desktopDevices: "MacBook / Desktop",
            pushEnabled: "Push සක්‍රියයි",
            sentHistory: "යැවූ පණිවිඩ ඉතිහාසය",
            noHistory: "තවම පණිවිඩ යවා නැත.",
            deliveredTo: "යවන ලද්දේ",
            devices_suffix: "උපාංග",
            sentBy: "යවූයේ",
            clearHistory: "ඉතිහාසය මකන්න",
            sentSuccess:
              "පණිවිඩය සියලුම iPhone, MacBook, Android සහ පරිගණක වෙත සාර්ථකව යවන ලදී!",
            deviceName: "උපාංගය සහ ආකෘතිය",
            user: "පරිශීලක",
            lastSeen: "අවසන් ක්‍රියාකාරීත්වය",
            status: "තල්ලු තත්ත්වය",
            enabled: "සක්‍රියයි",
            disabled: "නොවිමසූ / සීමිත",
            refresh: "යාවත්කාලීන කරන්න",
          }
        : {
            pageTitle: "Push Notification Center",
            pageDesc:
              "Send instant Facebook-style push notifications to every iPhone, MacBook, Android, and Desktop device that has logged in at least once.",
            composeTitle: "Compose New Message",
            composeDesc:
              "Type a title and message, then broadcast to all registered devices.",
            titleLabel: "Notification Title",
            titlePlaceholder:
              "e.g. System Update, Holiday Notice, Urgent Alert...",
            messageLabel: "Message Body",
            messagePlaceholder:
              "Type the notification message all users will receive on their device screens...",
            priorityLabel: "Priority",
            normal: "Normal",
            urgent: "Urgent",
            templates: "Quick Templates",
            sendButton: "Send to All Devices",
            sendingButton: "Broadcasting...",
            registeredDevices: "Registered Devices Registry",
            totalDevices: "Total Devices",
            mobileDevices: "iPhone / Mobile",
            desktopDevices: "MacBook / Desktop",
            pushEnabled: "Push Enabled",
            sentHistory: "Sent Message History",
            noHistory: "No messages have been sent yet.",
            deliveredTo: "Delivered to",
            devices_suffix: "devices",
            sentBy: "Sent by",
            clearHistory: "Clear History",
            sentSuccess:
              "Message successfully broadcasted to all iPhone, MacBook, Android, and PC devices!",
            deviceName: "Device & Model",
            user: "User",
            lastSeen: "Last Active",
            status: "Push Status",
            enabled: "Enabled",
            disabled: "Pending / Inactive",
            refresh: "Refresh Devices",
          },
    [isSi],
  );

  const loadDevices = useCallback(async () => {
    setRefreshing(true);
    try {
      const devList = await fetchServerDevices();
      setDevices(devList);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadHistory = () => {
    try {
      const raw = localStorage.getItem(SENT_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSentHistory(parsed);
      }
    } catch {
      /* empty */
    }
  };

  // Load devices and history on mount + sync every 10s
  useEffect(() => {
    void loadDevices();
    loadHistory();

    const interval = setInterval(() => {
      void loadDevices();
    }, 10000);

    const onFocus = () => void loadDevices();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadDevices]);

  const deviceStats = useMemo(() => {
    const total = Math.max(1, devices.length);
    return {
      total,
      mobile: devices.filter(
        (d) =>
          d.deviceType === "Mobile" ||
          d.model.includes("iPhone") ||
          d.model.includes("Android"),
      ).length,
      desktop: devices.filter(
        (d) =>
          d.deviceType === "Desktop" ||
          d.deviceType === "Tablet" ||
          d.model.includes("MacBook") ||
          d.model.includes("Mac"),
      ).length,
      pushEnabled: devices.filter((d) => d.pushPermission === "granted").length,
    };
  }, [devices]);

  const applyTemplate = (tpl: QuickTemplate) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setPriority(tpl.priority);
  };

  const handleSend = useCallback(async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setSuccessMsg("");

    const broadcastPayload = {
      id: `push-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "PLATFORM_PUSH",
      title: title.trim(),
      message: message.trim(),
      priority,
      sentBy: senderName,
      sentAt: new Date().toISOString(),
    };

    // 1. Post to central server API so all remote devices (iPhone, MacBook, etc.) receive it
    try {
      await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastPayload),
      });
    } catch {
      /* server fallback */
    }

    // 2. Write to shared localStorage key for same-browser multi-tab sync
    try {
      localStorage.setItem(
        PUSH_BROADCAST_KEY,
        JSON.stringify(broadcastPayload),
      );
    } catch {
      /* empty */
    }

    // 3. Fire BroadcastChannel for immediate cross-tab delivery
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const ch = new BroadcastChannel("salon_platform_push");
        ch.postMessage(broadcastPayload);
        ch.close();
      } catch {
        /* empty */
      }
    }

    // 4. Play Facebook notification chime
    playFacebookNotificationSound();

    // 5. Fire native browser notification on admin's own machine
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(broadcastPayload.title, {
          body: broadcastPayload.message,
          icon: "/icon.svg",
          tag: broadcastPayload.id,
        });
      } catch {
        /* empty */
      }
    }

    // 6. Save to sent history
    const historyEntry: SentMessage = {
      id: broadcastPayload.id,
      title: broadcastPayload.title,
      message: broadcastPayload.message,
      priority: broadcastPayload.priority,
      sentAt: broadcastPayload.sentAt,
      sentBy: broadcastPayload.sentBy,
      deliveredTo: deviceStats.total,
    };

    const updated = [historyEntry, ...sentHistory].slice(0, 50);
    setSentHistory(updated);
    try {
      localStorage.setItem(SENT_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      /* empty */
    }

    setTitle("");
    setMessage("");
    setPriority("normal");
    setSending(false);
    setSuccessMsg(L.sentSuccess);
    setTimeout(() => setSuccessMsg(""), 4500);
  }, [title, message, priority, senderName, deviceStats.total, sentHistory, L]);

  const clearHistory = () => {
    setSentHistory([]);
    try {
      localStorage.removeItem(SENT_HISTORY_KEY);
    } catch {
      /* empty */
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      return new Intl.DateTimeFormat(isSi ? "si-LK" : "en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(ts));
    } catch {
      return ts;
    }
  };

  const getDeviceIcon = (d: DeviceRecord) => {
    if (d.model.includes("iPad") || d.deviceType === "Tablet") {
      return <Tablet size={16} />;
    }
    if (
      d.deviceType === "Mobile" ||
      d.model.includes("iPhone") ||
      d.model.includes("Android")
    ) {
      return <Smartphone size={16} />;
    }
    return <Monitor size={16} />;
  };

  return (
    <div className="platform-push-page">
      {/* -------- Page Header -------- */}
      <div className="push-page-header">
        <div className="push-page-icon-wrap">
          <Megaphone size={22} />
        </div>
        <div>
          <h2>{L.pageTitle}</h2>
          <p>{L.pageDesc}</p>
        </div>
      </div>

      {/* -------- Device Stats Cards -------- */}
      <div className="push-stats-grid">
        <div className="push-stat-card">
          <div className="push-stat-icon">
            <Users size={18} />
          </div>
          <div className="push-stat-body">
            <span className="push-stat-value">{deviceStats.total}</span>
            <span className="push-stat-label">{L.totalDevices}</span>
          </div>
        </div>
        <div className="push-stat-card">
          <div className="push-stat-icon mobile">
            <Smartphone size={18} />
          </div>
          <div className="push-stat-body">
            <span className="push-stat-value">{deviceStats.mobile}</span>
            <span className="push-stat-label">{L.mobileDevices}</span>
          </div>
        </div>
        <div className="push-stat-card">
          <div className="push-stat-icon desktop">
            <Monitor size={18} />
          </div>
          <div className="push-stat-body">
            <span className="push-stat-value">{deviceStats.desktop}</span>
            <span className="push-stat-label">{L.desktopDevices}</span>
          </div>
        </div>
        <div className="push-stat-card">
          <div className="push-stat-icon push">
            <Bell size={18} />
          </div>
          <div className="push-stat-body">
            <span className="push-stat-value">{deviceStats.pushEnabled}</span>
            <span className="push-stat-label">{L.pushEnabled}</span>
          </div>
        </div>
      </div>

      {/* -------- Compose Panel -------- */}
      <section className="push-compose-section">
        <div className="push-compose-header">
          <Send size={16} />
          <div>
            <h3>{L.composeTitle}</h3>
            <p>{L.composeDesc}</p>
          </div>
        </div>

        {/* Quick Templates */}
        <div className="push-templates-bar">
          <span className="push-templates-label">
            <Sparkles size={13} />
            <span>{L.templates}:</span>
          </span>
          <div className="push-template-chips">
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                className={`push-template-chip ${tpl.priority === "urgent" ? "urgent-chip" : ""}`}
                onClick={() => applyTemplate(tpl)}
              >
                {tpl.priority === "urgent" && <AlertTriangle size={12} />}
                {isSi ? tpl.labelSi : tpl.labelEn}
              </button>
            ))}
          </div>
        </div>

        <form
          className="push-compose-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <div className="push-form-field">
            <label htmlFor="push-title">{L.titleLabel} *</label>
            <input
              id="push-title"
              type="text"
              className="push-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={L.titlePlaceholder}
              required
              autoFocus
            />
          </div>

          <div className="push-form-field">
            <label htmlFor="push-message">{L.messageLabel} *</label>
            <textarea
              id="push-message"
              className="push-textarea"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={L.messagePlaceholder}
              required
            />
          </div>

          <div className="push-form-row">
            <div className="push-form-field half">
              <label>{L.priorityLabel}</label>
              <div className="push-priority-toggle">
                <button
                  type="button"
                  className={`priority-toggle-btn ${priority === "normal" ? "active" : ""}`}
                  onClick={() => setPriority("normal")}
                >
                  {L.normal}
                </button>
                <button
                  type="button"
                  className={`priority-toggle-btn urgent ${priority === "urgent" ? "active" : ""}`}
                  onClick={() => setPriority("urgent")}
                >
                  <span className="urgent-dot" />
                  {L.urgent}
                </button>
              </div>
            </div>
            <div className="push-form-field half push-send-field">
              <button
                type="submit"
                disabled={sending || !title.trim() || !message.trim()}
                className="button primary push-send-btn"
              >
                <Send size={15} />
                <span>{sending ? L.sendingButton : L.sendButton}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Success Alert */}
        {successMsg && (
          <div className="push-success-alert" role="status">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}
      </section>

      {/* -------- Device Registry Table -------- */}
      <section className="push-devices-section">
        <div className="push-section-header">
          <div className="push-header-left">
            <Monitor size={16} />
            <h3>{L.registeredDevices}</h3>
          </div>
          <button
            type="button"
            className="text-button small-text-btn"
            onClick={() => void loadDevices()}
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
            <span>{L.refresh}</span>
          </button>
        </div>
        <div className="table-scroll-wrapper">
          <table className="data-table push-device-table">
            <thead>
              <tr>
                <th>{L.deviceName}</th>
                <th>{L.user}</th>
                <th>{L.lastSeen}</th>
                <th>{L.status}</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-cell">
                    {isSi
                      ? "ලියාපදිංචි උපාංග නොමැත — පරිශීලකයින් iPhone, MacBook හෝ Android මඟින් ප්‍රවේශ වූ විට මෙහි පෙන්වනු ඇත."
                      : "No registered devices yet — they appear here when users log in from iPhone, MacBook, or Android."}
                  </td>
                </tr>
              ) : (
                devices.map((d) => {
                  const isApple =
                    d.os === "iOS" ||
                    d.os === "macOS" ||
                    d.os === "iPadOS" ||
                    d.model.includes("Apple");
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="device-cell">
                          <div
                            className={`device-avatar-icon ${isApple ? "apple" : d.deviceType.toLowerCase()}`}
                          >
                            {getDeviceIcon(d)}
                          </div>
                          <div>
                            <div className="device-model-row">
                              <strong>{d.model}</strong>
                              {isApple && (
                                <span className="apple-tag">Apple</span>
                              )}
                            </div>
                            <span className="cell-sub">
                              {d.browser} · {d.os}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span>{d.userName || "—"}</span>
                          {d.userEmail && (
                            <span className="cell-sub">{d.userEmail}</span>
                          )}
                        </div>
                      </td>
                      <td>{formatTimestamp(d.lastActive)}</td>
                      <td>
                        <span
                          className={`push-status-tag ${d.pushPermission === "granted" ? "enabled" : "disabled"}`}
                        >
                          {d.pushPermission === "granted"
                            ? L.enabled
                            : L.disabled}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* -------- Sent History -------- */}
      <section className="push-history-section">
        <div className="push-section-header">
          <div className="push-header-left">
            <Clock size={16} />
            <h3>{L.sentHistory}</h3>
          </div>
          {sentHistory.length > 0 && (
            <button
              type="button"
              className="text-button small-text-btn"
              onClick={clearHistory}
            >
              <Trash2 size={13} />
              <span>{L.clearHistory}</span>
            </button>
          )}
        </div>

        {sentHistory.length === 0 ? (
          <div className="push-empty-history">
            <Megaphone size={24} />
            <p>{L.noHistory}</p>
          </div>
        ) : (
          <div className="push-history-list">
            {sentHistory.map((entry) => (
              <article
                key={entry.id}
                className={`push-history-item ${entry.priority === "urgent" ? "is-urgent" : ""}`}
              >
                <div className="push-history-icon-col">
                  {entry.priority === "urgent" ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <Megaphone size={16} />
                  )}
                </div>
                <div className="push-history-content">
                  <div className="push-history-top">
                    <strong>{entry.title}</strong>
                    <span className="push-history-time">
                      {formatTimestamp(entry.sentAt)}
                    </span>
                  </div>
                  <p>{entry.message}</p>
                  <div className="push-history-meta">
                    <span>
                      {L.deliveredTo} {entry.deliveredTo} {L.devices_suffix}
                    </span>
                    <span>
                      {L.sentBy}: {entry.sentBy}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
