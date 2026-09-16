import { currentSession, sameOrigin } from "@/server/session";
import { getProfile, saveProfile, validatePatch } from "@/server/profiles";
export async function GET() {
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(getProfile(session.user.id, session.user.name), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (Number(request.headers.get("content-length") || 0) > 50000)
      throw Error("Too large");
    const patch = validatePatch(await request.json());
    const profile = {
      ...getProfile(session.user.id, session.user.name),
      ...patch,
    };
    saveProfile(session.user.id, profile);
    return Response.json(profile);
  } catch {
    return Response.json(
      { error: "Thông tin hồ sơ chưa hợp lệ." },
      { status: 400 },
    );
  }
}
