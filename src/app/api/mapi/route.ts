import { currentSession, sameOrigin } from "@/server/session";
import { getProfile } from "@/server/profiles";
import { generateGemini, geminiConfigured } from "@/server/mapi-gemini";
import type { MapiContext } from "@/lib/mapi";
import { answerWithLlm, validHistory, type MapiHistoryTurn } from "@/server/mapi-llm";
export const runtime = "nodejs";
const requests = new Map<
  string,
  { since: number; count: number; active: boolean }
>();
export async function GET() {
  if (!(await currentSession()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(
    { mode: (await geminiConfigured()) ? "llm" : "unavailable" },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Vui lòng đăng nhập lại." }, { status: 401 });
  const now = Date.now();
  for (const [id, value] of requests)
    if (!value.active && now - value.since > 600000) requests.delete(id);
  let question: string, context: MapiContext | undefined;
  let history: MapiHistoryTurn[] = [];
  try {
    const raw = await request.text();
    if (raw.length > 65000) throw Error();
    const body = JSON.parse(raw);
    if (
      typeof body.question !== "string" ||
      !body.question.trim() ||
      body.question.length > 2000
    )
      throw Error();
    question = body.question.trim();
    if (body.history !== undefined) {
      if (!validHistory(body.history)) throw Error();
      history = body.history;
    }
    if (body.context) {
      const c = body.context;
      if (
        !["career", "skill", "path", "job"].includes(c.kind) ||
        typeof c.value !== "string" ||
        !c.value ||
        c.value.length > 160 ||
        (c.kind === "job" && !/^\d{1,10}$/.test(c.value))
      )
        throw Error();
      context = c;
    }
  } catch {
    return Response.json(
      { error: "Câu hỏi hoặc ngữ cảnh chưa hợp lệ." },
      { status: 400 },
    );
  }
  const quota = requests.get(session.user.id) || {
    since: now,
    count: 0,
    active: false,
  };
  if (quota.active || quota.count >= 12)
    return Response.json(
      { error: "Bạn đã gửi nhiều câu hỏi. Hãy thử lại sau ít phút." },
      { status: 429 },
    );
  const origin = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  ).replace(/\/$/, "");
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(120000)]);
  async function read<T>(path: string, body?: unknown): Promise<T> {
    const r = await fetch(origin + "/api" + path, {
      method: body ? "POST" : "GET",
      body: body ? JSON.stringify(body) : undefined,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      cache: "no-store",
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    });
    if (!r.ok) throw Error();
    return r.json();
  }
  try {
    quota.active = true;
    quota.count++;
    requests.set(session.user.id, quota);
    const reply = await answerWithLlm(
      getProfile(session.user.id, session.user.name),
      question,
      context,
      read,
      signal,
      generateGemini,
      history,
    );
    return Response.json(reply, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "Mình chưa nhận được câu trả lời có nguồn hợp lệ từ dịch vụ dữ liệu hoặc mô hình. Bạn thử lại nhé.",
      },
      { status: 503 },
    );
  } finally {
    quota.active = false;
  }
}
