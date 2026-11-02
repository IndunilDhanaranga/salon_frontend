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
  let upstream: Response;
  try {
    const base = (
      process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api/v1"
    ).replace(/\/+$/, "");
    upstream = await fetch(base + "/" + path + request.nextUrl.search, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    const response = json(
      {
        message:
          "The salon API is unavailable. Start the Laravel server and try again.",
      },
      502,
    );
    return path === "logout" ? clearSession(response) : response;
  }
  return upstreamResponse(upstream, path, endpoint.public === true);
}
