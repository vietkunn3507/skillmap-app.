import { auth } from "@/server/auth";
import { ensureDemo } from "@/server/demo-account";
import { sameOrigin } from "@/server/session";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (process.env.DEMO_ENABLED !== "true")
    return Response.json({ error: "Demo unavailable" }, { status: 404 });
  const { email, password } = await ensureDemo();
  return auth.api.signInEmail({
    body: { email, password },
    headers: request.headers,
    asResponse: true,
  });
}
