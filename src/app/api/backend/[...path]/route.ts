import { currentSession } from "@/server/session";
import { NextRequest, NextResponse } from "next/server";
const allowed = new Set([
  "market/overview",
  "skills/top",
  "skills/growth",
  "intelligence/occupations",
  "skills/trend",
  "skills/seniority-gradient",
  "macro/skill-level-trend",
  "jobs",
  "career/match",
]);
async function forward(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!(await currentSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const path = (await params).path.join("/");
  if (!allowed.has(path) && !/^jobs\/\d+$/.test(path))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((request.method === "POST") !== (path === "career/match"))
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  try {
    const origin = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    ).replace(/\/$/, "");
    const response = await fetch(
      `${origin}/api/${path}${request.nextUrl.search}`,
      {
        method: request.method,
        headers: {
          Accept: "application/json",
          ...(request.method === "POST"
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body: request.method === "POST" ? await request.text() : undefined,
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      },
    );
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
export { forward as GET, forward as POST };
