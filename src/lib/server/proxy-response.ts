import { NextResponse } from "next/server";
export const COOKIE_NAME = "salon_session";
export function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", Vary: "Cookie, X-Tenant" },
  });
}

export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function upstreamResponse(
  upstream: Response,
  path: string,
  publicEndpoint: boolean,
) {
  const payload: unknown = await upstream.json().catch(() => null);
  if (upstream.status >= 500 || (payload === null && upstream.status !== 204)) {
    const response = json(
      {
        message:
          "The salon API could not complete this request. Please try again.",
      },
      502,
    );
    return path === "logout" ? clearSession(response) : response;
  }

  if (publicEndpoint && upstream.ok) {
    if (
      !payload ||
      typeof payload !== "object" ||
      !("token" in payload) ||
      typeof payload.token !== "string" ||
      payload.token.length > 4096
    ) {
      return json(
        { message: "The sign-in response was incomplete. Please try again." },
        502,
      );
    }
    const { token: issuedToken, ...session } = payload;
    const response = json(session, upstream.status);
    response.cookies.set(COOKIE_NAME, issuedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return response;
  }

  if (!upstream.ok) {
    // Do not relay framework debug traces or internal server fields to browsers.
    const data =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    const errors: Record<string, string[]> = {};
    if (data.errors && typeof data.errors === "object") {
      for (const [key, value] of Object.entries(data.errors)) {
        if (Array.isArray(value))
          errors[key] = value.filter(
            (item): item is string => typeof item === "string",
          );
      }
    }
    const response = json(
      {
        message:
          typeof data.message === "string"
            ? data.message
            : "The request could not be completed.",
        ...(Object.keys(errors).length ? { errors } : {}),
      },
      upstream.status,
    );
    if (path === "logout" || upstream.status === 401) clearSession(response);
    return response;
  }

  const response =
    upstream.status === 204
      ? new NextResponse(null, {
          status: 204,
          headers: { "Cache-Control": "no-store", Vary: "Cookie, X-Tenant" },
        })
      : json(payload, upstream.status);
  if (path === "logout" || upstream.status === 401) clearSession(response);
  return response;
}
