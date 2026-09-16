import { currentSession, sameOrigin } from "@/server/session";
import { db } from "@/server/db";
import { getProfile, saveProfile } from "@/server/profiles";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const row = db
    .prepare("SELECT filename,mime,content FROM career_cvs WHERE user_id=?")
    .get(session.user.id) as
    | { filename: string; mime: string; content: Uint8Array }
    | undefined;
  if (!row) return Response.json({ error: "Chưa có CV." }, { status: 404 });
  return new Response(Buffer.from(row.content), {
    headers: {
      "Content-Type": row.mime,
      "Content-Disposition": `${new URL(request.url).searchParams.get("download") === "1" || row.mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(row.filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
    },
  });
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const reader = request.body?.getReader();
    if (!reader) throw Error("Không có tệp.");
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 11 * 1024 * 1024) {
        await reader.cancel();
        return Response.json({ error: "Tệp vượt quá 10 MB." }, { status: 413 });
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024)
      throw Error("Chọn tệp không rỗng, tối đa 10 MB.");
    const ext = file.name.toLowerCase().split(".").pop();
    const content = Buffer.from(await file.arrayBuffer());
    if (!["pdf", "docx", "txt"].includes(ext || ""))
      throw Error("Chỉ hỗ trợ PDF, DOCX hoặc TXT.");
    if (ext === "pdf" && !content.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw Error("Tệp PDF không hợp lệ.");
    if (ext === "docx" && content.subarray(0, 2).toString() !== "PK")
      throw Error("Tệp DOCX không hợp lệ.");
    const filename = file.name.replace(/[\x00-\x1f<>"/\\]/g, "_").slice(0, 150);
    const mime =
      ext === "pdf"
        ? "application/pdf"
        : ext === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "text/plain; charset=utf-8";
    db.prepare(
      "INSERT INTO career_cvs(user_id,filename,mime,content,created_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET filename=excluded.filename,mime=excluded.mime,content=excluded.content,extracted_text=NULL,created_at=excluded.created_at",
    ).run(session.user.id, filename, mime, content, new Date().toISOString());
    saveProfile(session.user.id, {
      ...getProfile(session.user.id, session.user.name),
      cv: { filename, status: "uploaded" },
    });
    return Response.json({ filename, status: "uploaded" });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Không tải được tệp." },
      { status: 400 },
    );
  }
}
