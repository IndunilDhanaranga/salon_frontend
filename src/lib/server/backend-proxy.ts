import type { NextRequest } from "next/server";
import { ENDPOINTS, isSameOrigin } from "./proxy-policy";
import { readBody } from "./proxy-request";
import {
  COOKIE_NAME,
  json,
  clearSession,
  upstreamResponse,
} from "./proxy-response";
import {
  getStoredRenewals,
  addStoredRenewal,
  updateStoredRenewal,
} from "./renewal-store";
import {
  getStoredPaymentSettings,
  setStoredPaymentSettings,
} from "./platform-settings-store";
type RouteContext = { params: Promise<{ path: string[] }> };

export async function handleBackend(
  request: NextRequest,
  context: RouteContext,
) {
  const { path: segments } = await context.params;
  const path = segments.join("/");
  const endpoint = ENDPOINTS.find(({ pattern }) => pattern.test(path));
  if (!endpoint) return json({ message: "API resource not found." }, 404);
  if (!endpoint.methods.includes(request.method)) {
    const response = json({ message: "Method not allowed." }, 405);
    response.headers.set("Allow", endpoint.methods.join(", "));
    return response;
  }
  if (request.method !== "GET") {
    if (!isSameOrigin(request))
      return json(
        { message: "This request must come from the salon application." },
        403,
      );
    if (
      request.headers
        .get("content-type")
        ?.split(";", 1)[0]
        .trim()
        .toLowerCase() !== "application/json"
    )
      return json({ message: "Send an application/json request." }, 415);
  }
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!endpoint.public && !token)
    return clearSession(json({ message: "Please sign in to continue." }, 401));
  const tenant = request.headers.get("x-tenant");
  if (
    endpoint.tenant &&
    (!tenant || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenant))
  )
    return json({ message: "Select a salon to continue." }, 400);
  let body: string | undefined;
  if (request.method !== "GET") {
    try {
      const value: unknown = JSON.parse((await readBody(request)) || "{}");
      if (!value || typeof value !== "object" || Array.isArray(value))
        return json({ message: "Send a JSON object." }, 400);
      body = JSON.stringify(value);
    } catch (error) {
      return json(
        {
          message:
            error instanceof RangeError
              ? error.message
              : "Request JSON is invalid.",
        },
        error instanceof RangeError ? 413 : 400,
      );
    }
  }
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token && !endpoint.public)
    headers.set("Authorization", "Bearer " + token);
  if (tenant && endpoint.tenant) headers.set("X-Tenant", tenant);
  const branch = request.headers.get("x-branch");
  if (branch) headers.set("X-Branch", branch);
  const rawBase = process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api/v1";
  const base = rawBase.replace(/\/+$/, "");
  const isLocalBase = /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?/i.test(
    base,
  );

  if (process.env.VERCEL && isLocalBase) {
    console.error(
      `[Backend Proxy Configuration Error] Running in production on Vercel but LARAVEL_API_URL is set to "${rawBase}". Vercel serverless functions cannot connect to localhost. Please set LARAVEL_API_URL in Vercel project settings to your public live Laravel API URL (e.g. on Railway, Render, VPS, or ngrok).`,
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(base + "/" + path + request.nextUrl.search, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    // Offline / Standalone Renewal Fallback
    if (path === "admin/payment-settings" && request.method === "GET") {
      return json(getStoredPaymentSettings(), 200);
    }
    if (path === "admin/payment-settings" && request.method === "PATCH") {
      try {
        const parsed = body ? JSON.parse(body) : {};
        return json(
          {
            data: setStoredPaymentSettings(parsed),
            message: "Payment settings updated successfully.",
          },
          200,
        );
      } catch {
        // Fall through
      }
    }
    if (path === "admin/renewals" && request.method === "GET") {
      return json({ data: getStoredRenewals() }, 200);
    }
    if (path.startsWith("admin/renewals/") && request.method === "PATCH") {
      const renewalId = path.split("/")[2];
      try {
        const bodyObj = body ? JSON.parse(body) : {};
        const updated = updateStoredRenewal(renewalId, {
          status: bodyObj.status,
          review_notes: bodyObj.review_notes,
          reviewed_at: new Date().toISOString(),
        });
        return json(
          {
            data: updated,
            message:
              bodyObj.status === "approved"
                ? "The renewal request was approved."
                : "The renewal request was rejected.",
          },
          200,
        );
      } catch {
        // Fall through
      }
    }
    if (path === "subscription/renewal" && request.method === "POST") {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const saved = addStoredRenewal({
          tenant_id: tenant || "demo-tenant",
          ...parsed,
        });
        return json(
          {
            data: saved,
            message: "Your renewal request has been submitted successfully.",
          },
          201,
        );
      } catch {
        // Fall through
      }
    }
    if (path === "subscription/renewals" && request.method === "GET") {
      return json({ data: getStoredRenewals(tenant || undefined) }, 200);
    }

    console.error(
      `[Backend Proxy Error] Failed to reach Laravel API at "${base}/${path}":`,
      error instanceof Error ? error.message : error,
    );
    const message =
      process.env.VERCEL && isLocalBase
        ? `The salon API is unreachable. LARAVEL_API_URL is currently pointing to localhost (${rawBase}) on Vercel. Please set your live public Laravel API URL in Vercel Environment Variables.`
        : "The salon API is unavailable. Start the Laravel server and try again.";
    const response = json({ message }, 502);
    return path === "logout" ? clearSession(response) : response;
  }
  return upstreamResponse(upstream, path, endpoint.public === true);
}
