type ValidationErrors = Record<string, string[]>;

export interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  tenant?: string;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errors: ValidationErrors;

  constructor(message: string, status: number, errors: ValidationErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/** Same-origin requests only: Laravel access tokens never reach client JavaScript. */
export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const [pathname, inlineQuery] = path.replace(/^\/+/, "").split("?", 2);
  const resource = pathname;
  if (!/^[a-z0-9/-]+$/i.test(resource) || resource.includes("..")) {
    throw new ApiError("Invalid API resource.", 400);
  }

  const searchParams = new URLSearchParams(inlineQuery || "");
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
  }
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const method = options.method ?? "GET";
  if (method === "GET" && options.body !== undefined) {
    throw new ApiError("GET requests cannot include a body.", 400);
  }
  // A consistent JSON mutation contract also covers logout and DELETE requests
  // that have no input fields, without repeating body: {} in every feature.
  const body =
    method === "GET" ? undefined : JSON.stringify(options.body ?? {});
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (options.tenant) headers.set("X-Tenant", options.tenant);

  let response: Response;
  try {
    response = await fetch(`/api/backend/${resource}${queryString}`, {
      method,
      headers,
      body,
      signal: options.signal,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      "Could not connect. Check your connection and try again.",
      0,
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const data =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    const errors: ValidationErrors = {};
    if (data.errors && typeof data.errors === "object") {
      for (const [key, messages] of Object.entries(data.errors)) {
        if (Array.isArray(messages))
          errors[key] = messages.filter(
            (value): value is string => typeof value === "string",
          );
      }
    }
    const validationMessage = Object.values(errors).flat()[0];
    const message =
      validationMessage ??
      (typeof data.message === "string"
        ? data.message
        : "The request failed. Please try again.");

    if (
      response.status === 401 &&
      resource !== "login" &&
      resource !== "register" &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(
        new CustomEvent("salon:unauthorized", {
          detail: {
            message:
              typeof data.message === "string"
                ? data.message
                : "Your session has expired. Please sign in again.",
          },
        }),
      );
    }

    throw new ApiError(message, response.status, errors);
  }

  if (payload === null && response.status !== 204) {
    throw new ApiError("The server returned an unexpected response.", 502);
  }
  return (response.status === 204 ? undefined : payload) as T;
}
