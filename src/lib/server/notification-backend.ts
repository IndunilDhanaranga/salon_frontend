type Collection = "devices" | "broadcasts" | "subscriptions";

export function useNotificationBackend(): boolean {
  if (process.env.NOTIFICATION_STORE_TOKEN) return true;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NOTIFICATION_STORE_TOKEN is required for durable notification storage",
    );
  }
  return false;
}

/** Server-only transport. Never fall back to an ephemeral file on API failure. */
export async function notificationBackend<T>(
  collection: Collection,
  method = "GET",
  body?: object,
): Promise<T> {
  const base = (
    process.env.LARAVEL_API_URL || "http://127.0.0.1:8000/api/v1"
  ).replace(/\/+$/, "");
  const response = await fetch(
    `${base}/internal/notification-store/${collection}`,
    {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Notification-Store-Token":
          process.env.NOTIFICATION_STORE_TOKEN || "",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Notification database request failed (${response.status})`,
    );
  }
  return (await response.json()).data as T;
}
