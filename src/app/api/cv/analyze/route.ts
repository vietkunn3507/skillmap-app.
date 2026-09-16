import { extractProfileEvidence } from "@/server/cv-intelligence";
import { currentSession, sameOrigin } from "@/server/session";
import { db } from "@/server/db";
import { getProfile, saveProfile } from "@/server/profiles";
import { extractCvText } from "@/server/cv-text";
import { skillKey } from "@/lib/taxonomy";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const row = db
    .prepare("SELECT filename,mime,content FROM career_cvs WHERE user_id=?")
    .get(session.user.id) as
    | { filename: string; mime: string; content: Uint8Array }
    | undefined;
  if (!row)
    return Response.json({ error: "Bạn chưa tải CV." }, { status: 404 });
  try {
    const text = await extractCvText(row.mime, row.content);
    if (!text.trim())
      return Response.json(
        {
          error:
            "CV không có văn bản đọc được. Vui lòng tải PDF có văn bản, DOCX hoặc TXT.",
        },
        { status: 422 },
      );
    const origin = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    ).replace(/\/$/, "");
    const response = await fetch(origin + "/api/skills/top?limit=100", {
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!response.ok)
      throw Error("Không tải được danh mục kỹ năng. Vui lòng thử lại.");
    const registry = await response.json();
    const profile = getProfile(session.user.id, session.user.name);
    const candidates = [
      ...new Set([
        ...registry.skills.map(
          (s: { skill_display: string }) => s.skill_display,
        ),
        ...profile.skills,
      ]),
    ];
    const normalized = " " + skillKey(text.slice(0, 250000)) + " ";
    const detected = candidates.filter((s) =>
      new RegExp(
        "(?:^|[^a-z0-9])" +
          skillKey(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          "(?=$|[^a-z0-9])",
      ).test(normalized),
    );
    const extracted = await extractProfileEvidence(text, AbortSignal.any([request.signal, AbortSignal.timeout(90000)]));
    const skills = [...new Set([...profile.skills, ...detected, ...extracted.filter(e=>e.kind==="skill").map(e=>e.label)])];
    db.prepare("UPDATE career_cvs SET extracted_text=? WHERE user_id=?").run(
      text.slice(0, 250000),
      session.user.id,
    );
    saveProfile(session.user.id, {
      ...profile,
      skills,
      tasks: [...new Set([...profile.tasks,...extracted.filter(e=>e.kind==="task").map(e=>e.label)])],
      tools: [...new Set([...profile.tools,...extracted.filter(e=>e.kind==="tool").map(e=>e.label)])],
      languages: [...new Set([...profile.languages,...extracted.filter(e=>e.kind==="language").map(e=>e.label)])],
      cv: {
        filename: row.filename,
        status: "analyzed",
        analyzedAt: new Date().toISOString(),
      },
    });
    return Response.json({
      detected,
      evidence: extracted,
      message:
        "Đã đối chiếu kỹ năng và trích nhiệm vụ, công cụ, ngôn ngữ bằng Gemini với đoạn văn chứng minh. Vui lòng kiểm tra lại hồ sơ.",
    });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Không đọc được CV. Vui lòng thử tệp khác.",
      },
      { status: 422 },
    );
  }
}
