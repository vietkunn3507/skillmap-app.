import { currentSession } from "@/server/session";
import { db } from "@/server/db";
import { demoProfile } from "@/lib/profile-data";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { extractCvText } from "@/server/cv-text";
export const runtime = "nodejs";
export async function GET() {
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const row = db
    .prepare("SELECT filename,mime,content FROM career_cvs WHERE user_id=?")
    .get(session.user.id) as
    | { filename: string; mime: string; content: Uint8Array }
    | undefined;
  if (!row)
    return Response.json({ error: "Bạn chưa tải CV." }, { status: 404 });
  try {
    const hash = (b: Uint8Array) =>
      createHash("sha256").update(b).digest("hex");
    const isSample =
      row.filename === "CV_Phuong.pdf" &&
      hash(row.content) === hash(readFileSync("src/data/demo-cv.pdf"));
    if (isSample)
      return Response.json(
        {
          kind: "sample",
          filename: row.filename,
          profile: {
            name: demoProfile.name,
            education: demoProfile.education,
            field: demoProfile.field,
            target: demoProfile.target,
            skills: demoProfile.skills,
            tools: demoProfile.tools,
            tasks: demoProfile.tasks,
            languages: demoProfile.languages,
          },
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    const text = await extractCvText(row.mime, row.content);
    if (!text.trim())
      return Response.json(
        {
          error:
            "CV này chưa có văn bản đọc được. Bạn có thể tải tệp gốc hoặc dùng PDF có lớp văn bản.",
        },
        { status: 422 },
      );
    return Response.json(
      { kind: "document", filename: row.filename, text: text.slice(0, 150000) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Chưa đọc được CV này. Bạn có thể tải tệp gốc hoặc thử lại." },
      { status: 422 },
    );
  }
}
