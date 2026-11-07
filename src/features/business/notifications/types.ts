export type NotificationType =
  "appointment" | "billing" | "payroll" | "subscription" | "system";

export type InAppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO 8601 string
  read: boolean;
  targetView?:
    | "appointments"
    | "billing"
    | "payroll"
    | "subscription"
    | "overview"
    | "catalog"
    | "branches"
    | "team";
  actionLabel?: string;
  sender?: {
    name: string;
    role?: string;
  };
  isBroadcast?: boolean;
  audience?: string;
  priority?: "normal" | "urgent";
};

export type BroadcastPayload = {
  title: string;
  message: string;
  type?: NotificationType;
  targetView?: InAppNotification["targetView"];
  audience?: string;
  priority?: "normal" | "urgent";
};

export type CurrentUser = {
  id: string;
  name: string;
  email?: string;
  role?: string;
};

export type NotificationContextValue = {
  notifications: InAppNotification[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  notify: (
    notification: Omit<InAppNotification, "id" | "timestamp" | "read">,
  ) => void;
  broadcastMessage: (data: BroadcastPayload) => void;
  pushPermission: NotificationPermission | "unsupported";
  requestPushPermission: () => Promise<boolean>;
  isComposeOpen: boolean;
  setIsComposeOpen: (open: boolean) => void;
  activeToast: InAppNotification | null;
  dismissToast: () => void;
  onNavigateView?: (view: string) => void;
};
