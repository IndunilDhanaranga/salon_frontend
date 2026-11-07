import { NextRequest, NextResponse } from "next/server";
import {
  addServerBroadcast,
  getServerBroadcasts,
  getServerDevices,
  type ServerBroadcastMessage,
} from "@/lib/server/notification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get("since") || undefined;
  const broadcasts = getServerBroadcasts(since);
  return NextResponse.json({ broadcasts });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ServerBroadcastMessage>;
    if (!body || !body.title || !body.message) {
      return NextResponse.json(
        { error: "Title and message are required." },
        { status: 400 },
      );
    }

    const broadcast: ServerBroadcastMessage = {
      id:
        body.id ||
        `push-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: body.title.trim(),
      message: body.message.trim(),
      priority: body.priority || "normal",
      category: body.category || "system",
      targetAudience: body.targetAudience || "all",
      targetView: body.targetView,
      sentBy: body.sentBy || "Platform Admin",
      sentAt: new Date().toISOString(),
    };

    const saved = addServerBroadcast(broadcast);
    const devices = getServerDevices();

    return NextResponse.json({
      success: true,
      broadcast: saved,
      deliveredTo: Math.max(1, devices.length),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to broadcast notification." },
      { status: 500 },
    );
  }
}
