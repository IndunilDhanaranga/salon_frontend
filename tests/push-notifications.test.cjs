const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadSource(file, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      Response,
      console,
      Uint8Array,
      ...globals,
    },
  );
  return module.exports;
}

test("subscription success requires server acknowledgement, and retries reuse the endpoint", async () => {
  let status = 500;
  let creates = 0;
  const calls = [];
  const subscription = {
    endpoint: "https://push.test/phone",
    keys: { auth: "a", p256dh: "p" },
  };
  const registration = {
    pushManager: {
      getSubscription: async () => subscription,
      subscribe: async () => {
        creates++;
        return subscription;
      },
    },
  };
  const storage = new Map([["salon_device_id", "phone"]]);
  const notification = { permission: "granted" };
  const cache = new Map();
  const { subscribeToWebPush } = loadSource("src/lib/device-registry.ts", {
    process: { env: { NEXT_PUBLIC_VAPID_PUBLIC_KEY: "public-key" } },
    window: {
      isSecureContext: true,
      PushManager: {},
      Notification: notification,
      caches: {},
    },
    Notification: notification,
    navigator: {
      serviceWorker: {
        register: async () => registration,
        ready: Promise.resolve(registration),
        addEventListener() {},
      },
      userAgent: "Android Chrome",
      maxTouchPoints: 1,
    },
    localStorage: {
      getItem: (key) => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
    },
    caches: {
      open: async () => ({ put: async (key, value) => cache.set(key, value) }),
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: status === 200 };
    },
  });
  assert.equal(await subscribeToWebPush(), "pending");
  status = 200;
  assert.equal(await subscribeToWebPush(), "granted");
  assert.equal(creates, 0);
  assert.equal(JSON.parse(calls[0].options.body).deviceId, "phone");
  assert.equal(
    (await cache.get("/__salon-push-context").json()).deviceId,
    "phone",
  );
});

test("background renewal sends the saved device ID and retries failed synchronization", async () => {
  const handlers = {};
  const requests = [];
  const retries = [];
  let ok = false;
  const subscription = {
    toJSON: () => ({ endpoint: "https://push.test/renewed" }),
  };
  vm.runInNewContext(fs.readFileSync("public/sw.js", "utf8"), {
    self: {
      location: { origin: "https://salon.test" },
      addEventListener: (name, handler) => {
        handlers[name] = handler;
      },
      registration: {
        pushManager: { getSubscription: async () => subscription },
        sync: { register: async (tag) => retries.push(tag) },
      },
    },
    caches: {
      open: async () => ({
        match: async () => new Response(JSON.stringify({ deviceId: "phone" })),
      }),
    },
    fetch: async (url, options) => {
      requests.push(JSON.parse(options.body));
      return { ok };
    },
  });
  let completion;
  handlers.pushsubscriptionchange({
    waitUntil: (promise) => {
      completion = promise;
    },
  });
  await completion;
  assert.equal(requests[0].deviceId, "phone");
  assert.equal(requests[0].subscription.endpoint, "https://push.test/renewed");
  assert.deepEqual(retries, ["salon-push-resubscribe"]);
  ok = true;
  handlers.sync({
    tag: "salon-push-resubscribe",
    waitUntil: (promise) => {
      completion = promise;
    },
  });
  await completion;
  assert.equal(requests.length, 2);
});

test("production storage fails explicitly without durable storage configuration", () => {
  const { useNotificationBackend } = loadSource(
    "src/lib/server/notification-backend.ts",
    {
      process: { env: { NODE_ENV: "production" } },
    },
  );
  assert.throws(useNotificationBackend, /NOTIFICATION_STORE_TOKEN/);
});

test("backend storage outages do not silently save subscriptions to a temporary file", async () => {
  const { notificationBackend } = loadSource(
    "src/lib/server/notification-backend.ts",
    {
      process: { env: { NOTIFICATION_STORE_TOKEN: "private-test-token" } },
      AbortSignal,
      fetch: async (_url, options) => {
        assert.equal(
          options.headers["X-Notification-Store-Token"],
          "private-test-token",
        );
        return { ok: false, status: 503 };
      },
    },
  );
  await assert.rejects(notificationBackend("subscriptions", "POST", {}), /503/);
});
