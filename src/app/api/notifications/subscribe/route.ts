import { NextRequest, NextResponse } from "next/server";
import {
  addPushSubscription,
  removePushSubscription,
  getPushSubscriptions,
} from "@/lib/server/notification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: Return current subscription count (admin info) */
export async function GET() {
  const subs = getPushSubscriptions();
  return NextResponse.json({ count: subs.length });
}

/** POST: Register or remove a Web Push subscription */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, deviceId, action } = body as {
      subscription?: object;
      deviceId?: string;
      action?: "subscribe" | "unsubscribe" | "resubscribe";
    };

    if (action === "unsubscribe" && deviceId) {
      removePushSubscription(deviceId);
      return NextResponse.json({ success: true, action: "unsubscribed" });
    }

    if (!subscription || !deviceId) {
      return NextResponse.json(
        { error: "subscription and deviceId are required" },
        { status: 400 },
      );
    }

    addPushSubscription(deviceId, subscription);
    return NextResponse.json({
      success: true,
      action: action === "resubscribe" ? "resubscribed" : "subscribed",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 },
    );
  }
}
