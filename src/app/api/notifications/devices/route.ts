import { NextRequest, NextResponse } from "next/server";
import {
  getServerDevices,
  registerServerDevice,
  type ServerDeviceRecord,
} from "@/lib/server/notification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const devices = getServerDevices();
  return NextResponse.json({
    devices,
    stats: {
      total: devices.length,
      mobile: devices.filter((d) => d.deviceType === "Mobile").length,
      desktop: devices.filter((d) => d.deviceType === "Desktop").length,
      pushEnabled: devices.filter((d) => d.pushPermission === "granted").length,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ServerDeviceRecord>;
    if (!body || !body.id) {
      return NextResponse.json(
        { error: "Device ID is required." },
        { status: 400 },
      );
    }

    const device = registerServerDevice({
      id: body.id,
      browser: body.browser || "Browser",
      os: body.os || "OS",
      deviceType: body.deviceType || "Desktop",
      model: body.model || "Device",
      userEmail: body.userEmail,
      userName: body.userName,
      tenantSlug: body.tenantSlug,
      pushPermission: body.pushPermission || "default",
      registeredAt: body.registeredAt || new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, device });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to register device." },
      { status: 500 },
    );
  }
}
