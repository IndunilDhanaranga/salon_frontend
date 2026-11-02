import { handleBackend } from "@/lib/server/backend-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export {
  handleBackend as GET,
  handleBackend as POST,
  handleBackend as PATCH,
  handleBackend as DELETE,
};
