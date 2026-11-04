const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadSource(file, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    output,
    {
      exports: module.exports,
      module,
      URL,
      URLSearchParams,
      Headers,
      DOMException,
      Date,
      process: { env: {} },
      ...globals,
    },
    { filename: file },
  );
  return module.exports;
}

const tenant = {
  status: "active",
  permissions: [
    "dashboard.view",
    "orders.view",
    "orders.manage",
    "payroll.view",
    "payroll.manage",
  ],
  subscription: {
    status: "active",
    access_allowed: true,
    current_period_end: "2099-01-01T00:00:00Z",
    features: ["orders", "payroll"],
  },
};

test("permission and subscription entitlements both apply", () => {
  const { canPermission } = loadSource("src/lib/access.ts");
  assert.equal(canPermission(tenant, "orders.manage"), true);
  assert.equal(canPermission(tenant, "staff.manage"), false);
  assert.equal(
    canPermission(
      { ...tenant, subscription: { ...tenant.subscription, features: [] } },
      "orders.manage",
    ),
    false,
  );
  assert.equal(
    canPermission({ ...tenant, status: "suspended" }, "orders.manage"),
    false,
  );
  assert.equal(
    canPermission(
      { ...tenant, permissions: ["branches.manage"] },
      "branches.manage",
    ),
    false,
  );
});

test("first branch setup locks normal actions but allows one location on a basic plan", () => {
  const { canPermission, canSetUpFirstBranch } =
    loadSource("src/lib/access.ts");
  const pending = {
    ...tenant,
    needs_branch_setup: true,
    has_all_branches_access: true,
    permissions: [...tenant.permissions, "branches.manage"],
  };
  assert.equal(canPermission(pending, "dashboard.view"), false);
  assert.equal(canPermission(pending, "orders.manage"), false);
  assert.equal(canPermission(pending, "branches.manage"), false);
  assert.equal(canSetUpFirstBranch(pending), true);
  assert.equal(
    canSetUpFirstBranch({ ...pending, permissions: ["dashboard.view"] }),
    false,
  );
  assert.equal(
    canSetUpFirstBranch({ ...pending, has_all_branches_access: false }),
    false,
  );
  assert.equal(canSetUpFirstBranch({ ...pending, status: "suspended" }), false);
  assert.equal(
    canSetUpFirstBranch({ ...pending, needs_branch_setup: false }),
    false,
  );
  assert.equal(
    canPermission({ ...pending, needs_branch_setup: false }, "orders.manage"),
    true,
  );
});

test("branch-limited users cannot view business-wide payroll or manage access", () => {
  const { canPermission } = loadSource("src/lib/access.ts");
  assert.equal(
    canPermission(
      { ...tenant, has_all_branches_access: false },
      "payroll.view",
    ),
    false,
  );
  assert.equal(
    canPermission({ ...tenant, has_all_branches_access: true }, "payroll.view"),
    true,
  );
  assert.equal(
    canPermission(
      {
        ...tenant,
        permissions: ["access.manage"],
        has_all_branches_access: false,
      },
      "access.manage",
    ),
    false,
  );
});

test("platform roles start on an authorized page", () => {
  const { availablePlatformTab } = loadSource(
    "src/features/platform/platform-access.ts",
  );
  assert.equal(
    availablePlatformTab(
      "dashboard",
      (permission) => permission === "platform.plans.view",
    ),
    "plans",
  );
  assert.equal(
    availablePlatformTab(
      "reports",
      (permission) => permission === "platform.access.manage",
    ),
    "access",
  );
  assert.equal(
    availablePlatformTab("dashboard", () => false),
    undefined,
  );
});

test("expired subscriptions hide operational actions", () => {
  const { canPermission, subscriptionStatusLabel } =
    loadSource("src/lib/access.ts");
  const subscription = {
    ...tenant.subscription,
    current_period_end: "2000-01-01T00:00:00Z",
  };
  assert.equal(
    canPermission({ ...tenant, subscription }, "orders.manage"),
    false,
  );
  assert.equal(subscriptionStatusLabel(subscription), "Expired");
});

test("the bridge checks actual request host and rejects foreign origins", () => {
  const { isSameOrigin } = loadSource("src/lib/server/proxy-policy.ts");
  const request = (origin, host) => ({
    headers: new Headers({ origin, host }),
    nextUrl: new URL("http://localhost:3000/api/backend/login"),
  });
  assert.equal(
    isSameOrigin(request("http://127.0.0.1:3000", "127.0.0.1:3000")),
    true,
  );
  assert.equal(
    isSameOrigin(request("https://foreign.example", "127.0.0.1:3000")),
    false,
  );
  assert.equal(isSameOrigin(request("null", "127.0.0.1:3000")), false);
  assert.equal(
    isSameOrigin(request("http://127.0.0.1:3000/path", "127.0.0.1:3000")),
    false,
  );
});

test("option endpoints remain read-only and unknown routes are refused", () => {
  const { ENDPOINTS } = loadSource("src/lib/server/proxy-policy.ts");
  assert.equal(
    ENDPOINTS.find((endpoint) =>
      endpoint.pattern.test("deduction-options"),
    ).methods.join(","),
    "GET",
  );
  assert.equal(
    ENDPOINTS.some((endpoint) => endpoint.pattern.test("admin/arbitrary")),
    false,
  );
});

test("API client sends branch selection, query filters and JSON mutations", async () => {
  const calls = [];
  const { api } = loadSource("src/lib/api.ts", {
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    },
  });
  await api("orders", {
    tenant: "studio-one",
    branch: "all",
    params: { range: "month" },
  });
  assert.equal(calls[0].options.headers.get("X-Tenant"), "studio-one");
  assert.equal(calls[0].options.headers.get("X-Branch"), "all");
  assert.equal(calls[0].url, "/api/backend/orders?range=month");
  await api("logout", { method: "POST" });
  assert.equal(calls[1].options.body, "{}");
  await assert.rejects(
    api("orders", { body: { unexpected: true } }),
    /GET requests cannot/,
  );
});

test("204 responses work and validation messages remain useful", async () => {
  const empty = loadSource("src/lib/api.ts", {
    fetch: async () => ({ ok: true, status: 204, json: async () => null }),
  });
  assert.equal(await empty.api("logout", { method: "POST" }), undefined);
  const validation = loadSource("src/lib/api.ts", {
    fetch: async () => ({
      ok: false,
      status: 422,
      json: async () => ({
        message: "Invalid input",
        errors: { branch_id: ["Choose an authorized branch."] },
      }),
    }),
  });
  await assert.rejects(
    validation.api("staff", { method: "POST", body: {} }),
    /Choose an authorized branch/,
  );
});

test("salon palette core text and actions meet AA contrast", () => {
  const css = fs.readFileSync("src/styles/salon-theme.css", "utf8");
  const values = Object.fromEntries(
    [...css.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})/gi)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  const luminance = (hex) => {
    const rgb = hex
      .slice(1)
      .match(/../g)
      .map((value) => parseInt(value, 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  for (const [foreground, background] of [
    [values["--ink"], values["--canvas"]],
    [values["--muted"], values["--surface"]],
    [values["--action-ink"], values["--action"]],
    [values["--sidebar-text"], values["--pine-deep"]],
    [values["--action-ink"], values["--action-hover"]],
    [values["--accent-ink"], values["--accent"]],
    [values["--success-ink"], values["--success-surface"]],
    [values["--warning-ink"], values["--warning-surface"]],
    [values["--danger"], values["--danger-bg"]],
  ]) {
    const first = luminance(foreground),
      second = luminance(background);
    assert.ok(
      (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05) >=
        4.5,
      `${foreground} on ${background}`,
    );
  }
});
