import type { NextRequest } from "next/server";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const ENDPOINTS: Array<{
  pattern: RegExp;
  methods: string[];
  public?: boolean;
  tenant?: boolean;
}> = [
  { pattern: /^(login|register)$/, methods: ["POST"], public: true },
  { pattern: /^me$/, methods: ["GET"] },
  { pattern: /^logout$/, methods: ["POST"] },
  { pattern: /^admin\/(dashboard|reports)$/, methods: ["GET"] },
  { pattern: /^admin\/plans$/, methods: ["GET", "POST"] },
  { pattern: new RegExp(`^admin/plans/${UUID}$`, "i"), methods: ["PATCH"] },
  {
    pattern: new RegExp(`^admin/tenants/${UUID}/subscription$`, "i"),
    methods: ["GET", "PATCH"],
  },
  {
    pattern: new RegExp(`^admin/tenants/${UUID}/subscription/trial$`, "i"),
    methods: ["POST"],
  },
  { pattern: new RegExp(`^admin/tenants/${UUID}$`, "i"), methods: ["PATCH"] },
  { pattern: /^admin\/access$/, methods: ["GET"] },
  { pattern: /^admin\/access\/roles$/, methods: ["POST"] },
  {
    pattern: new RegExp(`^admin/access/roles/${UUID}$`, "i"),
    methods: ["PATCH", "DELETE"],
  },
  {
    pattern: new RegExp(`^admin/users/${UUID}/role$`, "i"),
    methods: ["PATCH"],
  },
  { pattern: /^subscription$/, methods: ["GET"], tenant: true },
  { pattern: /^(dashboard|reports)$/, methods: ["GET"], tenant: true },
  {
    pattern: /^(appointment-options|order-options)$/,
    methods: ["GET"],
    tenant: true,
  },
  { pattern: /^access$/, methods: ["GET"], tenant: true },
  { pattern: /^access\/(roles|members)$/, methods: ["POST"], tenant: true },
  {
    pattern: new RegExp(`^access/(roles|members)/${UUID}$`, "i"),
    methods: ["PATCH", "DELETE"],
    tenant: true,
  },
  {
    pattern: /^(staff|appointments|payroll|catalog|orders|deductions|deduction-options)$/,
    methods: ["GET", "POST"],
    tenant: true,
  },
  {
    pattern: new RegExp(`^deductions/${UUID}$`, "i"),
    methods: ["DELETE"],
    tenant: true,
  },
  {
    pattern: new RegExp(`^(staff|appointments|catalog)/${UUID}$`, "i"),
    methods: ["PATCH"],
    tenant: true,
  },
  {
    pattern: new RegExp(`^orders/${UUID}$`, "i"),
    methods: ["GET", "PATCH"],
    tenant: true,
  },
];

export function isSameOrigin(request: NextRequest) {
  const rawOrigin = request.headers.get("origin");
  if (!rawOrigin) return false;
  try {
    const origin = new URL(rawOrigin);
    const host = request.headers.get("host");
    const expected = process.env.APP_ORIGIN
      ? new URL(process.env.APP_ORIGIN)
      : host
        ? new URL(request.nextUrl.protocol + "//" + host)
        : null;
    return (
      !!expected &&
      ["http:", "https:"].includes(origin.protocol) &&
      origin.origin === rawOrigin &&
      origin.origin === expected.origin &&
      expected.pathname === "/" &&
      !expected.username &&
      !expected.password
    );
  } catch {
    return false;
  }
}
