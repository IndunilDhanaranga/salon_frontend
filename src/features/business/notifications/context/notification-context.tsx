"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Appointment, Order, PayrollRun, Tenant } from "@/lib/types";
import type { WorkspaceData } from "@/features/business/hooks/use-business-data";
import { useTranslation } from "@/lib/i18n";
import {
  registerCurrentDevice,
  playFacebookNotificationSound,
} from "@/lib/device-registry";
import type {
  BroadcastPayload,
  CurrentUser,
  InAppNotification,
  NotificationContextValue,
} from "../types";

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

type Props = {
  tenant: Tenant;
  currentUser?: CurrentUser;
  data?: WorkspaceData;
  onView?: (view: any) => void;
  children: React.ReactNode;
};

/**
 * Native Browser Web Push Notification
 */
function triggerBrowserPush(
  title: string,
  message: string,
  targetView?: string,
  onNavigateView?: (view: string) => void,
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const push = new Notification(title, {
      body: message,
      icon: "/icon.svg",
      tag: `salon-notif-${Date.now()}`,
    });

    push.onclick = () => {
      try {
        window.focus();
      } catch {
        // Window focus error fallback
      }
      if (targetView && onNavigateView) {
        onNavigateView(targetView);
      }
      push.close();
    };
  } catch {
    // Fallback if environment doesn't allow direct constructor invocation
  }
}

export function NotificationProvider({
  tenant,
  currentUser,
  data,
  onView,
  children,
}: Props) {
  const { language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [customNotifications, setCustomNotifications] = useState<
    InAppNotification[]
  >([]);
  const [broadcastNotifications, setBroadcastNotifications] = useState<
    InAppNotification[]
  >([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeToast, setActiveToast] = useState<InAppNotification | null>(
    null,
  );
  const [pushPermission, setPushPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");

  const personalStorageKey = currentUser?.id
    ? `salon_notif_${tenant.slug}_u_${currentUser.id}`
    : `salon_notif_${tenant.slug}`;
  const broadcastStorageKey = `salon_broadcasts_${tenant.slug}`;

  // Request browser push permission
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPushPermission("unsupported");
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      setPushPermission(result);
      registerCurrentDevice(currentUser, tenant.slug);
      if (result === "granted") {
        playFacebookNotificationSound();
        triggerBrowserPush(
          language === "si"
            ? "තල්ලු දැනුම්දීම් සක්‍රිය කරන ලදී"
            : "Push Notifications Enabled",
          language === "si"
            ? "ඔබට දැන් නව සැලෝන් පණිවිඩ සහ දැනුම්දීම් ක්ෂණිකව ලැබෙනු ඇත."
            : "You will now receive instant desktop and mobile push alerts.",
          undefined,
          onView,
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [currentUser, language, onView, tenant.slug]);

  // Check and automatically enable push notification on every device
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
      registerCurrentDevice(currentUser, tenant.slug);

      if (Notification.permission === "default") {
        // Attempt 1: Immediate auto-request
        void requestPushPermission();

        // Attempt 2: User gesture fallback (for mobile Chrome/Safari requirements)
        const autoPrompt = () => {
          void requestPushPermission();
          window.removeEventListener("click", autoPrompt);
          window.removeEventListener("touchstart", autoPrompt);
        };
        window.addEventListener("click", autoPrompt, {
          once: true,
          passive: true,
        });
        window.addEventListener("touchstart", autoPrompt, {
          once: true,
          passive: true,
        });
        return () => {
          window.removeEventListener("click", autoPrompt);
          window.removeEventListener("touchstart", autoPrompt);
        };
      }
    }
  }, [currentUser, requestPushPermission, tenant.slug]);

  // 1. Load persisted state: personal preferences + shared broadcasts
  useEffect(() => {
    try {
      const rawPersonal = localStorage.getItem(personalStorageKey);
      if (rawPersonal) {
        const parsed = JSON.parse(rawPersonal);
        if (Array.isArray(parsed.custom)) {
          setCustomNotifications(parsed.custom);
        }
        if (Array.isArray(parsed.read)) {
          setReadIds(new Set(parsed.read));
        }
        if (Array.isArray(parsed.dismissed)) {
          setDismissedIds(new Set(parsed.dismissed));
        }
      }

      const rawBroadcasts = localStorage.getItem(broadcastStorageKey);
      if (rawBroadcasts) {
        const parsedB = JSON.parse(rawBroadcasts);
        if (Array.isArray(parsedB)) {
          setBroadcastNotifications(parsedB);
        }
      }
    } catch {
      // Storage unavailable or invalid JSON
    }
  }, [personalStorageKey, broadcastStorageKey]);

  // Helper to persist personal state
  const persistPersonalState = useCallback(
    (
      custom: InAppNotification[],
      reads: Set<string>,
      dismissed: Set<string>,
    ) => {
      try {
        localStorage.setItem(
          personalStorageKey,
          JSON.stringify({
            custom,
            read: Array.from(reads),
            dismissed: Array.from(dismissed),
          }),
        );
      } catch {
        // Storage full or quota exceeded
      }
    },
    [personalStorageKey],
  );

  // 2. Real-Time Multi-Client Delivery: BroadcastChannel + storage events
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Handle cross-tab storage changes
    const handleStorage = (event: StorageEvent) => {
      if (event.key === broadcastStorageKey && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (Array.isArray(parsed)) {
            setBroadcastNotifications(parsed);
          }
        } catch {
          // Ignore invalid payload
        }
      } else if (
        event.key === "salon_platform_push_broadcast" &&
        event.newValue
      ) {
        try {
          const p = JSON.parse(event.newValue);
          if (p && p.title) {
            const notifItem: InAppNotification = {
              id: p.id || `push-${Date.now()}`,
              type: "system",
              title: p.title,
              message: p.message,
              timestamp: p.sentAt || new Date().toISOString(),
              read: false,
              sender: {
                name: p.sentBy || "Platform Admin",
                role: "Super Admin",
              },
              isBroadcast: true,
              priority: p.priority || "normal",
            };
            setBroadcastNotifications((prev) => {
              if (prev.some((item) => item.id === notifItem.id)) return prev;
              return [notifItem, ...prev];
            });
            playFacebookNotificationSound();
            triggerBrowserPush(
              notifItem.title,
              notifItem.message,
              undefined,
              onView,
            );
            setActiveToast(notifItem);
          }
        } catch {
          // Ignore payload parse error
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    // Handle real-time BroadcastChannel messages
    let channel: BroadcastChannel | null = null;
    let platformChannel: BroadcastChannel | null = null;

    if ("BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel(`salon_broadcast_${tenant.slug}`);
        channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === "BROADCAST_MESSAGE" && payload) {
            setBroadcastNotifications((prev) => {
              if (prev.some((item) => item.id === payload.id)) return prev;
              return [payload, ...prev];
            });

            // Trigger instant push and audio feedback for the received broadcast
            playFacebookNotificationSound();
            triggerBrowserPush(
              payload.title,
              payload.message,
              payload.targetView,
              onView,
            );
            setActiveToast(payload);
          }
        };

        platformChannel = new BroadcastChannel("salon_platform_push");
        platformChannel.onmessage = (event) => {
          const p = event.data;
          if (p && p.title) {
            const notifItem: InAppNotification = {
              id: p.id || `push-${Date.now()}`,
              type: "system",
              title: p.title,
              message: p.message,
              timestamp: p.sentAt || new Date().toISOString(),
              read: false,
              sender: {
                name: p.sentBy || "Platform Admin",
                role: "Super Admin",
              },
              isBroadcast: true,
              priority: p.priority || "normal",
            };
            setBroadcastNotifications((prev) => {
              if (prev.some((item) => item.id === notifItem.id)) return prev;
              return [notifItem, ...prev];
            });
            playFacebookNotificationSound();
            triggerBrowserPush(
              notifItem.title,
              notifItem.message,
              undefined,
              onView,
            );
            setActiveToast(notifItem);
          }
        };
      } catch {
        // BroadcastChannel creation error fallback
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
      }
      if (platformChannel) {
        platformChannel.close();
      }
    };
  }, [broadcastStorageKey, tenant.slug, onView]);

  // 2B. Central Server Broadcast Sync: Ensures iPhones, iPads, MacBooks, and remote PCs all receive alerts
  useEffect(() => {
    let lastSync = new Date(Date.now() - 60000).toISOString();

    const syncServerBroadcasts = async () => {
      try {
        const res = await fetch(
          `/api/notifications/broadcast?since=${encodeURIComponent(lastSync)}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.broadcasts) && json.broadcasts.length > 0) {
            lastSync = new Date().toISOString();
            json.broadcasts.forEach(
              (b: {
                id: string;
                title: string;
                message: string;
                sentAt: string;
                sentBy: string;
                priority?: "normal" | "urgent";
                category?: string;
                targetView?: string;
              }) => {
                const notifItem: InAppNotification = {
                  id: b.id,
                  type: (b.category as any) || "system",
                  title: b.title,
                  message: b.message,
                  timestamp: b.sentAt,
                  read: false,
                  sender: { name: b.sentBy, role: "Platform Broadcast" },
                  isBroadcast: true,
                  priority: b.priority || "normal",
                  targetView: b.targetView as any,
                };
                setBroadcastNotifications((prev) => {
                  if (prev.some((item) => item.id === notifItem.id))
                    return prev;
                  return [notifItem, ...prev];
                });
                playFacebookNotificationSound();
                triggerBrowserPush(
                  notifItem.title,
                  notifItem.message,
                  notifItem.targetView,
                  onView,
                );
                setActiveToast(notifItem);
              },
            );
          }
        }
      } catch {
        // Network sync silent fallback
      }
    };

    const interval = setInterval(syncServerBroadcasts, 8000);
    const onFocus = () => void syncServerBroadcasts();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [onView]);

  // 3. Generate smart operational notifications from live tenant business data
  const operationalNotifications = useMemo<InAppNotification[]>(() => {
    const list: InAppNotification[] = [];

    // A. Today's appointments
    if (data?.appointments && data.appointments.length > 0) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      data.appointments
        .filter(
          (apt: Appointment) =>
            apt.status !== "cancelled" &&
            apt.starts_at &&
            apt.starts_at.slice(0, 10) === todayStr,
        )
        .slice(0, 4)
        .forEach((apt: Appointment) => {
          const aptTime = new Intl.DateTimeFormat(
            language === "si" ? "si-LK" : "en",
            {
              timeZone: tenant.timezone,
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            },
          ).format(new Date(apt.starts_at));

          list.push({
            id: `apt-${apt.id}`,
            type: "appointment",
            title:
              language === "si"
                ? `අද දින වෙන්කිරීමක්: ${apt.customer_name}`
                : `Today's Booking: ${apt.customer_name}`,
            message: `${apt.service_name} · ${aptTime}${apt.staff_name ? ` · ${apt.staff_name}` : ""}`,
            timestamp: apt.starts_at,
            read: false,
            targetView: "appointments",
          });
        });
    }

    // B. Unpaid / pending customer bills
    const recentOrders: Order[] =
      (data as unknown as { orders?: Order[] })?.orders || [];
    if (recentOrders.length > 0) {
      recentOrders
        .filter((order: Order) => order.status !== "paid")
        .slice(0, 3)
        .forEach((order: Order) => {
          list.push({
            id: `bill-${order.id}`,
            type: "billing",
            title:
              language === "si"
                ? `නොගෙවූ බිල්පතක්: ${order.number}`
                : `Unpaid Bill: ${order.number}`,
            message:
              language === "si"
                ? `${order.customer_name} විසින් ගෙවීම් පියවීමට ඇත.`
                : `Pending payment for ${order.customer_name}.`,
            timestamp: order.created_at,
            read: false,
            targetView: "billing",
          });
        });
    }

    // C. Subscription status & trial alert
    if (tenant.subscription) {
      const sub = tenant.subscription;
      if (sub.status === "trialing" || sub.status === "active") {
        const endDate = new Date(sub.current_period_end);
        const daysLeft = Math.ceil(
          (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );

        if (daysLeft <= 14 && daysLeft >= 0) {
          list.push({
            id: `sub-trial-${sub.current_period_end.slice(0, 10)}`,
            type: "subscription",
            title:
              language === "si" ? "දායකත්ව කාලසීමාව" : "Subscription Period",
            message:
              language === "si"
                ? `ඔබගේ දායකත්ව කාලය අවසන් වීමට තව දින ${daysLeft}ක් ඉතිරිව ඇත.`
                : `${daysLeft} days remaining in your current subscription period.`,
            timestamp: new Date().toISOString(),
            read: false,
            targetView: "subscription",
          });
        }
      }
    }

    // D. Draft payroll review alerts
    if (data?.payroll && data.payroll.length > 0) {
      const drafts = data.payroll.filter(
        (p: PayrollRun) => p.status === "draft",
      );
      if (drafts.length > 0) {
        const latest = drafts[0];
        list.push({
          id: `payroll-${latest.id}`,
          type: "payroll",
          title:
            language === "si"
              ? "වැටුප් කෙටුම්පත සමාලෝචනය"
              : "Draft Payroll Pending",
          message:
            language === "si"
              ? `${latest.period_start.slice(0, 10)} සිට ${latest.period_end.slice(0, 10)} දක්වා වැටුප් සටහන අනුමත කිරීමට ඇත.`
              : `Payroll draft for ${latest.period_start.slice(0, 10)} to ${latest.period_end.slice(0, 10)} needs review.`,
          timestamp: latest.period_end || new Date().toISOString(),
          read: false,
          targetView: "payroll",
        });
      }
    }

    return list;
  }, [data, tenant, language]);

  // 4. Merged notifications: broadcasts + custom + operational, filtered by personal dismissed
  const notifications = useMemo<InAppNotification[]>(() => {
    const combined = [
      ...broadcastNotifications,
      ...customNotifications,
      ...operationalNotifications,
    ];
    return combined
      .filter((n) => !dismissedIds.has(n.id))
      .map((n) => ({
        ...n,
        read: n.read || readIds.has(n.id),
      }))
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [
    broadcastNotifications,
    customNotifications,
    operationalNotifications,
    readIds,
    dismissedIds,
  ]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  // 5. Action Handlers
  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const updated = new Set(prev).add(id);
        persistPersonalState(customNotifications, updated, dismissedIds);
        return updated;
      });
      setCustomNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    [customNotifications, dismissedIds, persistPersonalState],
  );

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    const updated = new Set([...readIds, ...allIds]);
    setReadIds(updated);
    setCustomNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    persistPersonalState(customNotifications, updated, dismissedIds);
  }, [
    notifications,
    readIds,
    customNotifications,
    dismissedIds,
    persistPersonalState,
  ]);

  const removeNotification = useCallback(
    (id: string) => {
      setDismissedIds((prev) => {
        const updated = new Set(prev).add(id);
        persistPersonalState(customNotifications, readIds, updated);
        return updated;
      });
      setCustomNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [customNotifications, readIds, persistPersonalState],
  );

  const clearAll = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    const updated = new Set([...dismissedIds, ...allIds]);
    setDismissedIds(updated);
    setCustomNotifications([]);
    persistPersonalState([], readIds, updated);
  }, [notifications, dismissedIds, readIds, persistPersonalState]);

  // Local notify (current client only)
  const notify = useCallback(
    (notifData: Omit<InAppNotification, "id" | "timestamp" | "read">) => {
      const newNotif: InAppNotification = {
        ...notifData,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setCustomNotifications((prev) => {
        const updated = [newNotif, ...prev];
        persistPersonalState(updated, readIds, dismissedIds);
        return updated;
      });

      playFacebookNotificationSound();
      triggerBrowserPush(
        newNotif.title,
        newNotif.message,
        newNotif.targetView,
        onView,
      );
      setActiveToast(newNotif);
    },
    [readIds, dismissedIds, persistPersonalState, onView],
  );

  // Broadcast message to EVERY user across the tenant
  const broadcastMessage = useCallback(
    (payload: BroadcastPayload) => {
      const newBroadcast: InAppNotification = {
        id: `bcast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: payload.type || "system",
        title: payload.title.trim(),
        message: payload.message.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        targetView: payload.targetView,
        sender: {
          name: currentUser?.name || "Salon Team",
          role: currentUser?.role || "Staff",
        },
        isBroadcast: true,
        audience: payload.audience || "all",
        priority: payload.priority || "normal",
      };

      // 1. Save to shared broadcasts in localStorage
      setBroadcastNotifications((prev) => {
        const updated = [newBroadcast, ...prev].slice(0, 40);
        try {
          localStorage.setItem(broadcastStorageKey, JSON.stringify(updated));
        } catch {
          // Storage full or quota exceeded
        }
        return updated;
      });

      // 2. Dispatch across active windows/tabs via BroadcastChannel
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const channel = new BroadcastChannel(
            `salon_broadcast_${tenant.slug}`,
          );
          channel.postMessage({
            type: "BROADCAST_MESSAGE",
            payload: newBroadcast,
          });
          channel.close();
        } catch {
          // BroadcastChannel fallback
        }
      }

      // 3. Post to central server API for cross-device delivery (iPhone, MacBook, Android)
      void fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newBroadcast.id,
          title: newBroadcast.title,
          message: newBroadcast.message,
          priority: newBroadcast.priority,
          category: newBroadcast.type,
          targetAudience: newBroadcast.audience,
          targetView: newBroadcast.targetView,
          sentBy: newBroadcast.sender?.name || "Salon Team",
        }),
      }).catch(() => {
        // Local fallback
      });

      // 4. Play Facebook chime and show toast on sender's device too
      playFacebookNotificationSound();
      triggerBrowserPush(
        newBroadcast.title,
        newBroadcast.message,
        newBroadcast.targetView,
        onView,
      );
      setActiveToast(newBroadcast);
      setIsComposeOpen(false);
    },
    [broadcastStorageKey, currentUser, tenant.slug, onView],
  );

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        setIsOpen,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        notify,
        broadcastMessage,
        pushPermission,
        requestPushPermission,
        isComposeOpen,
        setIsComposeOpen,
        activeToast,
        dismissToast,
        onNavigateView: onView,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
