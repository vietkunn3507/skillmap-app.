import { auth } from "./auth.ts";
import { headers } from "next/headers";
export async function currentSession() {
  return auth.api.getSession({ headers: await headers() });
}
export function sameOrigin(request: Request) {
  return (
    request.headers.get("origin") ===
    (process.env.BETTER_AUTH_URL || "http://localhost:3000")
  );
}
