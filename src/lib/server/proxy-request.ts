import type { NextRequest } from "next/server";
const MAX_BODY_BYTES = 640 * 1024;
export async function readBody(request: NextRequest): Promise<string> {
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_BODY_BYTES)
    throw new RangeError("Request is too large.");
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RangeError("Request is too large.");
      }
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
