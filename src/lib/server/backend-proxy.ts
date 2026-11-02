import type { NextRequest } from "next/server";
import { ENDPOINTS, isSameOrigin } from "./proxy-policy";
import { readBody } from "./proxy-request";
import {
  COOKIE_NAME,
  json,
  clearSession,
  upstreamResponse,
} from "./proxy-response";
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
  const rawBase =
    process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api/v1";
  const base = rawBase.replace(/\/+$/, "");
  const isLocalBase =
    /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?/i.test(base);

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
