// Run once after deploying the Laravel migration and shared server secret.
// Existing database records win so an old file cannot replace a renewed endpoint.
require("@next/env").loadEnvConfig(process.cwd());
const fs = require("node:fs");

async function main() {
  const token = process.env.NOTIFICATION_STORE_TOKEN;
  if (!token) throw new Error("Configure NOTIFICATION_STORE_TOKEN first");
  const base = (
    process.env.LARAVEL_API_URL || "http://127.0.0.1:8000/api/v1"
  ).replace(/\/+$/, "");
  const source = JSON.parse(
    fs.readFileSync(
      process.argv[2] || ".device-notifications-store.json",
      "utf8",
    ),
  );
  async function request(collection, body) {
    const response = await fetch(
      `${base}/internal/notification-store/${collection}`,
      {
        method: body ? "POST" : "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Notification-Store-Token": token,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      },
    );
    if (!response.ok)
      throw new Error(
        `Import ${collection} failed (${response.status}); deploy the backend and configure its secret first`,
      );
    return (await response.json()).data;
  }
  for (const [collection, field, keyField] of [
    ["devices", "devices", "id"],
    ["broadcasts", "broadcasts", "id"],
    ["subscriptions", "pushSubscriptions", "deviceId"],
  ]) {
    const existing = new Set(
      (await request(collection)).map((record) => record[keyField]),
    );
    let imported = 0;
    for (const value of source[field] || []) {
      const key = value[keyField];
      if (!key || existing.has(key)) continue;
      // Atomic insert-only import also protects renewals racing this import.
      await request(collection, { key, value, insertOnly: true });
      imported++;
    }
    console.log(
      `${collection}: imported ${imported}, kept existing database records`,
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
